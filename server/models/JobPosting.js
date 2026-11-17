const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a job title'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Please provide a department'],
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
      default: 'Engineering',
    },
    description: {
      type: String,
      required: [true, 'Please provide a job description'],
    },
    qualifications: {
      type: String,
      required: [true, 'Please provide required qualifications'],
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
      default: 'Full-time',
    },
    location: {
      type: String,
      default: 'Headquarters',
    },
    deadline: {
      type: Date,
      required: [true, 'Please provide an application deadline'],
    },
    status: {
      type: String,
      enum: ['Open', 'Closed', 'Draft'],
      default: 'Open',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('JobPosting', jobPostingSchema);
