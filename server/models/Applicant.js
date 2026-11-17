const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide applicant name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide applicant email'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: '',
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPosting',
      required: true,
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    experience: {
      type: String,
      default: '1-3 years',
    },
    coverLetter: {
      type: String,
      default: '',
    },
    stage: {
      type: String,
      enum: [
        'Applied',
        'Under Review',
        'Shortlisted',
        'Interview Scheduled',
        'Selected',
        'Rejected',
      ],
      default: 'Applied',
    },
    interviewDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    reviews: [
      {
        reviewer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        feedback: { type: String, required: true },
        rating: { type: Number, min: 1, max: 5, default: 4 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Applicant', applicantSchema);
