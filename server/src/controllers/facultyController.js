const Faculty = require('../models/Faculty');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/faculty
// @desc    Get all faculty with search & filter
// @access  Private
exports.getAllFaculty = async (req, res, next) => {
  try {
    const { search, department, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { facultyId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) query.department = department;
    if (status) query.status = status;

    const facultyList = await Faculty.find(query).sort({ department: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: facultyList.length,
      data: facultyList
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/faculty/:id
// @desc    Get single faculty details
// @access  Private
exports.getFacultyById = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id).populate('user', 'name email role');
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }
    res.status(200).json({ success: true, data: faculty });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/faculty
// @desc    Create new faculty record
// @access  Private (Admin)
exports.createFaculty = async (req, res, next) => {
  try {
    const { facultyId, name, email, department, designation, phone, maxInvigilationsPerWeek, status, password } = req.body;

    const idExists = await Faculty.findOne({ facultyId: facultyId.toUpperCase() });
    if (idExists) {
      return res.status(400).json({ success: false, message: 'Faculty ID already exists' });
    }

    const emailExists = await Faculty.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email address already exists' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: password || 'Faculty@123',
        role: 'faculty',
        phone: phone || ''
      });
    }

    const faculty = await Faculty.create({
      user: user._id,
      facultyId: facultyId.toUpperCase(),
      name,
      email: email.toLowerCase(),
      department,
      designation,
      phone: phone || '',
      maxInvigilationsPerWeek: Number(maxInvigilationsPerWeek) || 5,
      status: status || 'active'
    });

    try {
      await AuditLog.create({
        action: 'CREATE',
        module: 'FACULTY',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: faculty._id.toString(),
        targetTitle: `${faculty.facultyId} - ${faculty.name}`,
        details: faculty
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: faculty
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/faculty/:id
// @desc    Update faculty record
// @access  Private (Admin)
exports.updateFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    try {
      await AuditLog.create({
        action: 'UPDATE',
        module: 'FACULTY',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: faculty._id.toString(),
        targetTitle: `${faculty.facultyId} - ${faculty.name}`,
        details: req.body
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Faculty updated successfully',
      data: faculty
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/faculty/:id
// @desc    Delete faculty record
// @access  Private (Admin)
exports.deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty member not found' });
    }

    try {
      await AuditLog.create({
        action: 'DELETE',
        module: 'FACULTY',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: faculty._id.toString(),
        targetTitle: `${faculty.facultyId} - ${faculty.name}`
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Faculty deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
