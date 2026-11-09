const { takeFree, isPaid, messages } = require('../utils/freeAi');

// Put after verifyToken. Paid plans pass without counting. If the counter store fails, the request is allowed
// (the daily safety limit and the AI provider's spend limit are still there).
const freeAiMonthly = (kind, { dedupeParam } = {}) => async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return next();
  try {
    const User = require('../models/User');
    const Usage = require('../models/AssistantUsage');
    const u = await User.findById(userId).select('subscription subscriptionExpiry subscriptionDetails').populate('subscription').lean(false);
    if (isPaid(u?.subscription, u?.subscriptionExpiry)) return next();
    const r = await takeFree(Usage, { userId, kind, dedupe: dedupeParam ? String(req.params[dedupeParam] || '') : '' });
    if (r.ok) return next();
    return res.status(429).json({ code: r.reason === 'paused' ? 'FREE_AI_PAUSED' : 'FREE_AI_LIMIT', msg: r.reason === 'paused' ? messages.paused() : messages.person(kind, r.limit) });
  } catch (err) {
    console.error('Free AI check failed, allowing the request:', err.message);
    return next();
  }
};

module.exports = { freeAiMonthly };
