const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    period: {
      type: String,
      required: true,
      default: 'Annual 2026',
    },
    evaluationDate: {
      type: Date,
      default: Date.now,
    },
    goals: [
      {
        goalTitle: { type: String, required: true },
        target: { type: String, default: '' },
        achievementScore: { type: Number, min: 0, max: 100, default: 85 },
        comments: { type: String, default: '' },
      },
    ],
    productivityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 85,
    },
    rating: {
      type: String,
      enum: ['Excellent', 'Very Good', 'Good', 'Needs Improvement'],
      default: 'Very Good',
    },
    feedback: {
      type: String,
      required: true,
    },
    strengths: {
      type: String,
      default: '',
    },
    areasForImprovement: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Completed', 'Acknowledged'],
      default: 'Completed',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate rating automatically based on score before validation
performanceSchema.pre('validate', async function () {
  if (this.overallScore >= 90) {
    this.rating = 'Excellent';
  } else if (this.overallScore >= 75) {
    this.rating = 'Very Good';
  } else if (this.overallScore >= 60) {
    this.rating = 'Good';
  } else {
    this.rating = 'Needs Improvement';
  }
});

module.exports = mongoose.model('Performance', performanceSchema);
