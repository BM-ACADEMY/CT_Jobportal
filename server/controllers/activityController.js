const User = require('../models/User');
const Role = require('../models/Role');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const { testEmailRegex } = require('../utils/publicStats');
const { istDays, startOf, cleanDays, fill, funnel, compare } = require('../utils/activity');

const fmt = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: field, timezone: 'Asia/Kolkata' } });

// GET /api/admin/activity?days=7|14|30|60   (Super Admin only). All numbers come from our own database.
const getActivity = async (req, res) => {
  try {
    const days = istDays(cleanDays(req.query.days));
    const since = startOf(days[0]);
    const notTest = { $not: testEmailRegex() };
    const [signups, active, apps, jobs, pays] = await Promise.all([
      User.aggregate([{ $match: { createdAt: { $gte: since }, email: notTest } }, { $group: { _id: fmt('$createdAt'), n: { $sum: 1 }, v: { $sum: { $cond: ['$isVerified', 1, 0] } } } }]),
      User.aggregate([{ $match: { 'sessionLogs.loginAt': { $gte: since }, email: notTest } }, { $unwind: '$sessionLogs' }, { $match: { 'sessionLogs.loginAt': { $gte: since } } },
        { $group: { _id: { d: fmt('$sessionLogs.loginAt'), u: '$_id' } } }, { $group: { _id: '$_id.d', n: { $sum: 1 } } }]),
      Application.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: fmt('$createdAt'), n: { $sum: 1 } } }]),
      Job.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: fmt('$createdAt'), n: { $sum: 1 } } }]),
      Payment.aggregate([{ $match: { createdAt: { $gte: since }, status: 'completed' } }, { $group: { _id: fmt('$createdAt'), n: { $sum: 1 } } }]),
    ]);
    const series = { signups: fill(days, signups), verified: fill(days, signups, 'v'), active: fill(days, active), applications: fill(days, apps), jobs: fill(days, jobs), payments: fill(days, pays) };

    // Funnels follow the people who registered in this period.
    const roleIds = async (names) => (await Role.find({ name: { $in: names } }).select('_id').lean()).map((r) => r._id);
    const people = async (names) => User.find({ createdAt: { $gte: since }, email: notTest, role: { $in: await roleIds(names) } }).select('_id isVerified').limit(20000).lean();
    const seekers = await people(['jobseeker']); const sIds = seekers.map((u) => u._id);
    const firms = await people(['recruiter', 'company']); const fIds = firms.map((u) => u._id);
    const [applied, sPaid, posted, fPaid] = await Promise.all([
      sIds.length ? Application.distinct('applicant', { applicant: { $in: sIds } }) : [],
      sIds.length ? Payment.distinct('user', { user: { $in: sIds }, status: 'completed' }) : [],
      fIds.length ? Job.distinct('recruiter', { recruiter: { $in: fIds } }) : [],
      fIds.length ? Payment.distinct('user', { user: { $in: fIds }, status: 'completed' }) : [],
    ]);
    res.json({
      days, series, compare: compare(series),
      funnels: {
        jobseekers: funnel([['Registered', seekers.length], ['Verified email', seekers.filter((u) => u.isVerified).length], ['Applied to a job', applied.length], ['Paid', sPaid.length]]),
        companies: funnel([['Registered', firms.length], ['Verified email', firms.filter((u) => u.isVerified).length], ['Posted a job', posted.length], ['Paid', fPaid.length]]),
      },
    });
  } catch (e) { console.error('Activity:', e.message); res.status(500).json({ msg: 'Could not load' }); }
};

module.exports = { getActivity };
