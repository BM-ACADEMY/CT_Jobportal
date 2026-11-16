const User = require('../models/User');
const Job = require('../models/Job');
const Company = require('../models/Company');
const College = require('../models/College');
const CollegeStudent = require('../models/CollegeStudent');
const Application = require('../models/Application');
const CampusDrive = require('../models/CampusDrive');
const { employerNextAction, collegeNextAction, DAY } = require('../utils/homeSummary');
const { JOB_MAX_AGE_DAYS } = require('../utils/publicVisibility');

// GET /api/home/summary : the numbers and the one next action for the logged-in employer or college home page.
const getHomeSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role', 'name').select('role company name').lean();
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const role = user.role?.name;

    if (role === 'company' || role === 'recruiter' || role === 'org_employee') {
      const jobFilter = user.company ? { $or: [{ recruiter: req.user.id }, { company: user.company }] } : { recruiter: req.user.id };
      const jobs = await Job.find({ ...jobFilter, status: 'active' }).select('_id createdAt renewedAt title').lean();
      const ids = jobs.map((j) => j._id);
      const cut = Date.now() - JOB_MAX_AGE_DAYS * DAY;
      const staleJobs = jobs.filter((j) => Math.max(new Date(j.createdAt).getTime(), j.renewedAt ? new Date(j.renewedAt).getTime() : 0) < cut).length;
      const [byStatus, newApplicants, company] = await Promise.all([
        ids.length ? Application.aggregate([{ $match: { job: { $in: ids } } }, { $group: { _id: '$status', n: { $sum: 1 } } }]) : [],
        ids.length ? Application.countDocuments({ job: { $in: ids }, status: 'pending' }) : 0,
        user.company ? Company.findById(user.company).select('is_verified').lean() : null,
      ]);
      const pipeline = Object.fromEntries(byStatus.map((r) => [r._id, r.n]));
      const verified = company ? !!company.is_verified : undefined;
      const stats = { verified, openJobs: jobs.length, newApplicants, staleJobs };
      return res.json({ kind: 'employer', stats: { ...stats, applicants: Object.values(pipeline).reduce((a, b) => a + b, 0), pipeline }, next: employerNextAction(stats) });
    }

    if (role === 'college') {
      const college = await College.findOne({ $or: [{ tpoUser: req.user.id }, { teamMembers: { $elemMatch: { user: req.user.id, isActive: true } } }] }).select('_id').lean();
      if (!college) return res.json({ kind: 'college', stats: { students: 0, applied: 0, shortlisted: 0, drives: 0 }, next: collegeNextAction({}) });
      const students = await CollegeStudent.find({ college: college._id, user: { $ne: null } }).select('user').lean();
      const uids = students.map((s) => s.user);
      const [applied, shortlisted, drives] = await Promise.all([
        uids.length ? Application.distinct('applicant', { applicant: { $in: uids } }) : [],
        uids.length ? Application.distinct('applicant', { applicant: { $in: uids }, status: { $in: ['shortlisted', 'accepted'] } }) : [],
        CampusDrive.countDocuments({ college: college._id }),
      ]);
      const stats = { students: students.length, applied: applied.length, shortlisted: shortlisted.length, drives };
      return res.json({ kind: 'college', stats, next: collegeNextAction(stats) });
    }

    res.json({ kind: 'other' });
  } catch (err) { console.error('Home summary:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

module.exports = { getHomeSummary };
