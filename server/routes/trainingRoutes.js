const express = require('express');
const router = express.Router();
const {
  createTrainingProgram,
  getTrainingPrograms,
  assignEmployeesToTraining,
  updateParticipantProgress,
  getMyTrainings,
  getTrainingReports,
} = require('../controllers/trainingController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTrainingPrograms)
  .post(authorize('HR Admin'), createTrainingProgram);

router.post('/:id/assign', authorize('HR Admin', 'Manager'), assignEmployeesToTraining);
router.put('/:id/participants/:employeeId', updateParticipantProgress);
router.get('/my-trainings', getMyTrainings);
router.get('/reports', authorize('HR Admin', 'Manager'), getTrainingReports);

module.exports = router;
