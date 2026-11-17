const express = require('express');
const router = express.Router();
const {
  createJobOpening,
  getJobOpenings,
  updateJobOpening,
  deleteJobOpening,
  createApplicant,
  getApplicants,
  updateApplicantStage,
  addCandidateReview,
  getRecruitmentMetrics,
} = require('../controllers/recruitmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Job Vacancies
router.route('/jobs')
  .get(getJobOpenings)
  .post(authorize('HR Admin'), createJobOpening);

router.route('/jobs/:id')
  .put(authorize('HR Admin'), updateJobOpening)
  .delete(authorize('HR Admin'), deleteJobOpening);

// Applicants & Pipeline
router.route('/applicants')
  .get(getApplicants)
  .post(createApplicant);

router.put('/applicants/:id/stage', authorize('HR Admin', 'Manager'), updateApplicantStage);
router.post('/applicants/:id/reviews', authorize('HR Admin', 'Manager'), addCandidateReview);

// Metrics
router.get('/metrics', getRecruitmentMetrics);

module.exports = router;
