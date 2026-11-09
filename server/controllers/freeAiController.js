const User = require('../models/User');
const Usage = require('../models/AssistantUsage');
const { KINDS, factorFor, effectiveLimit, limitsOn, allowanceFor, windowMs, ceilingFrom, dayKey, monthKey, tomorrow, isPaid, peek } = require('../utils/freeAi');

// GET /api/user/free-ai-status : what this person has left right now and when a used one comes back.
const myStatus = async (req, res) => {
  try {
    const u = await User.findById(req.user.id).select('subscription subscriptionExpiry subscriptionDetails').populate('subscription');
    const paid = isPaid(u?.subscription, u?.subscriptionExpiry);
    const features = {};
    for (const k of Object.keys(KINDS)) { const p = await peek(Usage, { userId: req.user.id, kind: k }); features[k] = { label: KINDS[k].label, limit: p.limit, left: p.left, nextAt: p.nextAt }; }
    res.json({ paid, limited: limitsOn(), windowDays: windowMs() / 86400000, features });
  } catch (e) { console.error('Free AI status:', e.message); res.status(500).json({ msg: 'Could not load' }); }
};

// GET /api/admin/free-ai : today's and this month's free AI use (Super Admin only).
const adminSummary = async (req, res) => {
  try {
    const rows = await Usage.find({ key: { $in: [`fa:day:${dayKey()}`, ...Object.keys(KINDS).map((k) => `fa:f:${k}:${monthKey()}`)] } }).lean();
    const by = Object.fromEntries(rows.map((r) => [r.key, r.count]));
    const fc = await factorFor(Usage);
    const features = Object.keys(KINDS).map((k) => ({ kind: k, label: KINDS[k].label, perPerson: effectiveLimit(k, fc.factor), basePerPerson: allowanceFor(k), used: by[`fa:f:${k}:${monthKey()}`] || 0 }));
    const month = features.reduce((a, f) => a + f.used, 0);
    const cost = parseFloat(process.env.FREE_AI_COST_PER_CALL);
    res.json({
      factor: fc.factor, target: fc.target, avgPerDay: fc.avg,
      limited: limitsOn(), windowDays: windowMs() / 86400000, today: by[`fa:day:${dayKey()}`] || 0, ceiling: ceilingFrom(), reopens: tomorrow(),
      month, costPerCall: Number.isFinite(cost) && cost > 0 ? cost : null, estimatedCost: Number.isFinite(cost) && cost > 0 ? Math.round(month * cost) : null,
      features,
    });
  } catch (e) { console.error('Free AI summary:', e.message); res.status(500).json({ msg: 'Could not load' }); }
};

module.exports = { myStatus, adminSummary };
