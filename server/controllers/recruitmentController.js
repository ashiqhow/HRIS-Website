const JobPosting = require('../models/JobPosting');
const Applicant = require('../models/Applicant');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create new job vacancy
// @route   POST /api/recruitment/jobs
// @access  Private (HR Admin)
const createJobOpening = async (req, res) => {
  try {
    const { title, department, description, qualifications, employmentType, location, deadline } = req.body;

    if (!title || !description || !qualifications || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide job title, description, qualifications, and deadline',
      });
    }

    const job = await JobPosting.create({
      title,
      department: department || 'Engineering',
      description,
      qualifications,
      employmentType: employmentType || 'Full-time',
      location: location || 'Headquarters',
      deadline: new Date(deadline),
      createdBy: req.user._id,
      status: 'Open',
    });

    res.status(201).json({
      success: true,
      message: 'Job vacancy created successfully',
      job,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all job postings
// @route   GET /api/recruitment/jobs
// @access  Private
const getJobOpenings = async (req, res) => {
  try {
    const { department, status, search } = req.query;
    const query = {};

    if (department && department !== 'All') query.department = department;
    if (status && status !== 'All') query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const jobs = await JobPosting.find(query).sort({ createdAt: -1 });

    // Populate applicant counts for each job
    const jobsWithCount = await Promise.all(
      jobs.map(async (j) => {
        const count = await Applicant.countDocuments({ job: j._id });
        return {
          ...j.toObject(),
          applicantsCount: count,
        };
      })
    );

    res.json({
      success: true,
      count: jobsWithCount.length,
      jobs: jobsWithCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update job vacancy status / info
// @route   PUT /api/recruitment/jobs/:id
// @access  Private (HR Admin)
const updateJobOpening = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }
    res.json({ success: true, message: 'Job vacancy updated', job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete job opening
// @route   DELETE /api/recruitment/jobs/:id
// @access  Private (HR Admin)
const deleteJobOpening = async (req, res) => {
  try {
    await JobPosting.findByIdAndDelete(req.params.id);
    await Applicant.deleteMany({ job: req.params.id });
    res.json({ success: true, message: 'Job vacancy and linked applications removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add applicant to a job vacancy
// @route   POST /api/recruitment/applicants
// @access  Private (HR Admin, Public / Manager)
const createApplicant = async (req, res) => {
  try {
    const { name, email, phone, job, resumeUrl, experience, coverLetter } = req.body;

    if (!name || !email || !job) {
      return res.status(400).json({
        success: false,
        message: 'Please provide applicant name, email, and target job ID',
      });
    }

    const applicant = await Applicant.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      job,
      resumeUrl: resumeUrl || '',
      experience: experience || '1-3 years',
      coverLetter: coverLetter || '',
      stage: 'Applied',
    });

    res.status(201).json({
      success: true,
      message: 'Applicant registered in pipeline',
      applicant,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get candidates in recruitment pipeline
// @route   GET /api/recruitment/applicants
// @access  Private
const getApplicants = async (req, res) => {
  try {
    const { job, stage, search } = req.query;
    const query = {};

    if (job && job !== 'All') query.job = job;
    if (stage && stage !== 'All') query.stage = stage;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const applicants = await Applicant.find(query)
      .populate('job', 'title department location')
      .populate('reviews.reviewer', 'name role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: applicants.length,
      applicants,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update candidate stage (Shortlisted, Interview Scheduled, Selected, etc.)
// @route   PUT /api/recruitment/applicants/:id/stage
// @access  Private (HR Admin, Manager)
const updateApplicantStage = async (req, res) => {
  try {
    const { stage, notes, interviewDate } = req.body;
    const applicant = await Applicant.findById(req.params.id).populate('job', 'title');

    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found' });
    }

    if (stage) applicant.stage = stage;
    if (notes !== undefined) applicant.notes = notes;
    if (interviewDate) applicant.interviewDate = new Date(interviewDate);

    await applicant.save();

    res.json({
      success: true,
      message: `Candidate stage moved to ${stage}`,
      applicant,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Add review & feedback for candidate by Manager / HR Admin
// @route   POST /api/recruitment/applicants/:id/reviews
// @access  Private (Manager, HR Admin)
const addCandidateReview = async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    if (!feedback) {
      return res.status(400).json({ success: false, message: 'Please provide evaluation feedback' });
    }

    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return res.status(404).json({ success: false, message: 'Applicant not found' });
    }

    applicant.reviews.push({
      reviewer: req.user._id,
      feedback,
      rating: rating ? Number(rating) : 4,
      createdAt: new Date(),
    });

    await applicant.save();

    const updated = await Applicant.findById(req.params.id)
      .populate('job', 'title department')
      .populate('reviews.reviewer', 'name role');

    res.json({
      success: true,
      message: 'Review and feedback recorded for candidate',
      applicant: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get recruitment pipeline metrics
// @route   GET /api/recruitment/metrics
// @access  Private
const getRecruitmentMetrics = async (req, res) => {
  try {
    const [totalJobs, openJobs, totalApplicants, applicantsByStage] = await Promise.all([
      JobPosting.countDocuments(),
      JobPosting.countDocuments({ status: 'Open' }),
      Applicant.countDocuments(),
      Applicant.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
    ]);

    const stageMap = {
      Applied: 0,
      'Under Review': 0,
      Shortlisted: 0,
      'Interview Scheduled': 0,
      Selected: 0,
      Rejected: 0,
    };

    applicantsByStage.forEach((s) => {
      if (stageMap[s._id] !== undefined) {
        stageMap[s._id] = s.count;
      }
    });

    res.json({
      success: true,
      metrics: {
        totalJobs,
        openJobs,
        totalApplicants,
        pipeline: stageMap,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createJobOpening,
  getJobOpenings,
  updateJobOpening,
  deleteJobOpening,
  createApplicant,
  getApplicants,
  updateApplicantStage,
  addCandidateReview,
  getRecruitmentMetrics,
};
