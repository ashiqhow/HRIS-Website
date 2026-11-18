const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const PreApprovedManager = require('../models/PreApprovedManager');

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
    const adminCount = await User.countDocuments({ role: 'HR Admin' });
    res.json({
      success: true,
      isFirstUser: adminCount === 0,
      adminExists: adminCount >= 1,
      adminCount,
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
    const adminCount = await User.countDocuments({ role: 'HR Admin' });
    let assignedRole = role || 'Employee';

    // If there is no HR Admin in the organization, this user is promoted to the single Master HR Admin
    if (adminCount === 0) {
      assignedRole = 'HR Admin';
    } else if (assignedRole === 'HR Admin') {
      return res.status(400).json({
        success: false,
        message: 'The organization is limited to exactly 1 Master HR Administrator (Admin Count = 1). Please register as an Employee or Manager.',
      });
    }

    // Manager approval verification
    let userStatus = 'Active';
    let approvedBy = null;
    let approvedAt = null;

    if (assignedRole === 'Manager') {
      // Check if HR Admin pre-approved this email
      const preApproval = await PreApprovedManager.findOne({
        email: email.toLowerCase(),
        used: false,
      });

      if (preApproval) {
        // Pre-approved by HR Admin: activate account immediately
        userStatus = 'Active';
        approvedBy = preApproval.approvedBy;
        approvedAt = new Date();
        preApproval.used = true;
        preApproval.usedAt = new Date();
        await preApproval.save();
      } else {
        // Not pre-approved: Manager account must be approved by HR Admin before login
        userStatus = 'Pending Approval';
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      employeeId: assignedRole === 'HR Admin' ? '1' : undefined,
      department: department || (assignedRole === 'HR Admin' ? 'Human Resources' : 'General'),
      designation: designation || (assignedRole === 'HR Admin' ? 'Chief HR Administrator' : 'Team Member'),
      status: userStatus,
      approvedBy,
      approvedAt,
    });

    // If Manager requires approval, notify the Master HR Admin
    if (userStatus === 'Pending Approval') {
      const hrAdmin = await User.findOne({ role: 'HR Admin' });
      if (hrAdmin) {
        await Notification.create({
          recipient: hrAdmin._id,
          title: 'Manager Approval Required',
          message: `${user.name} has registered for the role of Manager in the ${user.department} department. Admin review and approval is required.`,
          type: 'general',
          link: '/employees',
          sender: user._id,
        });
      }

      return res.status(201).json({
        success: true,
        requiresApproval: true,
        message:
          'Manager registration submitted! Your account requires approval by the HR Administrator before you can log in. The HR Admin has been notified.',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status,
        },
      });
    }

    // Welcome Notification for immediately activated accounts
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
      if (user.status === 'Pending Approval') {
        return res.status(403).json({
          success: false,
          isPendingApproval: true,
          message:
            'Your Manager account is currently pending review and approval by the HR Administrator. You will be able to log in once authorized.',
        });
      }
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

// @desc    Check if an email is pre-approved for Manager role
// @route   GET /api/auth/check-preapproval
// @access  Public
const checkPreApproval = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    const preApproval = await PreApprovedManager.findOne({
      email: email.toLowerCase(),
      used: false,
    });
    res.json({
      success: true,
      isPreApproved: !!preApproval,
      department: preApproval?.department || null,
      designation: preApproval?.designation || null,
    });
  } catch (err) {
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
  checkPreApproval,
  getMe,
};
