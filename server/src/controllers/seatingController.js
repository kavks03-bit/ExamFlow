const SeatingAllocation = require('../models/SeatingAllocation');
const Schedule = require('../models/Schedule');
const AuditLog = require('../models/AuditLog');
const { generateSeatingDistribution } = require('../services/allocationService');

// @route   GET /api/seating
// @desc    Get seating plan for a specific schedule
// @access  Private
exports.getSeatingPlan = async (req, res, next) => {
  try {
    const { schedule, room, student } = req.query;
    let query = {};
    if (schedule) query.schedule = schedule;
    if (room) query.room = room;
    if (student) query.student = student;

    const allocations = await SeatingAllocation.find(query)
      .populate('student', 'rollNumber name email')
      .populate('studentGroup', 'name department')
      .populate('room', 'roomNumber building floor')
      .populate({
        path: 'schedule',
        populate: [
          { path: 'subject', select: 'code name' },
          { path: 'examination', select: 'title session status' }
        ]
      })
      .sort({ room: 1, benchNumber: 1, seatNumber: 1 });

    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/seating/generate
// @desc    Generate seating allocation across room(s)
// @access  Private (Admin)
exports.generateSeating = async (req, res, next) => {
  try {
    const { scheduleId, specifiedRoomIds } = req.body;

    if (!scheduleId) {
      return res.status(400).json({ success: false, message: 'Schedule ID is required' });
    }

    const result = await generateSeatingDistribution(scheduleId, specifiedRoomIds);

    try {
      await AuditLog.create({
        action: 'SEATING_ALLOCATION',
        module: 'SEATING',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: scheduleId,
        targetTitle: `Seating Allocation`,
        details: { totalStudents: result.totalStudentsSeated, rooms: result.roomBreakdown }
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: `Seating plan generated! Distributed ${result.totalStudentsSeated} students successfully.`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/seating/clear/:scheduleId
// @desc    Clear seating allocations for a schedule
// @access  Private (Admin)
exports.clearSeating = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const deleted = await SeatingAllocation.deleteMany({ schedule: scheduleId });

    res.status(200).json({
      success: true,
      message: `Cleared ${deleted.deletedCount} seating allocations for this schedule.`
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/seating/my-seating
// @desc    Get logged-in student's seating allocations
// @access  Private (Student)
exports.getMySeating = async (req, res, next) => {
  try {
    const Student = require('../models/Student');
    const student = await Student.findOne({ user: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not linked to this user' });
    }

    const allocations = await SeatingAllocation.find({ student: student._id })
      .populate('room', 'roomNumber building floor')
      .populate({
        path: 'schedule',
        populate: [
          { path: 'subject', select: 'code name' },
          { path: 'examination', select: 'title session status' }
        ]
      })
      .sort({ 'schedule.date': 1 });

    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations
    });
  } catch (error) {
    next(error);
  }
};
