const Interview = require('../models/Interview');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const { sendWhatsAppTemplate, getUserPhone } = require('../utils/whatsapp');
const { logTeamActivity } = require('../utils/teamActivityLog');
const { notifyUser } = require('../utils/inAppNotifications');

const FRONTEND_URL = process.env.FRONTEND_URL;
const formatWhen = (date) => new Date(date).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { dateStyle: 'full' });
const formatTime = (date) => new Date(date).toLocaleTimeString('en-IN', { timeStyle: 'short' });

// @desc    Schedule a video interview
// @route   POST /api/interviews
// @access  Private (Recruiter/Company)
const scheduleInterview = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const recruiter = await User.findById(recruiterId).populate('subscription');
    if (!recruiter) return res.status(404).json({ msg: 'User not found' });

    let hasAccess = recruiter.subscription?.hasVideoInterview || recruiter.subscription?.hasInterviewScheduling;
    let payPerFeatureIndex = -1;
    
    if (!hasAccess && recruiter.purchasedFeatures && recruiter.purchasedFeatures.length > 0) {
      const now = new Date();
      payPerFeatureIndex = recruiter.purchasedFeatures.findIndex(f => 
        (f.featureKey === 'hasVideoInterview' || f.featureKey === 'hasInterviewScheduling') && 
        f.isActive && 
        (!f.expiresAt || new Date(f.expiresAt) > now)
      );
      if (payPerFeatureIndex !== -1) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ msg: 'Video interview scheduling requires a paid plan or feature purchase.', requiresUpgrade: true });
    }

    const { applicationId, scheduledAt, duration, meetingLink, notes } = req.body;
    if (!applicationId || !scheduledAt) {
      return res.status(400).json({ msg: 'Application ID and scheduled time are required' });
    }

    // Ensure they have enough pay-per credits if it's a limited feature
    if (payPerFeatureIndex !== -1) {
      const feature = recruiter.purchasedFeatures[payPerFeatureIndex];
      // usageLeft > 0 means it is a limited pack (unlimited is stored as 0)
      if (feature.usageLeft > 0 && feature.usageLeft < 1) {
        return res.status(400).json({ msg: `You have 0 video interviews left in your pay-per plan. Please upgrade.` });
      }
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

    // Deduct usages if applicable
    if (payPerFeatureIndex !== -1) {
      const feature = recruiter.purchasedFeatures[payPerFeatureIndex];
      if (feature.usageLeft > 0) {
        feature.usageLeft -= 1;
        if (feature.usageLeft <= 0) {
          feature.usageLeft = 0;
          feature.isActive = false;
        }
        await recruiter.save();
      }
    }

    const populated = await Interview.findById(interview._id)
      .populate('candidate', 'name email avatar profile.headline profile.phone')
      .populate({ path: 'job', select: 'title company', populate: { path: 'company', select: 'name' } });

    notifyUser({
      io: req.io,
      recipientId: populated.candidate?._id,
      title: 'Interview scheduled',
      message: `Your interview for ${populated.job?.title || 'a role'} is scheduled for ${formatWhen(populated.scheduledAt)}.`,
      type: 'interview_scheduled',
      link: '/candidate/applications',
      metadata: { interviewId: populated._id, applicationId, scheduledAt: populated.scheduledAt }
    }).catch(err => console.error('Interview notification failed:', err.message));

    if (populated.candidate?.email) {
      sendEmail({
        email: populated.candidate.email,
        subject: `Interview Invitation — ${populated.job?.title || 'Your Application'}`,
        html: emailWrapper('You\'re Invited to an Interview', `
          <p>Hi ${populated.candidate.name || 'there'},</p>
          <p>You've been invited to an interview for <strong>${populated.job?.title || 'a role'}</strong>.</p>
          <p><strong>When:</strong> ${formatWhen(populated.scheduledAt)}</p>
          <p><strong>Duration:</strong> ${populated.duration} minutes</p>
          ${populated.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${populated.meetingLink}" style="color:#059669;">${populated.meetingLink}</a></p>` : ''}
          ${populated.notes ? `<p><strong>Notes:</strong> ${populated.notes}</p>` : ''}
        `)
      }).catch(() => {});
    }
    const candidatePhone = getUserPhone(populated.candidate);
    if (candidatePhone) {
      sendWhatsAppTemplate({
        to: candidatePhone,
        template: 'whatsapp_interview_invitation',
        params: [
          populated.candidate.name || 'there',
          populated.job?.title || 'the role',
          populated.job?.company?.name || 'the company',
          formatDate(populated.scheduledAt),
          formatTime(populated.scheduledAt),
          populated.meetingLink ? 'Video Call' : 'In-Person',
          populated.meetingLink || `${FRONTEND_URL}/jobseeker/interviews`
        ]
      }).catch(() => {});
    }

    logTeamActivity({
      actor: { _id: recruiter._id, name: recruiter.name, company: recruiter.company, role: req.user.role },
      action: 'interview_scheduled',
      description: `Scheduled an interview for ${populated.candidate?.name || 'a candidate'}`,
      entity: interview._id,
      entityModel: 'Interview'
    });

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

    let hasAccess = recruiter.subscription?.hasVideoInterview || recruiter.subscription?.hasInterviewScheduling;
    if (!hasAccess && recruiter.purchasedFeatures && recruiter.purchasedFeatures.length > 0) {
      const now = new Date();
      if (recruiter.purchasedFeatures.some(f => (f.featureKey === 'hasVideoInterview' || f.featureKey === 'hasInterviewScheduling') && f.isActive && (!f.expiresAt || new Date(f.expiresAt) > now))) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ msg: 'Video interview scheduling requires a paid plan or feature purchase.', requiresUpgrade: true });
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
    const interview = await Interview.findOne({ _id: req.params.id, recruiter: recruiterId })
      .populate('candidate', 'name email')
      .populate('job', 'title');
    if (!interview) return res.status(404).json({ msg: 'Interview not found' });

    const scheduledAt = interview.scheduledAt;
    interview.status = 'cancelled';
    await interview.save();

    notifyUser({
      io: req.io,
      recipientId: interview.candidate?._id || interview.candidate,
      title: 'Interview cancelled',
      message: `Your interview for ${interview.job?.title || 'a role'} scheduled for ${formatWhen(scheduledAt)} was cancelled.`,
      type: 'interview_cancelled',
      link: '/candidate/applications',
      metadata: { interviewId: interview._id }
    }).catch(err => console.error('Interview cancellation notification failed:', err.message));

    if (interview.candidate?.email) {
      sendEmail({
        email: interview.candidate.email,
        subject: `Interview Cancelled — ${interview.job?.title || 'Your Application'}`,
        html: emailWrapper('Interview Cancelled', `
          <p>Hi ${interview.candidate.name || 'there'},</p>
          <p>Your interview for <strong>${interview.job?.title || 'a role'}</strong> scheduled on <strong>${formatWhen(scheduledAt)}</strong> has been cancelled by the recruiter.</p>
        `)
      }).catch(() => {});
    }

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
    let hasAccess = recruiter.subscription?.hasVideoInterview || recruiter.subscription?.hasInterviewScheduling;
    if (!hasAccess && recruiter.purchasedFeatures && recruiter.purchasedFeatures.length > 0) {
      const now = new Date();
      if (recruiter.purchasedFeatures.some(f => (f.featureKey === 'hasVideoInterview' || f.featureKey === 'hasInterviewScheduling') && f.isActive && (!f.expiresAt || new Date(f.expiresAt) > now))) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ msg: 'Video interview scheduling requires a paid plan or feature purchase.', requiresUpgrade: true });
    }

    const { jobId } = req.params;
    const applications = await Application.find({ job: jobId, status: { $in: ['pending', 'reviewed', 'shortlisted'] } })
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
