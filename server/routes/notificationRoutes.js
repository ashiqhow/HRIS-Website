const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  createBroadcastNotification,
} = require('../controllers/notificationController');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.post(
  '/broadcast',
  checkPermission('canBroadcastAnnouncements'),
  createBroadcastNotification
);

module.exports = router;
