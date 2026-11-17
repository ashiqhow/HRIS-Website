const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getLeaves,
  reviewLeave,
  getLeaveReports,
} = require('../controllers/leaveController');
const { protect, checkPermission, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(applyLeave)
  .get(getLeaves);

router.get('/reports', authorize('HR Admin', 'Manager'), getLeaveReports);
router.put('/:id/review', checkPermission('canApproveLeave'), reviewLeave);

module.exports = router;
