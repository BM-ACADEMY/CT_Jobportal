const User = require('../models/User');
const Role = require('../models/Role');
const SpendEntry = require('../models/SpendEntry');
const Payment = require('../models/Payment');
const { summarize, cleanDays, resultsBySource } = require('../utils/signupSource');
const { testEmailRegex } = require('../utils/publicStats');

// GET /api/admin/growth/sources?days=7|30|60|90   (Super Admin only)
const getSources = async (req, res) => {
  try {
    const days = cleanDays(req.query.days);
    const since = new Date(Date.now() - days * 86400000);
    const roles = await Role.find().select('name').lean();
    const nameOf = Object.fromEntries(roles.map((r) => [String(r._id), r.name]));
    const users = await User.find({ createdAt: { $gte: since }, email: { $not: testEmailRegex() } })
      .select('_id signupSource referredBy isVerified role').limit(20000).lean();
    const rows = summarize(users.map((u) => ({ ...u, roleName: nameOf[String(u.role)] })));
    // Money side: ad spend tagged with a source, and what people from that source have paid (completed payments only).
    const sinceDay = new Date(since.getTime() + 330 * 60000).toISOString().slice(0, 10);
    const spends = await SpendEntry.find({ voided: false, source: { $ne: '' }, date: { $gte: sinceDay } }).select('source amount').lean();
    const ids = users.filter((u) => u.signupSource && u.signupSource.source).map((u) => u._id);
    const pays = ids.length ? await Payment.find({ user: { $in: ids }, status: 'completed' }).select('user baseAmount amount').lean() : [];
    const paidByUser = {};
    for (const p of pays) paidByUser[String(p.user)] = (paidByUser[String(p.user)] || 0) + (Number(p.baseAmount) || Number(p.amount) || 0);
    res.json({ days, total: users.length, rows, sources: resultsBySource(users, paidByUser, spends) });
  } catch (e) { console.error('Growth sources:', e.message); res.status(500).json({ msg: 'Could not load' }); }
};

module.exports = { getSources };
