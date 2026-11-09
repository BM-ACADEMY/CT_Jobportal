const User = require('../models/User');
const Usage = require('../models/AssistantUsage');
const { KINDS, allowanceFor, ceilingFrom, monthKey, resetsOn, isPaid } = require('../utils/freeAi');

// GET /api/user/free-ai-status : what is left this month for this person.
const myStatus = async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select('subscription subscriptionExpiry subscriptionDetails').populate('subscription');
    const paid = isPaid(u?.subscription, u?.subscriptionExpiry);
    const ym = monthKey();
    const rows = await Usage.find({ key: { $in: Object.keys(KINDS).map((k) => `fa:u:${k}:${req.user.id}:${ym}`) } }).lean();
    const used = Object.fromEntries(rows.map((r) => [r.key.split(':')[2], r.count]));
    const features = Object.fromEntries(Object.keys(KINDS).map((k) => { const limit = allowanceFor(k); return [k, { label: KINDS[k].label, limit, left: Math.max(0, limit - (used[k] || 0)) }]; }));
    res.json({ paid, resetsOn: resetsOn(), features });
  } catch (e) { console.error('Free AI status:', e.message); res.status(500).json({ msg: 'Could not load' }); }
};

// GET /api/admin/free-ai : this month's free AI use against the ceiling (Super Admin only).
const adminSummary = async (req, res) => {
  try {
    const ym = monthKey();
    const rows = await Usage.find({ key: { $in: [`fa:total:${ym}`, ...Object.keys(KINDS).map((k) => `fa:f:${k}:${ym}`)] } }).lean();
    const by = Object.fromEntries(rows.map((r) => [r.key, r.count]));
    const total = by[`fa:total:${ym}`] || 0; const cost = parseFloat(process.env.FREE_AI_COST_PER_CALL);
    res.json({
      month: ym, total, ceiling: ceilingFrom(), resetsOn: resetsOn(),
      costPerCall: Number.isFinite(cost) && cost > 0 ? cost : null,
      estimatedCost: Number.isFinite(cost) && cost > 0 ? Math.round(total * cost) : null,
      features: Object.keys(KINDS).map((k) => ({ kind: k, label: KINDS[k].label, perPerson: allowanceFor(k), used: by[`fa:f:${k}:${ym}`] || 0 })),
    });
  } catch (e) { console.error('Free AI summary:', e.message); res.status(500).json({ msg: 'Could not load' }); }
};

module.exports = { myStatus, adminSummary };
