const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const AuditLog = require('../models/AuditLog');

// @route   POST /api/auth/login
// @desc    Authenticate user & return JWT token
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Check user exists with password selected
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found with this email.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact the administrator.'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.'
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    // Record audit log
    try {
      await AuditLog.create({
        action: 'LOGIN',
        module: 'AUTH',
        performedBy: user._id,
        performerName: user.name,
        targetId: user._id.toString(),
        targetTitle: `${user.name} (${user.role})`,
        details: { email: user.email, role: user.role },
        ipAddress: req.ip || '127.0.0.1'
      });
    } catch (e) {
      // Non-blocking
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (or Admin only in production)
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'student',
      phone: phone || ''
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
// @desc    Get currently logged-in user profile
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/demo-accounts
// @desc    Get demo credentials for fast evaluation
// @access  Public
exports.getDemoAccounts = (req, res) => {
  res.status(200).json({
    success: true,
    data: [
      {
        role: 'admin',
        title: 'System Administrator',
        email: 'admin@examflow.edu',
        password: 'Admin@123',
        description: 'Full management access to all examination entities, schedules, and reports.'
      },
      {
        role: 'faculty',
        title: 'Faculty / Invigilator',
        email: 'faculty@examflow.edu',
        password: 'Faculty@123',
        description: 'View examination invigilation schedules, duty assignments, and room allocations.'
      },
      {
        role: 'student',
        title: 'Student Examinee',
        email: 'student@examflow.edu',
        password: 'Student@123',
        description: 'View personalized exam timetable, seating plan, and hall ticket information.'
      }
    ]
  });
};
