const User = require('../models/User');
const AdminRequest = require('../models/AdminRequest');
const mongoose = require('mongoose');

// @desc    Book a career counselling session
// @route   POST /api/requests/counselling
const submitCounsellingRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const plan = user.subscription;
    if (!plan || !plan.hasCareerCounselling) {
      return res.status(403).json({ msg: 'Career counselling is not included in your plan.' });
    }

    const limit = plan.careerCounsellingCount; // 0 = unlimited
    if (limit > 0 && user.counsellingSessionsUsed >= limit) {
      return res.status(403).json({ msg: `You have used all ${limit} session(s) in your plan. Please upgrade to book more.` });
    }

    const { bookingName, bookingEmail, bookingPhone, bookingDate, bookingTime } = req.body;
    if (!bookingName || !bookingEmail || !bookingDate || !bookingTime) {
      return res.status(400).json({ msg: 'Name, email, date and time are required.' });
    }

    const request = new AdminRequest({
      user: req.user.id,
      type: 'counselling',
      bookingName,
      bookingEmail,
      bookingPhone,
      bookingDate,
      bookingTime,
    });
    await request.save();

    user.counsellingSessionsUsed = (user.counsellingSessionsUsed || 0) + 1;
    await user.save();

    res.status(201).json({ msg: 'Session booked successfully. Our team will confirm shortly.' });
  } catch (err) {
    console.error('Counselling Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Submit interview prep request
// @route   POST /api/requests/interview-prep
const submitInterviewPrepRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const plan = user.subscription;
    if (!plan || !plan.hasInterviewPrep) {
      return res.status(403).json({ msg: 'Interview prep is not included in your plan.' });
    }

    const { skills, careerGoal } = req.body;
    if (!skills || !careerGoal) {
      return res.status(400).json({ msg: 'Skills and career goal are required.' });
    }

    const request = new AdminRequest({
      user: req.user.id,
      type: 'interview_prep',
      skills,
      careerGoal,
    });
    await request.save();

    res.status(201).json({ msg: 'Your interview prep request has been submitted. Our team will reach out soon.' });
  } catch (err) {
    console.error('Interview Prep Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Submit salary benchmarking request
// @route   POST /api/requests/salary-benchmark
const submitSalaryBenchmarkRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const plan = user.subscription;
    if (!plan || !plan.hasSalaryBenchmarking) {
      return res.status(403).json({ msg: 'Salary benchmarking is not included in your plan.' });
    }

    const { jobRole, companyName } = req.body;
    if (!jobRole || !companyName) {
      return res.status(400).json({ msg: 'Job role and company name are required.' });
    }

    const request = new AdminRequest({
      user: req.user.id,
      type: 'salary_benchmark',
      jobRole,
      companyName,
    });
    await request.save();

    res.status(201).json({ msg: 'Salary benchmarking request submitted. Results will be shared with you soon.' });
  } catch (err) {
    console.error('Salary Benchmark Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get sessions used by current user (for counselling count display)
// @route   GET /api/requests/my-sessions
const getMySessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('counsellingSessionsUsed');
    const sessions = await AdminRequest.find({ user: req.user.id, type: 'counselling' })
      .sort({ createdAt: -1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counts = { booked: 0, accepted: 0, upcoming: 0, completed: 0, rejected: 0 };
    sessions.forEach(s => {
      if (s.status === 'pending') counts.booked++;
      else if (s.status === 'approved') {
        counts.accepted++;
        if (new Date(s.bookingDate) >= today) counts.upcoming++;
      } else if (s.status === 'completed') counts.completed++;
      else if (s.status === 'cancelled') counts.rejected++;
    });

    res.json({
      counsellingSessionsUsed: user?.counsellingSessionsUsed || 0,
      sessions,
      counts,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get interview prep requests for current user
// @route   GET /api/requests/my-interview-prep
const getMyInterviewPrep = async (req, res) => {
  try {
    const requests = await AdminRequest.find({ user: req.user.id, type: 'interview_prep' })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Seeker: Cancel own counselling session
// @route   PATCH /api/requests/counselling/:id/cancel
const cancelMySession = async (req, res) => {
  try {
    const session = await AdminRequest.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'counselling',
    });

    if (!session) return res.status(404).json({ msg: 'Session not found' });
    if (session.status === 'completed') return res.status(400).json({ msg: 'Completed sessions cannot be cancelled' });
    if (session.status === 'cancelled') return res.status(400).json({ msg: 'Session is already cancelled' });

    session.status = 'cancelled';
    await session.save();

    // Refund the usage count so the user can rebook
    await User.findByIdAndUpdate(req.user.id, { $inc: { counsellingSessionsUsed: -1 } });

    res.json({ msg: 'Session cancelled successfully' });
  } catch (err) {
    console.error('Cancel Session Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Seeker: Cancel own interview prep request
// @route   PATCH /api/requests/interview-prep/:id/cancel
const cancelMyInterviewPrep = async (req, res) => {
  try {
    const request = await AdminRequest.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'interview_prep',
    });

    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (request.status === 'completed') return res.status(400).json({ msg: 'Completed requests cannot be cancelled' });
    if (request.status === 'cancelled') return res.status(400).json({ msg: 'Request is already cancelled' });

    request.status = 'cancelled';
    await request.save();

    res.json({ msg: 'Interview prep request cancelled' });
  } catch (err) {
    console.error('Cancel Interview Prep Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Admin: Get all requests
// @route   GET /api/requests/admin
const getAdminRequests = async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const requests = await AdminRequest.find(filter)
      .populate('user', 'name email avatar')
      .populate('assignedTo', 'name email role companyName')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('Get Admin Requests Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Admin: Update request status / notes
// @route   PATCH /api/requests/admin/:id
const updateRequestStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const request = await AdminRequest.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    ).populate('assignedTo', 'name email role');
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Admin: Assign request to a recruiter or company
// @route   PATCH /api/requests/admin/:id/assign
const adminAssignRequest = async (req, res) => {
  try {
    const { assignedTo, adminNotes } = req.body;
    if (!assignedTo) return res.status(400).json({ msg: 'assignedTo is required' });

    const assignee = await User.findById(assignedTo).select('name email role');
    if (!assignee) return res.status(404).json({ msg: 'Assignee user not found' });
    if (!['recruiter', 'company'].includes(assignee.role)) {
      return res.status(400).json({ msg: 'Can only assign to recruiters or companies' });
    }

    const update = {
      assignedTo,
      assignedAt: new Date(),
      status: 'approved',
    };
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const request = await AdminRequest.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name email avatar')
      .populate('assignedTo', 'name email role companyName');

    if (!request) return res.status(404).json({ msg: 'Request not found' });
    res.json(request);
  } catch (err) {
    console.error('Assign Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Admin: Get recruiters and companies for assign dropdown
// @route   GET /api/requests/admin/assignees
const getAssignees = async (req, res) => {
  try {
    const assignees = await User.find({ role: { $in: ['recruiter', 'company'] } })
      .select('name email role companyName')
      .sort({ name: 1 });
    res.json(assignees);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Recruiter/Company: Get requests assigned to them
// @route   GET /api/requests/assigned
const getAssignedRequests = async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = { assignedTo: req.user.id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const requests = await AdminRequest.find(filter)
      .populate('user', 'name email avatar phone')
      .sort({ assignedAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('Get Assigned Requests Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Recruiter/Company: Update status on an assigned request (complete / add notes)
// @route   PATCH /api/requests/assigned/:id
const updateAssignedRequest = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const request = await AdminRequest.findOne({ _id: req.params.id, assignedTo: req.user.id });
    if (!request) return res.status(404).json({ msg: 'Request not found or not assigned to you' });

    if (status) request.status = status;
    if (adminNotes !== undefined) request.adminNotes = adminNotes;
    await request.save();

    res.json(request);
  } catch (err) {
    console.error('Update Assigned Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Submit bulk application request (Company/Recruiter)
// @route   POST /api/requests/bulk-application
const submitBulkApplicationRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const plan = user.subscription;
    if (!plan || !plan.hasBulkApplicantManagement) {
      return res.status(403).json({ msg: 'Bulk applicant management is not included in your plan.' });
    }

    const { jobId, count, adminNotes } = req.body;
    if (!jobId || !count) {
      return res.status(400).json({ msg: 'Job ID and count are required.' });
    }

    const request = new AdminRequest({
      user: req.user.id,
      type: 'bulk_application',
      jobId,
      count,
      adminNotes
    });
    await request.save();

    res.status(201).json({ msg: 'Bulk application request submitted. Admin will process it soon.' });
  } catch (err) {
    console.error('Bulk Application Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Submit website creation request (Company/Recruiter)
// @route   POST /api/requests/website-request
const submitWebsiteRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const plan = user.subscription;
    // Check if companyProfileType is NOT 'No'
    if (!plan || !plan.companyProfileType || plan.companyProfileType === 'No') {
      return res.status(403).json({ msg: 'Website creation feature is not included in your plan. Please upgrade.' });
    }

    const { websiteDetails, websiteGoal, targetAudience, adminNotes } = req.body;
    if (!websiteDetails || !websiteGoal || !targetAudience) {
      return res.status(400).json({ msg: 'Website details, goal, and target audience are required.' });
    }

    const request = new AdminRequest({
      user: req.user.id,
      type: 'website_request',
      websiteDetails,
      websiteGoal,
      targetAudience,
      adminNotes
    });
    await request.save();

    res.status(201).json({ msg: 'Website creation request submitted. Our team will review your requirements and reach out shortly.' });
  } catch (err) {
    console.error('Website Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  submitBulkApplicationRequest,
  submitCounsellingRequest,
  submitInterviewPrepRequest,
  submitSalaryBenchmarkRequest,
  getMySessions,
  getMyInterviewPrep,
  cancelMySession,
  cancelMyInterviewPrep,
  getAdminRequests,
  updateRequestStatus,
  adminAssignRequest,
  getAssignees,
  getAssignedRequests,
  updateAssignedRequest,
  submitWebsiteRequest
};
