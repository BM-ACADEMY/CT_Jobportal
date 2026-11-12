// Admin view of referrals: how many people each user brought in (counts only).
// Models are required inside the function so this file loads without a database (tests).

// GET /api/admin/referrals   Admin only. Referrers sorted by referrals, biggest first. "verified" counts verified accounts only.
const listReferrals = async (req, res) => {
  try {
    const User = require('../models/User');
    const rows = await User.aggregate([
      { $match: { referredBy: { $ne: null } } },
      { $group: { _id: '$referredBy', referrals: { $sum: 1 }, verified: { $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] } }, lastAt: { $max: '$createdAt' } } },
      { $sort: { referrals: -1 } },
      { $limit: 200 },
    ]);
    const people = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select('name email').lean();
    const byId = new Map(people.map((p) => [String(p._id), p]));
    res.json({
      referrers: rows.map((r) => ({ userId: r._id, name: byId.get(String(r._id))?.name || '(deleted account)', email: byId.get(String(r._id))?.email || '', referrals: r.referrals, verified: r.verified, lastAt: r.lastAt })),
    });
  } catch (err) {
    console.error('Admin referrals error:', err.message);
    res.status(500).json({ msg: 'Could not load referrals.' });
  }
};

module.exports = { listReferrals };
