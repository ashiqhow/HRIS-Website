const Training = require('../models/Training');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create new training program
// @route   POST /api/training
// @access  Private (HR Admin)
const createTrainingProgram = async (req, res) => {
  try {
    const { title, description, trainer, department, startDate, endDate, location } = req.body;

    if (!title || !description || !trainer || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, trainer, start date, and end date',
      });
    }

    const training = await Training.create({
      title,
      description,
      trainer,
      department: department || 'All',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: location || 'Virtual Training Hall',
      status: 'Upcoming',
      createdBy: req.user._id,
      participants: [],
    });

    res.status(201).json({
      success: true,
      message: 'Training program created successfully',
      training,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get training programs
// @route   GET /api/training
// @access  Private
const getTrainingPrograms = async (req, res) => {
  try {
    const { status, department, search } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (department && department !== 'All') query.department = department;
    if (search) query.title = { $regex: search, $options: 'i' };

    const programs = await Training.find(query)
      .populate('participants.employee', 'name email employeeId department designation')
      .populate('createdBy', 'name role')
      .sort({ startDate: -1 });

    res.json({
      success: true,
      count: programs.length,
      trainings: programs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Assign employees to training program
// @route   POST /api/training/:id/assign
// @access  Private (HR Admin, Manager)
const assignEmployeesToTraining = async (req, res) => {
  try {
    const { employeeIds } = req.body; // array of User IDs

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide employee IDs to enroll' });
    }

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Training program not found' });
    }

    let newlyEnrolled = 0;
    for (const empId of employeeIds) {
      const alreadyEnrolled = training.participants.some(
        (p) => p.employee.toString() === empId.toString()
      );

      if (!alreadyEnrolled) {
        training.participants.push({
          employee: empId,
          status: 'Enrolled',
        });
        newlyEnrolled++;

        // Notify enrolled employee
        await Notification.create({
          recipient: empId,
          title: 'Assigned to Training Program',
          message: `You have been enrolled into the training program "${training.title}" scheduled from ${new Date(training.startDate).toLocaleDateString()}.`,
          type: 'general',
          link: '/training',
        });
      }
    }

    await training.save();

    const updated = await Training.findById(req.params.id).populate(
      'participants.employee',
      'name email employeeId department designation'
    );

    res.json({
      success: true,
      message: `Enrolled ${newlyEnrolled} employee(s) into training program`,
      training: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update employee completion / participation status
// @route   PUT /api/training/:id/participants/:employeeId
// @access  Private
const updateParticipantProgress = async (req, res) => {
  try {
    const { status, score, feedback } = req.body;
    const training = await Training.findById(req.params.id);

    if (!training) {
      return res.status(404).json({ success: false, message: 'Training program not found' });
    }

    const participant = training.participants.find(
      (p) => p.employee.toString() === req.params.employeeId.toString()
    );

    if (!participant) {
      return res.status(404).json({ success: false, message: 'Employee not enrolled in this training' });
    }

    if (status) participant.status = status;
    if (score !== undefined) participant.score = Number(score);
    if (feedback !== undefined) participant.feedback = feedback;
    if (status === 'Completed') participant.completedAt = new Date();

    await training.save();

    res.json({
      success: true,
      message: 'Training progress recorded',
      participant,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get current employee's assigned trainings
// @route   GET /api/training/my-trainings
// @access  Private (All Employees)
const getMyTrainings = async (req, res) => {
  try {
    const trainings = await Training.find({
      'participants.employee': req.user._id,
    }).sort({ startDate: -1 });

    const formatted = trainings.map((t) => {
      const myPart = t.participants.find(
        (p) => p.employee.toString() === req.user._id.toString()
      );
      return {
        _id: t._id,
        title: t.title,
        description: t.description,
        trainer: t.trainer,
        department: t.department,
        startDate: t.startDate,
        endDate: t.endDate,
        location: t.location,
        programStatus: t.status,
        myStatus: myPart?.status || 'Enrolled',
        myScore: myPart?.score || 0,
        myFeedback: myPart?.feedback || '',
        completedAt: myPart?.completedAt || null,
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      trainings: formatted,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get training reports & completion analytics
// @route   GET /api/training/reports
// @access  Private (HR Admin, Manager)
const getTrainingReports = async (req, res) => {
  try {
    const trainings = await Training.find().populate(
      'participants.employee',
      'name department designation'
    );

    let totalEnrolled = 0;
    let totalCompleted = 0;
    let totalInProgress = 0;

    trainings.forEach((t) => {
      t.participants.forEach((p) => {
        totalEnrolled++;
        if (p.status === 'Completed') totalCompleted++;
        if (p.status === 'In Progress') totalInProgress++;
      });
    });

    const completionRate = totalEnrolled > 0
      ? Math.round((totalCompleted / totalEnrolled) * 100)
      : 0;

    res.json({
      success: true,
      summary: {
        totalPrograms: trainings.length,
        totalEnrolled,
        totalCompleted,
        totalInProgress,
        completionRate,
      },
      programs: trainings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createTrainingProgram,
  getTrainingPrograms,
  assignEmployeesToTraining,
  updateParticipantProgress,
  getMyTrainings,
  getTrainingReports,
};
