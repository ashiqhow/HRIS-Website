const express = require('express');
const router = express.Router();
const {
  createEvaluation,
  getEvaluations,
  getMyAppraisals,
  getEvaluationById,
} = require('../controllers/performanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(authorize('HR Admin', 'Manager'), getEvaluations)
  .post(authorize('HR Admin', 'Manager'), createEvaluation);

router.get('/my-appraisals', getMyAppraisals);
router.get('/:id', getEvaluationById);

module.exports = router;
