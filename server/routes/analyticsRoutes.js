const express = require('express');
const router = express.Router();
const {
  getHRAnalyticsDashboard,
  getDigitalTransformationAnalysis,
  getHRISEffectivenessEvaluation,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Analytics Dashboard accessible to HR Admin and Manager
router.get('/dashboard', authorize('HR Admin', 'Manager'), getHRAnalyticsDashboard);
router.get('/transformation', authorize('HR Admin', 'Manager'), getDigitalTransformationAnalysis);
router.get('/effectiveness', authorize('HR Admin', 'Manager'), getHRISEffectivenessEvaluation);

module.exports = router;
