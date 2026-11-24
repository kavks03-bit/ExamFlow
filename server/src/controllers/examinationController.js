const Examination = require('../models/Examination');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/examinations
// @desc    Get all examination sessions
// @access  Private
exports.getExaminations = async (req, res, next) => {
  try {
    const { search, status, examSeries, session } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { session: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (examSeries) query.examSeries = examSeries;
    if (session) query.session = session;

    const examinations = await Examination.find(query).sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: examinations.length,
      data: examinations
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/examinations/:id
// @desc    Get single examination details
// @access  Private
exports.getExaminationById = async (req, res, next) => {
  try {
    const examination = await Examination.findById(req.params.id);
    if (!examination) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }
    res.status(200).json({ success: true, data: examination });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/examinations
// @desc    Create new examination session
// @access  Private (Admin)
exports.createExamination = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }

    const examination = await Examination.create(req.body);

    try {
      await AuditLog.create({
        action: 'CREATE',
        module: 'EXAMINATION',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: examination._id.toString(),
        targetTitle: examination.title,
        details: examination
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Examination created successfully',
      data: examination
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/examinations/:id
// @desc    Update examination
// @access  Private (Admin)
exports.updateExamination = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }

    const examination = await Examination.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!examination) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    try {
      await AuditLog.create({
        action: 'UPDATE',
        module: 'EXAMINATION',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: examination._id.toString(),
        targetTitle: examination.title,
        details: req.body
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Examination updated successfully',
      data: examination
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/examinations/:id
// @desc    Delete examination
// @access  Private (Admin)
exports.deleteExamination = async (req, res, next) => {
  try {
    const examination = await Examination.findByIdAndDelete(req.params.id);
    if (!examination) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    try {
      await AuditLog.create({
        action: 'DELETE',
        module: 'EXAMINATION',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: examination._id.toString(),
        targetTitle: examination.title
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Examination deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
