const { takeFree, isPaid, limitsOn, messages } = require('../utils/freeAi');

// Put after verifyToken, on the two resume tools only. Paid plans pass without counting. If the counter store fails,
// the request is allowed (the daily safety limit and the AI provider's spend limit are still there).
const freeAiLimit = (kind) => async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId || !limitsOn()) return next();
  try {
    const User = require('../models/User');
    const Usage = require('../models/AssistantUsage');
    const u = await User.findById(userId).select('subscription subscriptionExpiry subscriptionDetails').populate('subscription');
    if (isPaid(u?.subscription, u?.subscriptionExpiry)) return next();
    const r = await takeFree(Usage, { userId, kind });
    if (r.ok) return next();
    return res.status(429).json({
      code: r.reason === 'paused' ? 'FREE_AI_PAUSED' : 'FREE_AI_LIMIT',
      nextAt: r.nextAt || null,
      msg: r.reason === 'paused' ? messages.paused(r.nextAt) : messages.person(kind, r.nextAt),
    });
  } catch (err) {
    console.error('Free AI check failed, allowing the request:', err.message);
    return next();
  }
};

module.exports = { freeAiLimit };
