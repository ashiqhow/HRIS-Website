const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  changePassword,
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getMyProfile);
router.put('/', updateMyProfile);
router.put('/change-password', changePassword);

module.exports = router;
