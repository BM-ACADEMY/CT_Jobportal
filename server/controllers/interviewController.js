const Interview = require('../models/Interview');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Schedule a video interview
// @route   POST /api/interviews
// @access  Private (Recruiter/Company)
const scheduleInterview = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const recruiter = await User.findById(recruiterId).populate('subscription');
    if (!recruiter) return res.status(404).json({ msg: 'User not found' });

    if (!recruiter.subscription?.hasVideoInterview) {
      return res.status(403).json({ msg: 'Video interview scheduling requires a paid plan.', requiresUpgrade: true });
    }

    const { applicationId, scheduledAt, duration, meetingLink, notes } = req.body;
    if (!applicationId || !scheduledAt) {
      return res.status(400).json({ msg: 'Application ID and scheduled time are required' });
    }

    const application = await Application.findById(applicationId).populate('job');
    if (!application) return res.status(404).json({ msg: 'Application not found' });

    // Verify recruiter owns the job
    const job = await Job.findById(application.job);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    if (job.recruiter.toString() !== recruiterId && (!recruiter.company || job.company.toString() !== recruiter.company.toString())) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Check for duplicate scheduling for same application
    const existing = await Interview.findOne({ application: applicationId, status: 'scheduled' });
    if (existing) {
      return res.status(400).json({ msg: 'An interview is already scheduled for this candidate. Cancel the existing one first.' });
    }

    const interview = new Interview({
      job: application.job,
      application: applicationId,
      recruiter: recruiterId,
      candidate: application.applicant,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      meetingLink: meetingLink || '',
      notes: notes || ''
    });

    await interview.save();

    const populated = await Interview.findById(interview._id)
      .populate('candidate', 'name email avatar profile.headline')
      .populate('job', 'title');

    res.status(201).json({ msg: 'Interview scheduled successfully', interview: populated });
  } catch (err) {
    console.error('Schedule Interview Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get all interviews for the recruiter
// @route   GET /api/interviews/recruiter
// @access  Private (Recruiter/Company)
const getRecruiterInterviews = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const recruiter = await User.findById(recruiterId).populate('subscription');
    if (!recruiter) return res.status(404).json({ msg: 'User not found' });

    if (!recruiter.subscription?.hasVideoInterview) {
      return res.status(403).json({ msg: 'Video interview scheduling requires a paid plan.', requiresUpgrade: true });
    }

    const interviews = await Interview.find({ recruiter: recruiterId })
      .populate('candidate', 'name email avatar profile.headline')
      .populate('job', 'title')
      .sort({ scheduledAt: 1 });

    res.json(interviews);
  } catch (err) {
    console.error('Get Interviews Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Cancel an interview
// @route   PATCH /api/interviews/:id/cancel
// @access  Private (Recruiter/Company)
const cancelInterview = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const interview = await Interview.findOne({ _id: req.params.id, recruiter: recruiterId });
    if (!interview) return res.status(404).json({ msg: 'Interview not found' });

    interview.status = 'cancelled';
    await interview.save();

    res.json({ msg: 'Interview cancelled', interview });
  } catch (err) {
    console.error('Cancel Interview Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Mark interview as completed
// @route   PATCH /api/interviews/:id/complete
// @access  Private (Recruiter/Company)
const completeInterview = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const interview = await Interview.findOne({ _id: req.params.id, recruiter: recruiterId });
    if (!interview) return res.status(404).json({ msg: 'Interview not found' });

    interview.status = 'completed';
    await interview.save();

    res.json({ msg: 'Interview marked as completed', interview });
  } catch (err) {
    console.error('Complete Interview Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get applicants eligible for interview scheduling (for a job)
// @route   GET /api/interviews/schedulable/:jobId
// @access  Private (Recruiter/Company)
const getSchedulableApplicants = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const recruiter = await User.findById(recruiterId).populate('subscription');
    if (!recruiter?.subscription?.hasVideoInterview) {
      return res.status(403).json({ msg: 'Video interview scheduling requires a paid plan.', requiresUpgrade: true });
    }

    const { jobId } = req.params;
    const applications = await Application.find({ job: jobId, status: { $in: ['reviewed', 'shortlisted'] } })
      .populate('applicant', 'name email avatar profile.headline')
      .lean();

    // Attach scheduled interview status
    const scheduled = await Interview.find({ job: jobId, status: 'scheduled' }).select('application');
    const scheduledAppIds = new Set(scheduled.map(i => i.application.toString()));

    const result = applications.map(app => ({
      ...app,
      hasScheduledInterview: scheduledAppIds.has(app._id.toString())
    }));

    res.json(result);
  } catch (err) {
    console.error('Schedulable Applicants Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  scheduleInterview,
  getRecruiterInterviews,
  cancelInterview,
  completeInterview,
  getSchedulableApplicants
};
