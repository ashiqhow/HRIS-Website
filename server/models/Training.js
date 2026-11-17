const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a training title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide training program description'],
    },
    trainer: {
      type: String,
      required: [true, 'Please specify trainer/instructor name'],
    },
    department: {
      type: String,
      default: 'All',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      default: 'Virtual Training Hall (Online)',
    },
    status: {
      type: String,
      enum: ['Upcoming', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Upcoming',
    },
    participants: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['Enrolled', 'In Progress', 'Completed', 'Dropped'],
          default: 'Enrolled',
        },
        score: {
          type: Number,
          default: 0,
        },
        feedback: {
          type: String,
          default: '',
        },
        completedAt: {
          type: Date,
          default: null,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Training', trainingSchema);
