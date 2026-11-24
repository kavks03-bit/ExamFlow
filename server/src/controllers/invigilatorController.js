const InvigilatorAssignment = require('../models/InvigilatorAssignment');
const Schedule = require('../models/Schedule');
const AuditLog = require('../models/AuditLog');
const {
  getFacultyWorkloadReport,
  assignInvigilator,
  autoBalanceInvigilators
} = require('../services/allocationService');

// @route   GET /api/invigilators/workload
// @desc    Get faculty invigilation workload analysis
// @access  Private
exports.getWorkload = async (req, res, next) => {
  try {
    const { examination } = req.query;
    const report = await getFacultyWorkloadReport(examination);
    res.status(200).json({ success: true, count: report.length, data: report });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/invigilators/assignments
// @desc    Get all invigilation assignments
// @access  Private
exports.getAssignments = async (req, res, next) => {
  try {
    const { examination, schedule, faculty } = req.query;
    let query = {};
    if (examination) query.examination = examination;
    if (schedule) query.schedule = schedule;
    if (faculty) query.faculty = faculty;

    const assignments = await InvigilatorAssignment.find(query)
      .populate('faculty', 'facultyId name email department designation phone')
      .populate('room', 'roomNumber building floor')
      .populate({
        path: 'schedule',
        populate: [
          { path: 'subject', select: 'code name' },
          { path: 'studentGroup', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/invigilators/assign
// @desc    Assign faculty to an exam slot
// @access  Private (Admin)
exports.createAssignment = async (req, res, next) => {
  try {
    const { examinationId, scheduleId, facultyId, roomId, role, notes } = req.body;

    const assignment = await assignInvigilator({
      examinationId,
      scheduleId,
      facultyId,
      roomId,
      role,
      notes
    });

    try {
      await AuditLog.create({
        action: 'UPDATE',
        module: 'INVIGILATION',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: assignment._id.toString(),
        targetTitle: `Invigilation Assignment`,
        details: req.body
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Invigilator assigned successfully to examination room.',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/invigilators/auto-assign/:examinationId
// @desc    Automatically balance and assign invigilators
// @access  Private (Admin)
exports.autoAssign = async (req, res, next) => {
  try {
    const result = await autoBalanceInvigilators(req.params.examinationId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/invigilators/:id
// @desc    Remove invigilator assignment
// @access  Private (Admin)
exports.deleteAssignment = async (req, res, next) => {
  try {
    const assignment = await InvigilatorAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment record not found' });
    }

    // Clear reference in Schedule
    await Schedule.findByIdAndUpdate(assignment.schedule, { invigilator: null });

    res.status(200).json({ success: true, message: 'Invigilator duty unassigned successfully' });
  } catch (error) {
    next(error);
  }
};
