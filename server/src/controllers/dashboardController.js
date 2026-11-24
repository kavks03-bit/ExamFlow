const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Room = require('../models/Room');
const StudentGroup = require('../models/StudentGroup');
const Examination = require('../models/Examination');
const Schedule = require('../models/Schedule');
const InvigilatorAssignment = require('../models/InvigilatorAssignment');
const SeatingAllocation = require('../models/SeatingAllocation');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/dashboard/admin
// @desc    Get aggregate metrics and analytics for Admin Dashboard
// @access  Private (Admin)
exports.getAdminDashboardMetrics = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalSubjects,
      totalRooms,
      totalGroups,
      totalExams,
      publishedExams,
      schedules,
      recentAudits,
      roomsList
    ] = await Promise.all([
      Student.countDocuments(),
      Faculty.countDocuments(),
      Subject.countDocuments(),
      Room.countDocuments(),
      StudentGroup.countDocuments(),
      Examination.countDocuments(),
      Examination.countDocuments({ status: 'published' }),
      Schedule.find().populate('room', 'roomNumber examCapacity').populate('subject', 'department code'),
      AuditLog.find().sort({ createdAt: -1 }).limit(8),
      Room.find()
    ]);

    const totalScheduledSlots = schedules.length;
    const unresolvedConflicts = schedules.filter(s => s.hasConflicts).length;
    const validSlots = totalScheduledSlots - unresolvedConflicts;

    // Calculate room utilization (count of slots booked per room)
    const roomUtilization = roomsList.map(room => {
      const bookedSlots = schedules.filter(s => s.room && s.room._id.toString() === room._id.toString()).length;
      return {
        roomNumber: room.roomNumber,
        building: room.building,
        examCapacity: room.examCapacity,
        bookedSlots,
        utilizationRate: Math.min(100, Math.round((bookedSlots / 10) * 100))
      };
    });

    // Department Distribution
    const departments = ['Computer Science', 'Electronics & Communication', 'Information Technology', 'Applied Sciences'];
    const deptDistribution = await Promise.all(
      departments.map(async (dept) => {
        const studentCount = await Student.countDocuments({ department: dept });
        const subjectCount = await Subject.countDocuments({ department: dept });
        return { department: dept, students: studentCount, subjects: subjectCount };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalFaculty,
          totalSubjects,
          totalRooms,
          totalGroups,
          totalExams,
          publishedExams,
          totalScheduledSlots,
          unresolvedConflicts,
          validSlots
        },
        roomUtilization,
        deptDistribution,
        recentAudits
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/dashboard/faculty
// @desc    Get personalized invigilation duties for logged-in Faculty
// @access  Private (Faculty)
exports.getFacultyDashboard = async (req, res, next) => {
  try {
    // Find faculty profile for logged in user
    let faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) {
      // Fallback by email match
      faculty = await Faculty.findOne({ email: req.user.email });
    }

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found for this user account.'
      });
    }

    const assignments = await InvigilatorAssignment.find({ faculty: faculty._id })
      .populate('room', 'roomNumber building floor benchCount')
      .populate('examination', 'title session status')
      .populate({
        path: 'schedule',
        populate: [
          { path: 'subject', select: 'code name credits type' },
          { path: 'studentGroup', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    const totalAssigned = assignments.length;
    const maxQuota = faculty.maxInvigilationsPerWeek || 5;

    res.status(200).json({
      success: true,
      data: {
        faculty: {
          _id: faculty._id,
          facultyId: faculty.facultyId,
          name: faculty.name,
          department: faculty.department,
          designation: faculty.designation,
          maxLimit: maxQuota,
          assignedCount: totalAssigned,
          remainingQuota: Math.max(0, maxQuota - totalAssigned)
        },
        assignments
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/dashboard/student
// @desc    Get published examination timetable and assigned seat for logged-in Student
// @access  Private (Student)
exports.getStudentDashboard = async (req, res, next) => {
  try {
    let student = await Student.findOne({ user: req.user._id }).populate('studentGroup');
    if (!student) {
      student = await Student.findOne({ email: req.user.email }).populate('studentGroup');
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found for this user account.'
      });
    }

    // Students can ONLY view PUBLISHED schedules for their enrolled group
    const publishedSchedules = await Schedule.find({
      studentGroup: student.studentGroup?._id,
      status: 'published'
    })
      .populate('examination', 'title session status')
      .populate('subject', 'code name credits type')
      .populate('room', 'roomNumber building floor')
      .sort({ date: 1, startTime: 1 });

    // Also fetch the student's exact seating allocations
    const seatingRecords = await SeatingAllocation.find({ student: student._id })
      .populate('room', 'roomNumber building floor')
      .populate('schedule');

    // Combine timetable with seat info
    const timetableWithSeating = publishedSchedules.map(sched => {
      const seat = seatingRecords.find(s => s.schedule && s.schedule._id.toString() === sched._id.toString());
      return {
        _id: sched._id,
        examination: sched.examination,
        subject: sched.subject,
        date: sched.date,
        startTime: sched.startTime,
        endTime: sched.endTime,
        durationMinutes: sched.durationMinutes,
        room: seat ? seat.room : sched.room,
        seatNumber: seat ? seat.seatNumber : 'Unallocated (Report to Center)',
        benchNumber: seat ? seat.benchNumber : 'TBD'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          rollNumber: student.rollNumber,
          name: student.name,
          email: student.email,
          department: student.department,
          semester: student.semester,
          groupName: student.studentGroup?.name
        },
        timetable: timetableWithSeating,
        totalExams: timetableWithSeating.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/dashboard/audits
// @desc    Get complete audit log history
// @access  Private (Admin)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { module, action, search } = req.query;
    let query = {};
    if (module) query.module = module;
    if (action) query.action = action;
    if (search) {
      query.$or = [
        { performerName: { $regex: search, $options: 'i' } },
        { targetTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const audits = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: audits.length,
      data: audits
    });
  } catch (error) {
    next(error);
  }
};
