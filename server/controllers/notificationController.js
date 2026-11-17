const Notification = require('../models/Notification');

// @desc    Get user notifications (targeted + applicable broadcasts)
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { type, unreadOnly } = req.query;

    const query = {
      $or: [
        { recipient: userId },
        { isBroadcast: true, targetRole: { $in: ['All', userRole] } },
      ],
    };

    if (type && type !== 'all') {
      query.type = type;
    }

    const rawNotifications = await Notification.find(query)
      .populate('sender', 'name role')
      .sort({ createdAt: -1 })
      .limit(50);

    // Format isRead state for each notification relative to current user
    const notifications = rawNotifications.map((n) => {
      const isReadForUser = n.isBroadcast
        ? n.readBy.some((id) => id.toString() === userId.toString())
        : n.isRead;

      return {
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        createdAt: n.createdAt,
        isBroadcast: n.isBroadcast,
        sender: n.sender,
        isRead: isReadForUser,
      };
    });

    const filtered = unreadOnly === 'true'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      unreadCount,
      count: filtered.length,
      notifications: filtered,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.isBroadcast) {
      if (!notification.readBy.includes(req.user._id)) {
        notification.readBy.push(req.user._id);
        await notification.save();
      }
    } else {
      if (notification.recipient && notification.recipient.toString() === req.user._id.toString()) {
        notification.isRead = true;
        await notification.save();
      }
    }

    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // 1. Mark personal notifications
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    // 2. Mark broadcast notifications
    await Notification.updateMany(
      {
        isBroadcast: true,
        targetRole: { $in: ['All', userRole] },
        readBy: { $ne: userId },
      },
      { $push: { readBy: userId } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create broadcast notification / announcement
// @route   POST /api/notifications/broadcast
// @access  Private (HR Admin or users with canBroadcastAnnouncements)
const createBroadcastNotification = async (req, res) => {
  try {
    const { title, message, type, targetRole, link } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both title and message',
      });
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'general',
      targetRole: targetRole || 'All',
      link: link || '',
      isBroadcast: true,
      sender: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Announcement broadcasted successfully',
      notification,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createBroadcastNotification,
};
