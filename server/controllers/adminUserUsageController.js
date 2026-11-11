const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Payment = require('../models/Payment');
const SkillTestResult = require('../models/SkillTestResult');
const Usage = require('../models/AssistantUsage');
const { USAGE_FIELDS } = require('../utils/planEntitlements');
const { KINDS } = require('../utils/freeAi');
const { planSummary, featureRows } = require('../utils/userUsage');

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const DAY = 86400000;

// GET /api/admin/users/:id/usage (admin only, read only)
const getUserUsage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!OBJECT_ID.test(String(id || ''))) return res.status(400).json({ msg: 'Invalid account id.' });
    const user = await User.findById(id).populate('role', 'name');
    if (!user) return res.status(404).json({ msg: 'Account not found.' });
    const role = user.role?.name || 'jobseeker';
    const since = Date.now() - 30 * DAY;

    let details = user.subscriptionDetails || null;
    if (!details) {
      const free = await Subscription.findOne({ price: 0, isActive: true, role: role === 'org_employee' ? 'company' : role }).lean();
      details = free || null;
    }
    const [skillAll, skillRecent, applications, jobsPosted, payments, aiRows] = await Promise.all([
      SkillTestResult.countDocuments({ user: user._id }),
      SkillTestResult.find({ user: user._id }).sort({ createdAt: -1 }).limit(5).select('skill percentage passed createdAt').lean(),
      Application.countDocuments({ applicant: user._id }),
      Job.countDocuments({ recruiter: user._id }),
      Payment.find({ user: user._id }).sort({ createdAt: -1 }).limit(5).select('amount status createdAt').lean(),
      Usage.find({ key: { $regex: `^fa:r:[a-z_]+:${user._id}:` } }).select('key').lean(),
    ]);
    const freeAi = Object.keys(KINDS).map((k) => {
      const times = aiRows.filter((r) => String(r.key).startsWith(`fa:r:${k}:`)).map((r) => parseInt(String(r.key).split(':')[4], 10)).filter(Number.isFinite);
      return { kind: k, label: KINDS[k].label, last30Days: times.filter((t) => t > since).length, lastUsedAt: times.length ? new Date(Math.max(...times)) : null };
    });

    res.json({
      user: { _id: user._id, name: user.name, email: user.email, role, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt || null },
      plan: planSummary({ details, expiry: user.subscriptionExpiry, autoRenew: user.autoRenew }),
      givenByAdmin: !!user.subscriptionDetails && !(Array.isArray(payments) && payments.length),
      used: USAGE_FIELDS.map((u) => ({ key: u.key, label: u.label, value: Number(user[u.key] || 0) })).filter((u) => u.value > 0),
      payPerFeature: featureRows(user.purchasedFeatures),
      freeAi,
      skillTests: { total: skillAll, recent: skillRecent },
      applications, jobsPosted,
      payments: payments.map((p) => ({ amount: p.amount, status: p.status, at: p.createdAt })),
    });
  } catch (err) {
    console.error('User usage error:', err.message);
    res.status(500).json({ msg: 'Could not load this person\'s usage.' });
  }
};

module.exports = { getUserUsage };
