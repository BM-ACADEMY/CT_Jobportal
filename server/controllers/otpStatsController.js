const OtpEvent = require('../models/OtpEvent');
const { summarize } = require('../utils/otpEvents');

// GET /api/admin/otp-stats (Super Admin only): verification codes sent, failed, wrong, expired and verified, today and in 7 days.
const getOtpStats = async (req, res) => {
  try {
    const since = new Date(Date.now() - 8 * 86400000);
    const events = await OtpEvent.find({ at: { $gte: since } }).select('at type ms').lean();
    const first = await OtpEvent.findOne().sort({ at: 1 }).select('at').lean();
    res.json({ ...summarize(events), recordingSince: first ? first.at : null });
  } catch (e) { console.error('OTP stats:', e.message); res.status(500).json({ msg: 'Could not load' }); }
};

module.exports = { getOtpStats };
