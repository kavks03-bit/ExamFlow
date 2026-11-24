const Student = require('../models/Student');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/students
// @desc    Get all students with search & filter
// @access  Private
exports.getStudents = async (req, res, next) => {
  try {
    const { search, department, semester, studentGroup } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { rollNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (studentGroup) query.studentGroup = studentGroup;

    const students = await Student.find(query)
      .populate('studentGroup', 'name department semester')
      .sort({ department: 1, semester: 1, rollNumber: 1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/students/:id
// @desc    Get single student details
// @access  Private
exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('studentGroup')
      .populate('user', 'name email role');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/students
// @desc    Create new student record
// @access  Private (Admin)
exports.createStudent = async (req, res, next) => {
  try {
    const { rollNumber, name, email, department, semester, academicYear, studentGroup, password } = req.body;

    // Check if roll number exists
    const rollExists = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (rollExists) {
      return res.status(400).json({ success: false, message: 'A student with this Roll Number already exists.' });
    }

    // Check if email exists
    const emailExists = await Student.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'A student with this Email already exists.' });
    }

    // Create or find matching user account
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: password || 'Student@123',
        role: 'student'
      });
    }

    const student = await Student.create({
      user: user._id,
      rollNumber: rollNumber.toUpperCase(),
      name,
      email: email.toLowerCase(),
      department,
      semester,
      academicYear: academicYear || '2026-2027',
      studentGroup,
      status: req.body.status || 'active'
    });

    const populatedStudent = await Student.findById(student._id).populate('studentGroup', 'name department semester');

    try {
      await AuditLog.create({
        action: 'CREATE',
        module: 'STUDENT',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: student._id.toString(),
        targetTitle: `${student.rollNumber} - ${student.name}`,
        details: student
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Student record created successfully',
      data: populatedStudent
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/students/:id
// @desc    Update student record
// @access  Private (Admin)
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('studentGroup', 'name department semester');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    try {
      await AuditLog.create({
        action: 'UPDATE',
        module: 'STUDENT',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: student._id.toString(),
        targetTitle: `${student.rollNumber} - ${student.name}`,
        details: req.body
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      data: student
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/students/:id
// @desc    Delete student record
// @access  Private (Admin)
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    try {
      await AuditLog.create({
        action: 'DELETE',
        module: 'STUDENT',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: student._id.toString(),
        targetTitle: `${student.rollNumber} - ${student.name}`
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Student record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
