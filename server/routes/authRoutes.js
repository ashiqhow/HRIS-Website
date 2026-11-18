const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getSetupStatus,
  checkPreApproval,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.get('/setup-status', getSetupStatus);
router.get('/check-preapproval', checkPreApproval);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
