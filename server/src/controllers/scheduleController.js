const Schedule = require('../models/Schedule');
const Examination = require('../models/Examination');
const AuditLog = require('../models/AuditLog');
const {
  detectConflicts,
  validateEntireExamination,
  suggestNextValidSlot
} = require('../services/conflictDetectionService');

// @route   GET /api/schedules
// @desc    Get all exam schedules with optional filters
// @access  Private
exports.getSchedules = async (req, res, next) => {
  try {
    const { examination, studentGroup, room, invigilator, date, status } = req.query;
    let query = {};

    if (examination) query.examination = examination;
    if (studentGroup) query.studentGroup = studentGroup;
    if (room) query.room = room;
    if (invigilator) query.invigilator = invigilator;
    if (status) query.status = status;

    if (date) {
      const dStart = new Date(date);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(date);
      dEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dStart, $lte: dEnd };
    }

    const schedules = await Schedule.find(query)
      .populate('examination', 'title session examSeries status')
      .populate('subject', 'code name department credits type')
      .populate('studentGroup', 'name department semester capacity')
      .populate('room', 'roomNumber building benchCount examCapacity')
      .populate('invigilator', 'facultyId name department designation')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/schedules/:id
// @desc    Get single schedule with conflict details
// @access  Private
exports.getScheduleById = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('examination')
      .populate('subject')
      .populate('studentGroup')
      .populate('room')
      .populate('invigilator');

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule entry not found' });
    }

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/schedules/validate-slot
// @desc    Live pre-validation endpoint for React UI form
// @access  Private
exports.validateSlot = async (req, res, next) => {
  try {
    const {
      examinationId,
      subjectId,
      studentGroupId,
      roomId,
      invigilatorId,
      date,
      startTime,
      endTime,
      excludeScheduleId
    } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Date, start time, and end time are required for validation.'
      });
    }

    const result = await detectConflicts({
      examinationId,
      subjectId,
      studentGroupId,
      roomId,
      invigilatorId,
      date,
      startTime,
      endTime,
      excludeScheduleId
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/schedules
// @desc    Create new schedule entry with conflict prevention
// @access  Private (Admin)
exports.createSchedule = async (req, res, next) => {
  try {
    const {
      examination,
      subject,
      studentGroup,
      room,
      invigilator,
      date,
      startTime,
      endTime,
      notes,
      allowConflictSave = false
    } = req.body;

    // Run Conflict Detection
    const validation = await detectConflicts({
      examinationId: examination,
      subjectId: subject,
      studentGroupId: studentGroup,
      roomId: room,
      invigilatorId: invigilator || null,
      date,
      startTime,
      endTime
    });

    // If hard errors exist and user did not explicitly override
    if (validation.hasConflicts && !allowConflictSave) {
      return res.status(400).json({
        success: false,
        message: 'Scheduling Conflict Detected! Please resolve the conflicts before saving.',
        hasConflicts: true,
        conflicts: validation.conflicts
      });
    }

    const schedule = await Schedule.create({
      examination,
      subject,
      studentGroup,
      room,
      invigilator: invigilator || null,
      date: new Date(date),
      startTime,
      endTime,
      startDateTime: validation.startDateTime,
      endDateTime: validation.endDateTime,
      durationMinutes: validation.durationMinutes,
      status: validation.hasConflicts ? 'conflict' : 'scheduled',
      conflicts: validation.conflicts,
      hasConflicts: validation.hasConflicts,
      notes: notes || ''
    });

    const populated = await Schedule.findById(schedule._id)
      .populate('subject', 'code name')
      .populate('studentGroup', 'name')
      .populate('room', 'roomNumber examCapacity')
      .populate('invigilator', 'name');

    try {
      await AuditLog.create({
        action: validation.hasConflicts ? 'SCHEDULE_CONFLICT' : 'CREATE',
        module: 'SCHEDULE',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: schedule._id.toString(),
        targetTitle: `${populated.subject?.code} - ${populated.studentGroup?.name}`,
        details: { schedule: populated, conflicts: validation.conflicts }
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: validation.hasConflicts
        ? 'Schedule entry saved with recorded conflict warnings.'
        : 'Schedule entry created successfully without conflicts!',
      data: populated,
      hasConflicts: validation.hasConflicts,
      conflicts: validation.conflicts
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/schedules/:id
// @desc    Update schedule entry
// @access  Private (Admin)
exports.updateSchedule = async (req, res, next) => {
  try {
    const {
      examination,
      subject,
      studentGroup,
      room,
      invigilator,
      date,
      startTime,
      endTime,
      notes,
      allowConflictSave = false
    } = req.body;

    const existing = await Schedule.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Schedule entry not found' });
    }

    const examId = examination || existing.examination;
    const subjId = subject || existing.subject;
    const grpId = studentGroup || existing.studentGroup;
    const rmId = room || existing.room;
    const invId = invigilator !== undefined ? invigilator : existing.invigilator;
    const dt = date || existing.date;
    const sTime = startTime || existing.startTime;
    const eTime = endTime || existing.endTime;

    const validation = await detectConflicts({
      examinationId: examId,
      subjectId: subjId,
      studentGroupId: grpId,
      roomId: rmId,
      invigilatorId: invId || null,
      date: dt,
      startTime: sTime,
      endTime: eTime,
      excludeScheduleId: existing._id
    });

    if (validation.hasConflicts && !allowConflictSave) {
      return res.status(400).json({
        success: false,
        message: 'Scheduling Conflict Detected! Please resolve the conflicts before updating.',
        hasConflicts: true,
        conflicts: validation.conflicts
      });
    }

    existing.examination = examId;
    existing.subject = subjId;
    existing.studentGroup = grpId;
    existing.room = rmId;
    existing.invigilator = invId || null;
    existing.date = new Date(dt);
    existing.startTime = sTime;
    existing.endTime = eTime;
    existing.startDateTime = validation.startDateTime;
    existing.endDateTime = validation.endDateTime;
    existing.durationMinutes = validation.durationMinutes;
    existing.status = validation.hasConflicts ? 'conflict' : 'scheduled';
    existing.conflicts = validation.conflicts;
    existing.hasConflicts = validation.hasConflicts;
    if (notes !== undefined) existing.notes = notes;

    await existing.save();

    const populated = await Schedule.findById(existing._id)
      .populate('subject', 'code name')
      .populate('studentGroup', 'name')
      .populate('room', 'roomNumber examCapacity')
      .populate('invigilator', 'name');

    res.status(200).json({
      success: true,
      message: 'Schedule entry updated successfully',
      data: populated,
      hasConflicts: validation.hasConflicts,
      conflicts: validation.conflicts
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/schedules/:id
// @desc    Delete schedule entry
// @access  Private (Admin)
exports.deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule entry not found' });
    }

    try {
      await AuditLog.create({
        action: 'DELETE',
        module: 'SCHEDULE',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: schedule._id.toString(),
        targetTitle: `Schedule ${schedule.startTime} - ${schedule.endTime}`
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Schedule entry deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/schedules/publish/:examinationId
// @desc    Publish full examination timetable after verifying ZERO conflicts
// @access  Private (Admin)
exports.publishTimetable = async (req, res, next) => {
  try {
    const { examinationId } = req.params;

    const exam = await Examination.findById(examinationId);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination session not found' });
    }

    // Comprehensive audit of every slot
    const report = await validateEntireExamination(examinationId);

    if (report.totalSchedules === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish timetable: No examination slots have been scheduled yet.'
      });
    }

    // STRICT VALIDATION RULE: Block publication if ANY conflict remains
    if (report.conflictSchedules > 0) {
      return res.status(400).json({
        success: false,
        message: `Publication BLOCKED: There are ${report.conflictSchedules} schedule entries with unresolved conflicts. All conflicts must be resolved before publishing.`,
        report
      });
    }

    // Mark examination and all schedules as published
    exam.status = 'published';
    exam.publishedAt = new Date();
    await exam.save();

    await Schedule.updateMany(
      { examination: examinationId },
      { status: 'published' }
    );

    try {
      await AuditLog.create({
        action: 'PUBLISH',
        module: 'EXAMINATION',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: exam._id.toString(),
        targetTitle: exam.title,
        details: { publishedSlots: report.totalSchedules }
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: `🎉 Success! Examination timetable "${exam.title}" has been verified and published with 0 conflicts. Students and faculty can now view their official schedules.`,
      data: exam,
      report
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/schedules/auto-suggest
// @desc    Suggest valid conflict-free timetable slot
// @access  Private (Admin)
exports.autoSuggestSlot = async (req, res, next) => {
  try {
    const { examinationId, subjectId, studentGroupId } = req.body;

    if (!examinationId || !subjectId || !studentGroupId) {
      return res.status(400).json({
        success: false,
        message: 'Examination, Subject, and Student Group are required for automatic slot suggestion.'
      });
    }

    const result = await suggestNextValidSlot(examinationId, subjectId, studentGroupId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
