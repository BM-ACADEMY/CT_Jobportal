const User = require('../models/User');
const Role = require('../models/Role');
const { summarize, cleanDays } = require('../utils/signupSource');
const { testEmailRegex } = require('../utils/publicStats');

// GET /api/admin/growth/sources?days=7|30|60|90   (Super Admin only)
const getSources = async (req, res) => {
  try {
    const days = cleanDays(req.query.days);
    const since = new Date(Date.now() - days * 86400000);
    const roles = await Role.find().select('name').lean();
    const nameOf = Object.fromEntries(roles.map((r) => [String(r._id), r.name]));
    const users = await User.find({ createdAt: { $gte: since }, email: { $not: testEmailRegex() } })
      .select('signupSource referredBy isVerified role').limit(20000).lean();
    const rows = summarize(users.map((u) => ({ ...u, roleName: nameOf[String(u.role)] })));
    res.json({ days, total: users.length, rows });
  } catch (e) { console.error('Growth sources:', e.message); res.status(500).json({ msg: 'Could not load' }); }
};

module.exports = { getSources };
