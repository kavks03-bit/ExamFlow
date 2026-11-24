const Subject = require('../models/Subject');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/subjects
// @desc    Get all subjects with search & filter
// @access  Private
exports.getSubjects = async (req, res, next) => {
  try {
    const { search, department, semester, type } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (type) query.type = type;

    const subjects = await Subject.find(query).sort({ department: 1, semester: 1, code: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/subjects/:id
// @desc    Get single subject details
// @access  Private
exports.getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/subjects
// @desc    Create new subject
// @access  Private (Admin)
exports.createSubject = async (req, res, next) => {
  try {
    const { code } = req.body;
    const exists = await Subject.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Subject with this Course Code already exists' });
    }

    const subject = await Subject.create({
      ...req.body,
      code: code.toUpperCase()
    });

    try {
      await AuditLog.create({
        action: 'CREATE',
        module: 'SUBJECT',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: subject._id.toString(),
        targetTitle: `${subject.code} - ${subject.name}`,
        details: subject
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/subjects/:id
// @desc    Update subject
// @access  Private (Admin)
exports.updateSubject = async (req, res, next) => {
  try {
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }

    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    try {
      await AuditLog.create({
        action: 'UPDATE',
        module: 'SUBJECT',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: subject._id.toString(),
        targetTitle: `${subject.code} - ${subject.name}`,
        details: req.body
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/subjects/:id
// @desc    Delete subject
// @access  Private (Admin)
exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    try {
      await AuditLog.create({
        action: 'DELETE',
        module: 'SUBJECT',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: subject._id.toString(),
        targetTitle: `${subject.code} - ${subject.name}`
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
