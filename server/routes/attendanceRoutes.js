const express = require('express');
const router = express.Router();
const {
  getTodayStatus,
  checkIn,
  checkOut,
  getAttendanceLogs,
  getAttendanceReports,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/today', getTodayStatus);
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/logs', getAttendanceLogs);
router.get('/reports', authorize('HR Admin', 'Manager'), getAttendanceReports);

module.exports = router;
