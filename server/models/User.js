const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['HR Admin', 'Manager', 'Employee'],
      default: 'Employee',
    },
    employeeId: {
      type: String,
      unique: true,
      trim: true,
    },
    department: {
      type: String,
      enum: [
        'Engineering',
        'Human Resources',
        'Finance',
        'Marketing',
        'Operations',
        'Sales',
        'Product',
        'General',
      ],
      default: 'General',
    },
    designation: {
      type: String,
      default: 'Team Member',
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
      default: 'Full-time',
    },
    dateOfJoining: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended', 'Pending Approval'],
      default: 'Active',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    permissions: {
      canApproveLeave: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canManageRecruitment: { type: Boolean, default: false },
      canViewAllAttendance: { type: Boolean, default: false },
      canBroadcastAnnouncements: { type: Boolean, default: false },
    },
    profile: {
      phone: { type: String, default: '' },
      secondaryEmail: { type: String, default: '' },
      address: { type: String, default: '' },
      emergencyContact: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        relation: { type: String, default: '' },
      },
      bio: { type: String, default: '' },
      avatar: { type: String, default: '' },
      workLocation: { type: String, default: 'Headquarters' },
    },
    leaveBalance: {
      annual: { type: Number, default: 14 },
      sick: { type: Number, default: 10 },
      casual: { type: Number, default: 8 },
    },
    salary: {
      baseSalary: { type: Number, default: 0 },
      currency: { type: String, default: 'USD' },
      payFrequency: {
        type: String,
        enum: ['Monthly', 'Bi-weekly', 'Weekly', 'Annually'],
        default: 'Monthly',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-assign permissions, enforce single-admin policy, and employeeId before saving
userSchema.pre('save', async function () {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Enforce single Master HR Admin constraint (admin count must be 1)
  if (this.role === 'HR Admin' && (this.isNew || this.isModified('role'))) {
    const existingAdmin = await this.constructor.findOne({
      role: 'HR Admin',
      _id: { $ne: this._id },
    });
    if (existingAdmin) {
      const err = new Error(
        'The system is restricted to exactly 1 Master HR Administrator (Admin Count = 1). An HR Admin account already exists.'
      );
      err.status = 400;
      throw err;
    }
    // HR Admin is ID #1
    if (!this.employeeId) {
      this.employeeId = '1';
    }
  }

  // Generate employeeId if not present
  if (!this.employeeId) {
    if (this.role === 'HR Admin') {
      this.employeeId = '1';
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const prefix = this.role === 'Manager' ? 'MGR' : 'EMP';
      this.employeeId = `${prefix}-${randomSuffix}`;
    }
  }

  // Ensure role-appropriate default permissions
  if (this.isModified('role') || this.isNew) {
    if (this.role === 'HR Admin') {
      this.permissions.canApproveLeave = true;
      this.permissions.canManageUsers = true;
      this.permissions.canManageRecruitment = true;
      this.permissions.canViewAllAttendance = true;
      this.permissions.canBroadcastAnnouncements = true;
    } else if (this.role === 'Manager') {
      this.permissions.canApproveLeave = true;
      this.permissions.canViewAllAttendance = true;
      this.permissions.canManageUsers = false;
      this.permissions.canManageRecruitment = false;
      this.permissions.canBroadcastAnnouncements = false;
    } else {
      // Employee defaults
      this.permissions.canApproveLeave = false;
      this.permissions.canManageUsers = false;
      this.permissions.canManageRecruitment = false;
      this.permissions.canViewAllAttendance = false;
      this.permissions.canBroadcastAnnouncements = false;
    }
  }
});

// Method to verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
