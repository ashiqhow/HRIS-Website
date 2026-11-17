const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get all users with filtering and search
// @route   GET /api/users
// @access  Private (HR Admin or Manager)
const getAllUsers = async (req, res) => {
  try {
    const { search, role, department, status, designation } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (designation && designation !== 'All') {
      query.designation = { $regex: designation, $options: 'i' };
    }

    // If requester is a Manager without canManageUsers, only return members in their department
    const isHRAdmin = req.user.role === 'HR Admin' || req.user.permissions?.canManageUsers;
    if (req.user.role === 'Manager' && !isHRAdmin) {
      query.department = req.user.department;
    }

    let users = await User.find(query).select('-password').sort({ createdAt: -1 });

    // Sanitize salary for non-HR Admin viewing other users
    if (!isHRAdmin) {
      users = users.map((u) => {
        const userObj = u.toObject();
        if (u._id.toString() !== req.user._id.toString()) {
          delete userObj.salary;
        }
        return userObj;
      });
    }

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isHRAdmin = req.user.role === 'HR Admin' || req.user.permissions?.canManageUsers;
    const isSelf = user._id.toString() === req.user._id.toString();
    const isDeptManager = req.user.role === 'Manager' && req.user.department === user.department;

    if (!isHRAdmin && !isSelf && !isDeptManager) {
      return res.status(403).json({ success: false, message: 'Access denied to this employee record' });
    }

    const userObj = user.toObject();
    if (!isHRAdmin && !isSelf) {
      delete userObj.salary;
    }

    res.json({ success: true, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update employee personal, professional, and access details
// @route   PUT /api/users/:id/role-access
// @access  Private (HR Admin only)
const updateUserRoleAndAccess = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent HR Admin from locking themselves out
    if (user._id.toString() === req.user._id.toString() && req.body.role && req.body.role !== 'HR Admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot downgrade your own HR Admin role',
      });
    }

    const oldRole = user.role;
    const {
      name,
      email,
      employeeId,
      role,
      permissions,
      department,
      designation,
      status,
      employmentType,
      dateOfJoining,
      salary,
      profile,
    } = req.body;

    // Professional & Identity Information
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (employeeId) user.employeeId = employeeId;
    if (role) user.role = role;
    if (department) user.department = department;
    if (designation) user.designation = designation;
    if (status) user.status = status;
    if (employmentType) user.employmentType = employmentType;
    if (dateOfJoining) user.dateOfJoining = new Date(dateOfJoining);

    // Salary Information
    if (salary && typeof salary === 'object') {
      user.salary = {
        baseSalary: salary.baseSalary !== undefined ? Number(salary.baseSalary) : user.salary?.baseSalary || 0,
        currency: salary.currency || user.salary?.currency || 'USD',
        payFrequency: salary.payFrequency || user.salary?.payFrequency || 'Monthly',
      };
    }

    // Profile & Personal Information
    if (profile && typeof profile === 'object') {
      if (!user.profile) user.profile = {};
      if (profile.phone !== undefined) user.profile.phone = profile.phone;
      if (profile.secondaryEmail !== undefined) user.profile.secondaryEmail = profile.secondaryEmail;
      if (profile.address !== undefined) user.profile.address = profile.address;
      if (profile.workLocation !== undefined) user.profile.workLocation = profile.workLocation;
      if (profile.bio !== undefined) user.profile.bio = profile.bio;

      if (profile.emergencyContact && typeof profile.emergencyContact === 'object') {
        user.profile.emergencyContact = {
          name: profile.emergencyContact.name ?? user.profile.emergencyContact?.name ?? '',
          phone: profile.emergencyContact.phone ?? user.profile.emergencyContact?.phone ?? '',
          relation: profile.emergencyContact.relation ?? user.profile.emergencyContact?.relation ?? '',
        };
      }
    }

    // Permissions
    if (permissions && typeof permissions === 'object') {
      user.permissions = {
        ...user.permissions.toObject(),
        ...permissions,
      };
    }

    await user.save();

    // Trigger notification to the user if their role changed
    if (role && role !== oldRole) {
      await Notification.create({
        recipient: user._id,
        title: 'Role & Permissions Updated',
        message: `Your account role was changed from ${oldRole} to ${role} by HR Administration.`,
        type: 'general',
        link: '/profile',
        sender: req.user._id,
      });
    }

    const updatedUser = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Employee record updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new user by HR Admin
// @route   POST /api/users
// @access  Private (HR Admin)
const createUserByAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      employeeId,
      role,
      department,
      designation,
      employmentType,
      dateOfJoining,
      salary,
      profile,
      permissions,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and temporary password',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      employeeId: employeeId || undefined,
      role: role || 'Employee',
      department: department || 'General',
      designation: designation || 'Team Member',
      employmentType: employmentType || 'Full-time',
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : Date.now(),
      salary: {
        baseSalary: salary?.baseSalary ? Number(salary.baseSalary) : 0,
        currency: salary?.currency || 'USD',
        payFrequency: salary?.payFrequency || 'Monthly',
      },
    });

    if (profile && typeof profile === 'object') {
      user.profile = {
        phone: profile.phone || '',
        secondaryEmail: profile.secondaryEmail || '',
        address: profile.address || '',
        workLocation: profile.workLocation || 'Headquarters',
        bio: profile.bio || '',
        emergencyContact: {
          name: profile.emergencyContact?.name || '',
          phone: profile.emergencyContact?.phone || '',
          relation: profile.emergencyContact?.relation || '',
        },
      };
    }

    if (permissions && typeof permissions === 'object') {
      user.permissions = { ...user.permissions, ...permissions };
    }

    await user.save();

    await Notification.create({
      recipient: user._id,
      title: 'Welcome to the Team!',
      message: `Your account was created with the role: ${user.role} in ${user.department}. You can now complete your profile.`,
      type: 'general',
      link: '/profile',
      sender: req.user._id,
    });

    const userResponse = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      user: userResponse,
    });
  } catch (err) {
    console.error('Create User Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (HR Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `Employee record for ${user.name} removed successfully`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRoleAndAccess,
  createUserByAdmin,
  deleteUser,
};
