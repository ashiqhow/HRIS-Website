const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'hris_super_secret_jwt_key_2026_dev_secure',
    {
      expiresIn: '30d',
    }
  );
};

// @desc    Check if system needs initial admin setup
// @route   GET /api/auth/setup-status
// @access  Public
const getSetupStatus = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({
      success: true,
      isFirstUser: userCount === 0,
      totalUsers: userCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, designation } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const totalUsers = await User.countDocuments();
    let assignedRole = role || 'Employee';

    // If this is the very first user in the database, automatically make them HR Admin
    if (totalUsers === 0) {
      assignedRole = 'HR Admin';
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      department: department || (assignedRole === 'HR Admin' ? 'Human Resources' : 'General'),
      designation: designation || (assignedRole === 'HR Admin' ? 'Chief HR Administrator' : 'Team Member'),
    });

    // Welcome Notification
    await Notification.create({
      recipient: user._id,
      title: 'Welcome to HRIS Portal',
      message: `Welcome aboard, ${user.name}! Your account has been initialized with the role: ${user.role}.`,
      type: 'general',
      link: '/profile',
    });

    const token = generateToken(user._id);

    // Return sanitized user object
    const userResponse = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: totalUsers === 0
        ? 'HR Administrator account setup successfully!'
        : 'Account registered successfully!',
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        success: false,
        message: `Your account status is ${user.status}. Please contact the HR department.`,
      });
    }

    const token = generateToken(user._id);

    const userResponse = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSetupStatus,
  register,
  login,
  getMe,
};
