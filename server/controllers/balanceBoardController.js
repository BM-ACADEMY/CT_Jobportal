// GET /api/admin/balance-board : live jobs and job seekers by field of work (Super Admin only; counts only, no personal details).
const { buildBalance } = require('../utils/balanceBoard');

const getBalanceBoard = async (req, res, deps = {}) => {
  if (!(req.user && req.user.role === 'admin')) return res.status(403).json({ msg: 'Access denied: Admin only' });
  try {
    const Job = deps.Job || require('../models/Job');
    const User = deps.User || require('../models/User');
    const Role = deps.Role || require('../models/Role');
    const seeker = await Role.findOne({ name: 'jobseeker' }).select('_id').lean();
    const jobRows = await Job.aggregate([
      { $match: { status: 'active', validThrough: { $gt: new Date() } } },
      { $group: { _id: '$category', n: { $sum: 1 } } }
    ]);
    // People who chose no field are counted under "Not set"; people who chose several count once in each.
    const seekerRows = seeker ? await User.aggregate([
      { $match: { role: seeker._id, isDeleted: { $ne: true }, isVerified: true } },
      { $project: { cats: { $cond: [{ $gt: [{ $size: { $ifNull: ['$profile.interestedCategories', []] } }, 0] }, '$profile.interestedCategories', ['']] } } },
      { $unwind: '$cats' },
      { $group: { _id: '$cats', n: { $sum: 1 } } }
    ]) : [];
    res.json(buildBalance(jobRows, seekerRows));
  } catch (err) { console.error('Balance board:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

module.exports = { getBalanceBoard };
