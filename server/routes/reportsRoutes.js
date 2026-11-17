const express = require('express');
const router = express.Router();
const {
  getReportsCatalog,
  generateComprehensiveReport,
} = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/catalog', authorize('HR Admin', 'Manager'), getReportsCatalog);
router.get('/generate', authorize('HR Admin', 'Manager'), generateComprehensiveReport);

module.exports = router;
