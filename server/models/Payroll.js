const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
      min: 0,
    },
    deductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Processed', 'Paid'],
      default: 'Processed',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    payslipId: {
      type: String,
      unique: true,
    },
    remarks: {
      type: String,
      default: 'Standard Monthly Payroll',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate unique payslipId and calculate formula before validation
payrollSchema.pre('validate', async function () {
  if (!this.payslipId) {
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    this.payslipId = `PAY-${this.year}-${String(this.month).padStart(2, '0')}-${randomHex}`;
  }
  // Formula: Net Salary = Basic Salary + Allowances + Bonuses − Deductions
  this.netSalary =
    Math.round(
      ((this.basicSalary || 0) +
        (this.allowances || 0) +
        (this.bonuses || 0) -
        (this.deductions || 0)) *
        100
    ) / 100;
});

module.exports = mongoose.model('Payroll', payrollSchema);
