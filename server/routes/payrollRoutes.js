const express = require('express');
const router = express.Router();
const {
  generateMonthlyPayroll,
  getPayrollRecords,
  getMyPayslips,
  getPayslipById,
  updatePayrollRecord,
} = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/generate', authorize('HR Admin'), generateMonthlyPayroll);
router.get('/', authorize('HR Admin'), getPayrollRecords);
router.get('/my-payslips', getMyPayslips);
router.get('/:id', getPayslipById);
router.put('/:id', authorize('HR Admin'), updatePayrollRecord);

module.exports = router;
