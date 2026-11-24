const Schedule = require('../models/Schedule');
const Room = require('../models/Room');
const Student = require('../models/Student');
const StudentGroup = require('../models/StudentGroup');
const Faculty = require('../models/Faculty');
const Examination = require('../models/Examination');
const Subject = require('../models/Subject');

/**
 * Parses date string (YYYY-MM-DD) and time strings (HH:mm) into combined Date objects
 */
const buildDateTimes = (dateInput, startTimeStr, endTimeStr) => {
  const dateObj = new Date(dateInput);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();

  const [startHour, startMin] = startTimeStr.split(':').map(Number);
  const [endHour, endMin] = endTimeStr.split(':').map(Number);

  const startDateTime = new Date(year, month, day, startHour, startMin, 0);
  const endDateTime = new Date(year, month, day, endHour, endMin, 0);

  const durationMinutes = Math.round((endDateTime - startDateTime) / (1000 * 60));

  return { startDateTime, endDateTime, durationMinutes };
};

/**
 * Checks if two open time intervals (startA, endA) and (startB, endB) overlap
 * Condition: startA < endB AND endA > startB
 */
const isTimeOverlapping = (startA, endA, startB, endB) => {
  return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
};

/**
 * Full Conflict Detection Engine
 * Evaluates candidate schedule against all 5 academic scheduling rules
 */
const detectConflicts = async ({
  examinationId,
  subjectId,
  studentGroupId,
  roomId,
  invigilatorId,
  date,
  startTime,
  endTime,
  excludeScheduleId = null
}) => {
  const conflicts = [];

  // Rule 0: Basic Time Interval Validity
  const { startDateTime, endDateTime, durationMinutes } = buildDateTimes(date, startTime, endTime);

  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    conflicts.push({
      type: 'TIME_INVALID',
      severity: 'ERROR',
      message: 'Invalid examination date or time format provided.',
      conflictingEntity: 'Time Interval'
    });
    return { hasConflicts: true, conflicts, startDateTime, endDateTime, durationMinutes };
  }

  if (endDateTime <= startDateTime) {
    conflicts.push({
      type: 'TIME_INVALID',
      severity: 'ERROR',
      message: `Invalid examination duration: End time (${endTime}) must be strictly after start time (${startTime}).`,
      conflictingEntity: 'Time Interval'
    });
  } else if (durationMinutes < 30) {
    conflicts.push({
      type: 'TIME_INVALID',
      severity: 'ERROR',
      message: `Examination duration (${durationMinutes} mins) is too short. Minimum allowed duration is 30 minutes.`,
      conflictingEntity: 'Duration'
    });
  } else if (durationMinutes > 360) {
    conflicts.push({
      type: 'TIME_INVALID',
      severity: 'WARNING',
      message: `Examination duration (${durationMinutes / 60} hours) exceeds customary 6-hour limit.`,
      conflictingEntity: 'Duration'
    });
  }

  // Check Examination Session Date Boundaries
  if (examinationId) {
    const examSession = await Examination.findById(examinationId);
    if (examSession) {
      const scheduleDate = new Date(date).setHours(0, 0, 0, 0);
      const sessionStart = new Date(examSession.startDate).setHours(0, 0, 0, 0);
      const sessionEnd = new Date(examSession.endDate).setHours(23, 59, 59, 999);

      if (scheduleDate < sessionStart || scheduleDate > sessionEnd) {
        conflicts.push({
          type: 'TIME_INVALID',
          severity: 'ERROR',
          message: `Scheduled date (${new Date(date).toLocaleDateString()}) is outside the examination session window (${new Date(examSession.startDate).toLocaleDateString()} to ${new Date(examSession.endDate).toLocaleDateString()}).`,
          conflictingEntity: examSession.title
        });
      }
    }
  }

  // Define date window query (same calendar day)
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const baseQuery = {
    date: { $gte: dayStart, $lte: dayEnd },
    status: { $ne: 'cancelled' }
  };
  if (excludeScheduleId) {
    baseQuery._id = { $ne: excludeScheduleId };
  }

  // Rule 1: Student Group Conflict Detection
  // Prevent same student group from having overlapping examinations
  if (studentGroupId) {
    const groupSchedules = await Schedule.find({
      ...baseQuery,
      studentGroup: studentGroupId
    }).populate('subject', 'code name').populate('room', 'roomNumber');

    for (const existing of groupSchedules) {
      if (isTimeOverlapping(startDateTime, endDateTime, existing.startDateTime, existing.endDateTime)) {
        conflicts.push({
          type: 'STUDENT_OVERLAP',
          severity: 'ERROR',
          message: `Student Overlap: Group is already scheduled for "${existing.subject?.code || 'Another Subject'}" (${existing.startTime} - ${existing.endTime}) in Room ${existing.room?.roomNumber || 'Unknown'}.`,
          conflictingEntity: existing.subject?.code || 'Student Group'
        });
      }
    }
  }

  // Rule 2: Room Double-Booking Overlap Detection
  // Prevent two different exams from occupying the same room at the same time
  if (roomId) {
    const room = await Room.findById(roomId);
    if (!room) {
      conflicts.push({
        type: 'ROOM_OVERLAP',
        severity: 'ERROR',
        message: 'Selected examination room does not exist in records.',
        conflictingEntity: 'Room'
      });
    } else if (!room.isAvailable) {
      conflicts.push({
        type: 'ROOM_OVERLAP',
        severity: 'ERROR',
        message: `Room ${room.roomNumber} is currently marked unavailable (Maintenance/Renovation).`,
        conflictingEntity: room.roomNumber
      });
    } else {
      const roomSchedules = await Schedule.find({
        ...baseQuery,
        room: roomId
      }).populate('subject', 'code name').populate('studentGroup', 'name');

      for (const existing of roomSchedules) {
        if (isTimeOverlapping(startDateTime, endDateTime, existing.startDateTime, existing.endDateTime)) {
          conflicts.push({
            type: 'ROOM_OVERLAP',
            severity: 'ERROR',
            message: `Room Overlap: Room ${room.roomNumber} is already booked for "${existing.subject?.code}" (${existing.studentGroup?.name}) from ${existing.startTime} to ${existing.endTime}.`,
            conflictingEntity: room.roomNumber
          });
        }
      }

      // Rule 3: Room Exam Seating Capacity Validation
      if (studentGroupId) {
        const studentCount = await Student.countDocuments({ studentGroup: studentGroupId, status: 'active' });
        const group = await StudentGroup.findById(studentGroupId);
        const candidatesToSeat = studentCount > 0 ? studentCount : (group?.capacity || 40);

        if (candidatesToSeat > room.examCapacity) {
          conflicts.push({
            type: 'ROOM_CAPACITY',
            severity: 'ERROR',
            message: `Capacity Violation: Room ${room.roomNumber} has exam seating capacity of ${room.examCapacity} candidates, but group "${group?.name || 'Selected Group'}" has ${candidatesToSeat} students (Deficit: ${candidatesToSeat - room.examCapacity} seats).`,
            conflictingEntity: room.roomNumber
          });
        }
      }
    }
  }

  // Rule 4: Faculty Invigilation Conflict Detection
  // Prevent faculty from being assigned to two rooms at the same time
  if (invigilatorId) {
    const faculty = await Faculty.findById(invigilatorId);
    if (faculty) {
      if (faculty.status !== 'active') {
        conflicts.push({
          type: 'FACULTY_OVERLAP',
          severity: 'ERROR',
          message: `Faculty ${faculty.name} is currently marked "${faculty.status}".`,
          conflictingEntity: faculty.name
        });
      } else {
        const facultySchedules = await Schedule.find({
          ...baseQuery,
          invigilator: invigilatorId
        }).populate('room', 'roomNumber').populate('subject', 'code');

        for (const existing of facultySchedules) {
          if (isTimeOverlapping(startDateTime, endDateTime, existing.startDateTime, existing.endDateTime)) {
            conflicts.push({
              type: 'FACULTY_OVERLAP',
              severity: 'ERROR',
              message: `Faculty Double-Booking: ${faculty.name} is already invigilating "${existing.subject?.code}" in Room ${existing.room?.roomNumber} from ${existing.startTime} to ${existing.endTime}.`,
              conflictingEntity: faculty.name
            });
          }
        }
      }
    }
  }

  return {
    hasConflicts: conflicts.some(c => c.severity === 'ERROR'),
    conflicts,
    startDateTime,
    endDateTime,
    durationMinutes
  };
};

/**
 * Validates all schedules for an entire examination before publication
 * Returns total error count and blocks publication if any errors exist
 */
const validateEntireExamination = async (examinationId) => {
  const schedules = await Schedule.find({ examination: examinationId })
    .populate('subject', 'code name')
    .populate('studentGroup', 'name')
    .populate('room', 'roomNumber examCapacity')
    .populate('invigilator', 'name');

  const report = {
    totalSchedules: schedules.length,
    validSchedules: 0,
    conflictSchedules: 0,
    unresolvedErrors: []
  };

  for (const item of schedules) {
    const result = await detectConflicts({
      examinationId: item.examination,
      subjectId: item.subject?._id,
      studentGroupId: item.studentGroup?._id,
      roomId: item.room?._id,
      invigilatorId: item.invigilator?._id,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      excludeScheduleId: item._id
    });

    item.conflicts = result.conflicts;
    item.hasConflicts = result.hasConflicts;
    item.status = result.hasConflicts ? 'conflict' : 'scheduled';
    await item.save();

    if (result.hasConflicts) {
      report.conflictSchedules++;
      report.unresolvedErrors.push({
        scheduleId: item._id,
        subject: item.subject?.code,
        group: item.studentGroup?.name,
        room: item.room?.roomNumber,
        date: item.date,
        time: `${item.startTime} - ${item.endTime}`,
        conflicts: result.conflicts
      });
    } else {
      report.validSchedules++;
    }
  }

  return report;
};

/**
 * Basic Automatic Timetable Slot Suggestion Algorithm
 * Finds an available date, standard slot (09:30-12:30 or 14:00-17:00), and conflict-free room
 */
const suggestNextValidSlot = async (examinationId, subjectId, studentGroupId) => {
  const exam = await Examination.findById(examinationId);
  if (!exam) throw new Error('Examination session not found');

  const studentCount = await Student.countDocuments({ studentGroup: studentGroupId, status: 'active' });
  const group = await StudentGroup.findById(studentGroupId);
  const neededCapacity = studentCount > 0 ? studentCount : (group?.capacity || 40);

  // Available rooms with adequate capacity
  const eligibleRooms = await Room.find({
    isAvailable: true,
    examCapacity: { $gte: neededCapacity }
  }).sort({ examCapacity: 1 });

  if (eligibleRooms.length === 0) {
    return {
      success: false,
      message: `No room on campus has sufficient exam capacity (${neededCapacity} seats) for this student group.`
    };
  }

  // Standard exam slots
  const standardSlots = [
    { start: '09:30', end: '12:30', label: 'Morning Slot (09:30 AM - 12:30 PM)' },
    { start: '14:00', end: '17:00', label: 'Afternoon Slot (02:00 PM - 05:00 PM)' }
  ];

  // Iterate dates between exam startDate and endDate
  const curDate = new Date(exam.startDate);
  const endDate = new Date(exam.endDate);

  while (curDate <= endDate) {
    // Skip Sundays
    if (curDate.getDay() !== 0) {
      const dateStr = curDate.toISOString().split('T')[0];

      for (const slot of standardSlots) {
        for (const room of eligibleRooms) {
          const check = await detectConflicts({
            examinationId,
            subjectId,
            studentGroupId,
            roomId: room._id,
            date: dateStr,
            startTime: slot.start,
            endTime: slot.end
          });

          if (!check.hasConflicts) {
            return {
              success: true,
              suggestion: {
                date: dateStr,
                startTime: slot.start,
                endTime: slot.end,
                slotLabel: slot.label,
                room: {
                  _id: room._id,
                  roomNumber: room.roomNumber,
                  building: room.building,
                  examCapacity: room.examCapacity
                },
                neededCapacity
              }
            };
          }
        }
      }
    }
    curDate.setDate(curDate.getDate() + 1);
  }

  return {
    success: false,
    message: 'Could not find a conflict-free slot and room within the examination date range.'
  };
};

module.exports = {
  buildDateTimes,
  isTimeOverlapping,
  detectConflicts,
  validateEntireExamination,
  suggestNextValidSlot
};
