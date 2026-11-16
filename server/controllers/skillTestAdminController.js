// Admin: how the free skill test is doing.
//   GET /api/admin/skill-tests?days=30   (Super Admin only, registered below the admin gate in adminRoutes.js)
// Tests taken come from FreeTestAttempt (no personal data). People come from SkillTestResult, which exists only for
// job seekers who registered or logged in and saved their result.
const FreeTestAttempt = require('../models/FreeTestAttempt');
const SkillTestResult = require('../models/SkillTestResult');
const { planSummary, suggestFor } = require('../utils/userUsage');

const clampDays = (raw) => Math.min(365, Math.max(1, parseInt(raw, 10) || 30));
const pct = (num, den) => (den ? Math.round((num / den) * 100) : 0);

const getSkillTestSummary = async (req, res) => {
  try {
    const days = clampDays(req.query.days);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const range = { createdAt: { $gte: since } };

    const [totalsRows, byDayRows, bySkillRows, saved, recent] = await Promise.all([
      FreeTestAttempt.aggregate([
        { $match: range },
        { $group: { _id: null, attempts: { $sum: 1 }, passed: { $sum: { $cond: ['$passed', 1, 0] } }, avg: { $avg: '$percentage' } } },
      ]),
      FreeTestAttempt.aggregate([
        { $match: range },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, attempts: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      FreeTestAttempt.aggregate([
        { $match: range },
        { $group: { _id: '$skill', attempts: { $sum: 1 }, passed: { $sum: { $cond: ['$passed', 1, 0] } }, avg: { $avg: '$percentage' } } },
        { $sort: { attempts: -1 } },
        { $limit: 30 },
      ]),
      SkillTestResult.countDocuments(range),
      SkillTestResult.find(range).sort({ createdAt: -1 }).limit(100).populate('user', 'name email phone subscriptionDetails subscriptionExpiry'),
    ]);

    const t = totalsRows[0] || { attempts: 0, passed: 0, avg: 0 };
    res.json({
      days,
      totals: {
        attempts: t.attempts,
        passed: t.passed,
        passRate: pct(t.passed, t.attempts),
        averagePercentage: Math.round(t.avg || 0),
        savedResults: saved,
        // Free tests (no account) and saved results (logged-in job seekers) come from two different
        // collections, so one is not a share of the other. Kept at most 100 for any old caller.
        savedShare: Math.min(100, pct(saved, t.attempts)),
      },
      byDay: byDayRows.map((r) => ({ date: r._id, attempts: r.attempts })),
      bySkill: bySkillRows.map((r) => ({ skill: r._id, attempts: r.attempts, passRate: pct(r.passed, r.attempts), averagePercentage: Math.round(r.avg || 0) })),
      recent: recent.map((r) => {
        const plan = planSummary({ details: r.user?.subscriptionDetails, expiry: r.user?.subscriptionExpiry });
        return {
        plan: plan.state === 'active' ? 'Paid' : plan.state === 'expired' ? 'Expired' : 'Free',
        suggestion: suggestFor({ role: 'jobseeker', plan, latestTest: { skill: r.skill, percentage: r.percentage, passed: !!r.passed } }),
        _id: r._id,
        name: r.user?.name || '',
        email: r.user?.email || '',
        phone: r.user?.phone || '',
        skill: r.skill,
        percentage: r.percentage,
        passed: !!r.passed,
        createdAt: r.createdAt,
        };
      }),
    });
  } catch (err) {
    console.error('Skill test summary error:', err.message);
    res.status(500).json({ msg: 'Could not load skill test numbers.' });
  }
};

module.exports = { getSkillTestSummary, clampDays };
