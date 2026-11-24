const StudentGroup = require('../models/StudentGroup');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/groups
// @desc    Get all student groups with search & filter
// @access  Private
exports.getGroups = async (req, res, next) => {
  try {
    const { search, department, semester } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { academicYear: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) query.department = department;
    if (semester) query.semester = Number(semester);

    const groups = await StudentGroup.find(query).sort({ department: 1, semester: 1, name: 1 });

    // Count enrolled students per group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const studentCount = await Student.countDocuments({ studentGroup: group._id });
        return {
          ...group.toObject(),
          enrolledCount: studentCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: groupsWithCounts.length,
      data: groupsWithCounts
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/groups/:id
// @desc    Get single group details
// @access  Private
exports.getGroupById = async (req, res, next) => {
  try {
    const group = await StudentGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Student group not found' });
    }
    const students = await Student.find({ studentGroup: group._id }).sort({ rollNumber: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...group.toObject(),
        enrolledCount: students.length,
        students
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/groups
// @desc    Create new student group
// @access  Private (Admin)
exports.createGroup = async (req, res, next) => {
  try {
    const group = await StudentGroup.create(req.body);

    try {
      await AuditLog.create({
        action: 'CREATE',
        module: 'GROUP',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: group._id.toString(),
        targetTitle: group.name,
        details: group
      });
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Student group created successfully',
      data: group
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/groups/:id
// @desc    Update student group
// @access  Private (Admin)
exports.updateGroup = async (req, res, next) => {
  try {
    const group = await StudentGroup.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Student group not found' });
    }

    try {
      await AuditLog.create({
        action: 'UPDATE',
        module: 'GROUP',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: group._id.toString(),
        targetTitle: group.name,
        details: req.body
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Student group updated successfully',
      data: group
    });
  } catch (error) {
    next(error);
  }
};

// @route   DELETE /api/groups/:id
// @desc    Delete student group
// @access  Private (Admin)
exports.deleteGroup = async (req, res, next) => {
  try {
    // Check if students belong to this group
    const studentCount = await Student.countDocuments({ studentGroup: req.params.id });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete group. There are ${studentCount} students assigned to this group. Reassign them first.`
      });
    }

    const group = await StudentGroup.findByIdAndDelete(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Student group not found' });
    }

    try {
      await AuditLog.create({
        action: 'DELETE',
        module: 'GROUP',
        performedBy: req.user?._id,
        performerName: req.user?.name || 'Admin',
        targetId: group._id.toString(),
        targetTitle: group.name
      });
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'Student group deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
