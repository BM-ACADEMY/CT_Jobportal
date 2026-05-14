const User = require('../models/User');
const AdminRequest = require('../models/AdminRequest');

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
    res.json({ counsellingSessionsUsed: user?.counsellingSessionsUsed || 0 });
  } catch (err) {
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
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('Get Admin Requests Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Admin: Update request status
// @route   PATCH /api/requests/admin/:id
const updateRequestStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const request = await AdminRequest.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    );
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  submitCounsellingRequest,
  submitInterviewPrepRequest,
  submitSalaryBenchmarkRequest,
  getMySessions,
  getAdminRequests,
  updateRequestStatus,
};
