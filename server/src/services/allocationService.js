const Schedule = require('../models/Schedule');
const Student = require('../models/Student');
const StudentGroup = require('../models/StudentGroup');
const Room = require('../models/Room');
const Faculty = require('../models/Faculty');
const SeatingAllocation = require('../models/SeatingAllocation');
const InvigilatorAssignment = require('../models/InvigilatorAssignment');
const { isTimeOverlapping } = require('./conflictDetectionService');

/**
 * Automatically distributes students across one or multiple examination rooms
 * Respects room exam seating capacities and generates individual seat numbers
 */
const generateSeatingDistribution = async (scheduleId, specifiedRoomIds = []) => {
  const schedule = await Schedule.findById(scheduleId)
    .populate('examination')
    .populate('subject')
    .populate('studentGroup')
    .populate('room');

  if (!schedule) {
    throw new Error('Schedule entry not found');
  }

  // 1. Fetch all active students in the assigned student group, sorted by rollNumber
  const students = await Student.find({
    studentGroup: schedule.studentGroup._id,
    status: 'active'
  }).sort({ rollNumber: 1 });

  const totalStudents = students.length;
  if (totalStudents === 0) {
    throw new Error(`No active students found in student group "${schedule.studentGroup.name}".`);
  }

  // 2. Determine target rooms
  let targetRooms = [];

  if (specifiedRoomIds && specifiedRoomIds.length > 0) {
    targetRooms = await Room.find({ _id: { $in: specifiedRoomIds }, isAvailable: true });
  } else {
    // Default to the schedule's assigned room
    targetRooms = [schedule.room];

    // If schedule's primary room cannot fit all students, automatically discover additional free rooms
    if (schedule.room.examCapacity < totalStudents) {
      const neededExtra = totalStudents - schedule.room.examCapacity;

      // Find other rooms that are available and not booked during this schedule's time window
      const allCandidateRooms = await Room.find({
        _id: { $ne: schedule.room._id },
        isAvailable: true
      }).sort({ examCapacity: -1 });

      const dayStart = new Date(schedule.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(schedule.date);
      dayEnd.setHours(23, 59, 59, 999);

      const existingOccupied = await Schedule.find({
        date: { $gte: dayStart, $lte: dayEnd },
        _id: { $ne: schedule._id },
        status: { $ne: 'cancelled' }
      });

      for (const candidate of allCandidateRooms) {
        const isOccupied = existingOccupied.some(occ =>
          occ.room.toString() === candidate._id.toString() &&
          isTimeOverlapping(schedule.startDateTime, schedule.endDateTime, occ.startDateTime, occ.endDateTime)
        );

        if (!isOccupied) {
          targetRooms.push(candidate);
          const currentTotalCap = targetRooms.reduce((sum, r) => sum + r.examCapacity, 0);
          if (currentTotalCap >= totalStudents) break;
        }
      }
    }
  }

  // 3. Verify total aggregate capacity
  const totalAvailableSeats = targetRooms.reduce((sum, r) => sum + r.examCapacity, 0);
  if (totalAvailableSeats < totalStudents) {
    throw new Error(
      `Insufficient room capacity! Total ${totalStudents} students need seating, but selected room(s) only provide ${totalAvailableSeats} exam seats (Deficit: ${totalStudents - totalAvailableSeats} seats). Please assign additional rooms.`
    );
  }

  // 4. Clear previous seating for this schedule
  await SeatingAllocation.deleteMany({ schedule: schedule._id });

  // 5. Sequential Seating Distribution Algorithm
  const allocationsToInsert = [];
  const roomBreakdown = [];
  let studentIndex = 0;

  for (const currentRoom of targetRooms) {
    const seatsInThisRoom = Math.min(currentRoom.examCapacity, totalStudents - studentIndex);
    if (seatsInThisRoom <= 0) break;

    const startSeatNumber = `${currentRoom.roomNumber}-S001`;
    let endSeatNumber = '';

    for (let bench = 1; bench <= seatsInThisRoom; bench++) {
      const student = students[studentIndex];
      const seatCode = `${currentRoom.roomNumber}-S${String(bench).padStart(3, '0')}`;
      endSeatNumber = seatCode;

      allocationsToInsert.push({
        examination: schedule.examination._id,
        schedule: schedule._id,
        student: student._id,
        studentGroup: schedule.studentGroup._id,
        room: currentRoom._id,
        seatNumber: seatCode,
        benchNumber: bench,
        deskPosition: 'Single',
        attendanceStatus: 'allocated'
      });

      studentIndex++;
      if (studentIndex >= totalStudents) break;
    }

    roomBreakdown.push({
      roomId: currentRoom._id,
      roomNumber: currentRoom.roomNumber,
      building: currentRoom.building,
      capacity: currentRoom.examCapacity,
      allocatedCount: seatsInThisRoom,
      seatRange: `${startSeatNumber} to ${endSeatNumber}`
    });

    if (studentIndex >= totalStudents) break;
  }

  // 6. Bulk Insert Allocations
  await SeatingAllocation.insertMany(allocationsToInsert);

  return {
    success: true,
    totalStudentsSeated: allocationsToInsert.length,
    roomBreakdown,
    schedule: {
      _id: schedule._id,
      subject: schedule.subject?.code,
      group: schedule.studentGroup?.name,
      date: schedule.date,
      time: `${schedule.startTime} - ${schedule.endTime}`
    }
  };
};

/**
 * Analyzes faculty workload and duty limits across an examination session
 */
const getFacultyWorkloadReport = async (examinationId) => {
  const facultyMembers = await Faculty.find({ status: { $ne: 'inactive' } }).sort({ department: 1, name: 1 });

  const query = examinationId ? { examination: examinationId } : {};
  const assignments = await InvigilatorAssignment.find(query)
    .populate('schedule', 'date startTime endTime')
    .populate('room', 'roomNumber');

  const report = facultyMembers.map((fac) => {
    const facAssignments = assignments.filter(a => a.faculty.toString() === fac._id.toString());
    const assignedCount = facAssignments.length;
    const maxLimit = fac.maxInvigilationsPerWeek || 5;
    const remainingQuota = Math.max(0, maxLimit - assignedCount);

    let workloadStatus = 'Normal';
    if (assignedCount === 0) workloadStatus = 'Unassigned';
    else if (assignedCount >= maxLimit) workloadStatus = 'At Capacity';
    else if (assignedCount >= maxLimit - 1) workloadStatus = 'High';

    return {
      _id: fac._id,
      facultyId: fac.facultyId,
      name: fac.name,
      email: fac.email,
      department: fac.department,
      designation: fac.designation,
      maxLimit,
      assignedCount,
      remainingQuota,
      workloadStatus,
      assignments: facAssignments
    };
  });

  return report;
};

/**
 * Assigns an invigilator to an exam schedule with overlap and workload checks
 */
const assignInvigilator = async ({ examinationId, scheduleId, facultyId, roomId, role, notes }) => {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) throw new Error('Schedule entry not found');

  const faculty = await Faculty.findById(facultyId);
  if (!faculty) throw new Error('Faculty member not found');
  if (faculty.status !== 'active') {
    throw new Error(`Faculty ${faculty.name} is currently marked "${faculty.status}" and cannot take exam duties.`);
  }

  const room = roomId ? await Room.findById(roomId) : schedule.room;

  // Check if faculty has an overlapping schedule assignment
  const dayStart = new Date(schedule.date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(schedule.date);
  dayEnd.setHours(23, 59, 59, 999);

  const existingAssignments = await InvigilatorAssignment.find({
    faculty: facultyId,
    _id: { $ne: scheduleId }
  }).populate('schedule');

  for (const item of existingAssignments) {
    if (
      item.schedule &&
      isTimeOverlapping(schedule.startDateTime, schedule.endDateTime, item.schedule.startDateTime, item.schedule.endDateTime)
    ) {
      throw new Error(
        `Faculty Clashes Detected: ${faculty.name} is already assigned to invigilate in Room ${item.room} from ${item.schedule.startTime} to ${item.schedule.endTime}.`
      );
    }
  }

  // Create or Update InvigilatorAssignment
  let assignment = await InvigilatorAssignment.findOne({
    schedule: scheduleId,
    faculty: facultyId
  });

  if (assignment) {
    assignment.room = room._id;
    assignment.role = role || assignment.role;
    assignment.notes = notes || assignment.notes;
    await assignment.save();
  } else {
    assignment = await InvigilatorAssignment.create({
      examination: examinationId || schedule.examination,
      schedule: scheduleId,
      faculty: facultyId,
      room: room._id,
      role: role || 'assistant_invigilator',
      reportingTime: '30 mins before start',
      notes: notes || ''
    });
  }

  // Sync with Schedule model
  schedule.invigilator = facultyId;
  await schedule.save();

  return assignment;
};

/**
 * Automatically balances and distributes invigilation duties to all unassigned slots
 */
const autoBalanceInvigilators = async (examinationId) => {
  const unassignedSchedules = await Schedule.find({
    examination: examinationId,
    invigilator: null
  }).sort({ date: 1, startTime: 1 });

  if (unassignedSchedules.length === 0) {
    return { success: true, message: 'All scheduled examinations already have invigilators assigned.', allocatedCount: 0 };
  }

  const facultyMembers = await Faculty.find({ status: 'active' });
  if (facultyMembers.length === 0) {
    throw new Error('No active faculty members found in records.');
  }

  let allocatedCount = 0;

  for (const sched of unassignedSchedules) {
    // Refresh workload counts
    const workload = await getFacultyWorkloadReport(examinationId);

    // Filter faculty members who are under quota
    const eligibleFaculty = workload
      .filter(f => f.assignedCount < f.maxLimit)
      .sort((a, b) => a.assignedCount - b.assignedCount); // Lowest duty first for balance

    let assignedFaculty = null;

    for (const cand of eligibleFaculty) {
      // Check time overlap
      const hasClash = cand.assignments.some(a =>
        a.schedule &&
        isTimeOverlapping(sched.startDateTime, sched.endDateTime, a.schedule.startDateTime, a.schedule.endDateTime)
      );

      if (!hasClash) {
        assignedFaculty = cand;
        break;
      }
    }

    if (assignedFaculty) {
      await assignInvigilator({
        examinationId,
        scheduleId: sched._id,
        facultyId: assignedFaculty._id,
        roomId: sched.room,
        role: 'assistant_invigilator'
      });
      allocatedCount++;
    }
  }

  return {
    success: true,
    message: `Balanced and assigned invigilator duties to ${allocatedCount} examination slot(s).`,
    allocatedCount,
    remainingUnassigned: unassignedSchedules.length - allocatedCount
  };
};

module.exports = {
  generateSeatingDistribution,
  getFacultyWorkloadReport,
  assignInvigilator,
  autoBalanceInvigilators
};
