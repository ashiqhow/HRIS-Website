const Performance = require('../models/Performance');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create new employee performance evaluation
// @route   POST /api/performance
// @access  Private (Manager, HR Admin)
const createEvaluation = async (req, res) => {
  try {
    const {
      employee,
      period,
      goals,
      productivityScore,
      overallScore,
      feedback,
      strengths,
      areasForImprovement,
    } = req.body;

    if (!employee || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Please provide employee and evaluation feedback',
      });
    }

    const evaluation = new Performance({
      employee,
      reviewer: req.user._id,
      period: period || 'Annual 2026',
      evaluationDate: new Date(),
      goals: goals || [],
      productivityScore: productivityScore !== undefined ? Number(productivityScore) : 85,
      overallScore: overallScore !== undefined ? Number(overallScore) : 85,
      feedback,
      strengths: strengths || '',
      areasForImprovement: areasForImprovement || '',
      status: 'Completed',
    });

    await evaluation.save();

    // Notify employee of appraisal result
    await Notification.create({
      recipient: employee,
      title: `Performance Appraisal (${evaluation.period})`,
      message: `Your performance evaluation has been completed by ${req.user.name}. Overall Rating: ${evaluation.rating} (${evaluation.overallScore}/100).`,
      type: 'general',
      link: '/performance',
      sender: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Performance evaluation completed successfully',
      evaluation,
    });
  } catch (err) {
    console.error('Create Evaluation Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get performance evaluations (Organization / Department)
// @route   GET /api/performance
// @access  Private (Manager, HR Admin)
const getEvaluations = async (req, res) => {
  try {
    const { period, rating, department, search } = req.query;
    const query = {};

    if (period && period !== 'All') query.period = period;
    if (rating && rating !== 'All') query.rating = rating;

    const isHRAdmin = req.user.role === 'HR Admin' || req.user.permissions?.canManageUsers;

    if (!isHRAdmin && req.user.role === 'Manager') {
      const teamUserIds = await User.find({ department: req.user.department }).distinct('_id');
      query.employee = { $in: teamUserIds };
    } else if (department && department !== 'All') {
      const deptUserIds = await User.find({ department }).distinct('_id');
      query.employee = { $in: deptUserIds };
    }

    let evaluations = await Performance.find(query)
      .populate('employee', 'name email employeeId department designation')
      .populate('reviewer', 'name role')
      .sort({ createdAt: -1 });

    if (search) {
      evaluations = evaluations.filter((e) =>
        e.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.employee?.employeeId?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Compute distribution metrics
    const ratingDistribution = {
      Excellent: 0,
      'Very Good': 0,
      Good: 0,
      'Needs Improvement': 0,
    };

    evaluations.forEach((e) => {
      if (ratingDistribution[e.rating] !== undefined) {
        ratingDistribution[e.rating] += 1;
      }
    });

    const avgScore = evaluations.length > 0
      ? Math.round(evaluations.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / evaluations.length)
      : 0;

    res.json({
      success: true,
      count: evaluations.length,
      metrics: {
        avgScore,
        ratingDistribution,
      },
      evaluations,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get employee's own evaluations and history
// @route   GET /api/performance/my-appraisals
// @access  Private (All Employees)
const getMyAppraisals = async (req, res) => {
  try {
    const appraisals = await Performance.find({ employee: req.user._id })
      .populate('reviewer', 'name role designation')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: appraisals.length,
      appraisals,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single evaluation by ID
// @route   GET /api/performance/:id
// @access  Private
const getEvaluationById = async (req, res) => {
  try {
    const evaluation = await Performance.findById(req.params.id)
      .populate('employee', 'name email employeeId department designation dateOfJoining')
      .populate('reviewer', 'name role designation');

    if (!evaluation) {
      return res.status(404).json({ success: false, message: 'Evaluation not found' });
    }

    res.json({ success: true, evaluation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createEvaluation,
  getEvaluations,
  getMyAppraisals,
  getEvaluationById,
};
