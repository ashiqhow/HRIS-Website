const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get user's personal profile
// @route   GET /api/profile
// @access  Private
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update permitted personal information
// @route   PUT /api/profile
// @access  Private
const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      name,
      phone,
      secondaryEmail,
      address,
      emergencyContact,
      bio,
      avatar,
      workLocation,
    } = req.body;

    // Allowed updates for any employee
    if (name) user.name = name;

    if (!user.profile) user.profile = {};

    if (phone !== undefined) user.profile.phone = phone;
    if (secondaryEmail !== undefined) user.profile.secondaryEmail = secondaryEmail;
    if (address !== undefined) user.profile.address = address;
    if (bio !== undefined) user.profile.bio = bio;
    if (avatar !== undefined) user.profile.avatar = avatar;
    if (workLocation !== undefined) user.profile.workLocation = workLocation;

    if (emergencyContact && typeof emergencyContact === 'object') {
      user.profile.emergencyContact = {
        name: emergencyContact.name ?? user.profile.emergencyContact?.name ?? '',
        phone: emergencyContact.phone ?? user.profile.emergencyContact?.phone ?? '',
        relation: emergencyContact.relation ?? user.profile.emergencyContact?.relation ?? '',
      };
    }

    // If user is HR Admin, allow modifying organization fields as well
    if (user.role === 'HR Admin') {
      if (req.body.department) user.department = req.body.department;
      if (req.body.designation) user.designation = req.body.designation;
      if (req.body.employmentType) user.employmentType = req.body.employmentType;
    }

    await user.save();

    const updated = await User.findById(user._id).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Change password
// @route   PUT /api/profile/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password does not match',
      });
    }

    user.password = newPassword;
    await user.save();

    // Security notification
    await Notification.create({
      recipient: user._id,
      title: 'Security Alert: Password Changed',
      message: 'Your account password was successfully updated.',
      type: 'general',
      link: '/profile',
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
};
