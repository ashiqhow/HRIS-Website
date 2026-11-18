const mongoose = require('mongoose');

const preApprovedManagerSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email to pre-approve'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      default: 'Engineering',
    },
    designation: {
      type: String,
      default: 'Department Manager',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      default: 'Pre-approved by HR Administrator',
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PreApprovedManager', preApprovedManagerSchema);
