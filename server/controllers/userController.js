const User = require('../models/User');
const Notification = require('../models/Notification');
const PreApprovedManager = require('../models/PreApprovedManager');

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

    // Enforce single Master HR Admin policy (Admin Count = 1)
    if (role === 'HR Admin' && oldRole !== 'HR Admin') {
      const existingAdmin = await User.findOne({ role: 'HR Admin', _id: { $ne: user._id } });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'The organization is limited to exactly 1 Master HR Administrator (Admin Count = 1). An HR Admin account already exists.',
        });
      }
    }

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

    // Enforce single Master HR Admin policy (Admin Count = 1)
    if (role === 'HR Admin') {
      const existingAdmin = await User.findOne({ role: 'HR Admin' });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'The system is restricted to a single Master HR Administrator (Admin Count = 1). You cannot create another HR Admin account.',
        });
      }
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
      status: 'Active',
      approvedBy: role === 'Manager' ? req.user._id : undefined,
      approvedAt: role === 'Manager' ? new Date() : undefined,
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

// @desc    Get pending manager registrations awaiting approval
// @route   GET /api/users/pending-managers
// @access  Private (HR Admin)
const getPendingManagers = async (req, res) => {
  try {
    const pendingManagers = await User.find({
      role: 'Manager',
      status: 'Pending Approval',
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pendingManagers.length,
      users: pendingManagers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Approve a pending manager
// @route   PUT /api/users/:id/approve-manager
// @access  Private (HR Admin)
const approveManager = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'Manager') {
      return res.status(400).json({ success: false, message: 'User is not a Manager' });
    }

    user.status = 'Active';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    await Notification.create({
      recipient: user._id,
      title: 'Manager Account Approved!',
      message: `Congratulations ${user.name}! Your Manager account for the ${user.department} department has been officially approved by the HR Administrator. You now have full access.`,
      type: 'general',
      link: '/dashboard',
      sender: req.user._id,
    });

    const userResponse = await User.findById(user._id).select('-password');
    res.json({
      success: true,
      message: `Manager ${user.name} has been approved and activated successfully`,
      user: userResponse,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reject a pending manager
// @route   PUT /api/users/:id/reject-manager
// @access  Private (HR Admin)
const rejectManager = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { reason } = req.body;
    user.status = 'Suspended';
    await user.save();

    await Notification.create({
      recipient: user._id,
      title: 'Manager Registration Declined',
      message: reason
        ? `Your Manager account registration was declined: ${reason}`
        : 'Your Manager account registration was declined by the HR Administrator.',
      type: 'general',
      link: '/login',
      sender: req.user._id,
    });

    res.json({
      success: true,
      message: `Manager ${user.name}'s request has been rejected and suspended`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Pre-approve a manager email before they register
// @route   POST /api/users/preapproved-managers
// @access  Private (HR Admin)
const preApproveManager = async (req, res) => {
  try {
    const { email, department, designation, notes } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `A user with email ${cleanEmail} already exists (Role: ${existingUser.role}, Status: ${existingUser.status})`,
      });
    }

    const existingPre = await PreApprovedManager.findOne({
      email: cleanEmail,
      used: false,
    });
    if (existingPre) {
      return res.status(400).json({
        success: false,
        message: 'This email is already pre-approved for Manager access',
      });
    }

    const pre = await PreApprovedManager.create({
      email: cleanEmail,
      department: department || 'Engineering',
      designation: designation || 'Department Manager',
      approvedBy: req.user._id,
      notes: notes || 'Pre-approved by HR Administrator',
    });

    res.status(201).json({
      success: true,
      message: `Manager email ${cleanEmail} has been pre-approved! They can now create their account directly.`,
      preApproval: pre,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all pre-approved manager emails
// @route   GET /api/users/preapproved-managers
// @access  Private (HR Admin)
const getPreApprovedManagers = async (req, res) => {
  try {
    const preApproved = await PreApprovedManager.find({ used: false })
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: preApproved.length,
      preApproved,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Revoke a pre-approval
// @route   DELETE /api/users/preapproved-managers/:id
// @access  Private (HR Admin)
const revokePreApprovedManager = async (req, res) => {
  try {
    const pre = await PreApprovedManager.findById(req.params.id);
    if (!pre) {
      return res.status(404).json({ success: false, message: 'Pre-approval record not found' });
    }

    await PreApprovedManager.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: `Pre-approval for ${pre.email} revoked successfully`,
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
  getPendingManagers,
  approveManager,
  rejectManager,
  preApproveManager,
  getPreApprovedManagers,
  revokePreApprovedManager,
};
