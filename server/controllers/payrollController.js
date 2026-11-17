const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Generate monthly payroll for workforce
// @route   POST /api/payroll/generate
// @access  Private (HR Admin)
const generateMonthlyPayroll = async (req, res) => {
  try {
    const { month, year, defaultBonusPercent = 0, defaultDeductionPercent = 5 } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Please provide month and year' });
    }

    const activeEmployees = await User.find({ status: 'Active' });
    let createdCount = 0;
    let updatedCount = 0;

    for (const emp of activeEmployees) {
      const basic = emp.salary?.baseSalary || 3500;
      const currency = emp.salary?.currency || 'USD';

      // Allowances: approx 15% for housing, transport & medical
      const allowances = Math.round(basic * 0.15);
      // Bonuses
      const bonuses = Math.round(basic * (defaultBonusPercent / 100));
      // Deductions: tax, social security / provident fund (default 5-10%)
      const deductions = Math.round(basic * (defaultDeductionPercent / 100));

      // Formula: Net Salary = Basic Salary + Allowances + Bonuses − Deductions
      const netSalary = basic + allowances + bonuses - deductions;

      const existing = await Payroll.findOne({
        employee: emp._id,
        month: Number(month),
        year: Number(year),
      });

      if (existing) {
        existing.basicSalary = basic;
        existing.allowances = allowances;
        existing.bonuses = bonuses;
        existing.deductions = deductions;
        existing.netSalary = netSalary;
        existing.currency = currency;
        await existing.save();
        updatedCount++;
      } else {
        const payroll = new Payroll({
          employee: emp._id,
          month: Number(month),
          year: Number(year),
          basicSalary: basic,
          allowances,
          bonuses,
          deductions,
          netSalary,
          currency,
          paymentStatus: 'Processed',
          paymentDate: new Date(),
        });
        await payroll.save();
        createdCount++;

        // Notify employee of payslip availability
        await Notification.create({
          recipient: emp._id,
          title: `Payslip Available (${month}/${year})`,
          message: `Your digital payslip for ${month}/${year} has been generated. Net pay: ${currency} ${netSalary.toLocaleString()}.`,
          type: 'general',
          link: '/payroll',
        });
      }
    }

    res.json({
      success: true,
      message: `Monthly payroll generated: ${createdCount} created, ${updatedCount} updated.`,
      stats: { createdCount, updatedCount, total: activeEmployees.length },
    });
  } catch (err) {
    console.error('Generate Payroll Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get organization payroll records & analytics (HR Admin)
// @route   GET /api/payroll
// @access  Private (HR Admin)
const getPayrollRecords = async (req, res) => {
  try {
    const { month, year, department, paymentStatus, search } = req.query;
    const query = {};

    if (month && month !== 'All') query.month = Number(month);
    if (year && year !== 'All') query.year = Number(year);
    if (paymentStatus && paymentStatus !== 'All') query.paymentStatus = paymentStatus;

    if (department && department !== 'All') {
      const deptUserIds = await User.find({ department }).distinct('_id');
      query.employee = { $in: deptUserIds };
    }

    let records = await Payroll.find(query)
      .populate('employee', 'name email employeeId department designation')
      .sort({ year: -1, month: -1, createdAt: -1 });

    if (search) {
      records = records.filter((r) =>
        r.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.employee?.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
        r.payslipId?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Compute summary totals
    const totalDisbursed = records.reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
    const totalAllowances = records.reduce((acc, curr) => acc + (curr.allowances || 0), 0);
    const totalBonuses = records.reduce((acc, curr) => acc + (curr.bonuses || 0), 0);
    const totalDeductions = records.reduce((acc, curr) => acc + (curr.deductions || 0), 0);

    res.json({
      success: true,
      count: records.length,
      summary: {
        totalDisbursed,
        totalAllowances,
        totalBonuses,
        totalDeductions,
      },
      records,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get employee's own digital payslips
// @route   GET /api/payroll/my-payslips
// @access  Private (All Employees)
const getMyPayslips = async (req, res) => {
  try {
    const payslips = await Payroll.find({ employee: req.user._id })
      .populate('employee', 'name email employeeId department designation')
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      count: payslips.length,
      payslips,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single payslip by ID
// @route   GET /api/payroll/:id
// @access  Private
const getPayslipById = async (req, res) => {
  try {
    const payslip = await Payroll.findById(req.params.id).populate(
      'employee',
      'name email employeeId department designation dateOfJoining profile'
    );

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip record not found' });
    }

    // Access check: only HR Admin or the employee themselves can view
    const isHRAdmin = req.user.role === 'HR Admin' || req.user.permissions?.canManageUsers;
    const isSelf = payslip.employee._id.toString() === req.user._id.toString();

    if (!isHRAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this payslip' });
    }

    res.json({ success: true, payslip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update single payroll adjustments (Bonuses, deductions, allowances)
// @route   PUT /api/payroll/:id
// @access  Private (HR Admin)
const updatePayrollRecord = async (req, res) => {
  try {
    const { basicSalary, allowances, bonuses, deductions, paymentStatus } = req.body;
    const record = await Payroll.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }

    if (basicSalary !== undefined) record.basicSalary = Number(basicSalary);
    if (allowances !== undefined) record.allowances = Number(allowances);
    if (bonuses !== undefined) record.bonuses = Number(bonuses);
    if (deductions !== undefined) record.deductions = Number(deductions);
    if (paymentStatus) record.paymentStatus = paymentStatus;

    // Formula recalculation: Net Salary = Basic Salary + Allowances + Bonuses − Deductions
    record.netSalary = record.basicSalary + record.allowances + record.bonuses - record.deductions;

    await record.save();

    res.json({
      success: true,
      message: 'Payroll record adjusted successfully',
      record,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  generateMonthlyPayroll,
  getPayrollRecords,
  getMyPayslips,
  getPayslipById,
  updatePayrollRecord,
};
