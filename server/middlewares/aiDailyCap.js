// One hidden daily safety cap on AI actions, the same for every plan. A normal person never reaches it;
// it only stops scripts and button-mashing from running up the AI bill. Plan counts stay the limits people see.
//   AI_DAILY_LIMIT_MATCH  per person per day, job match checks on job pages (default 40)
//   AI_DAILY_LIMIT_OTHER  per person per day, resume review / resume tools (default 15)
// Counters live in the AssistantUsage collection (key "ai:<kind>:<userId>:<day>"), expire by themselves and hold no content.
// If the counter store fails, the request is allowed (the OpenRouter spend limit is the backstop).
const DAY = 86400000;
const DEFAULTS = { match: 40, other: 15 };

const limitFor = (kind, env = process.env) => {
  const fromEnv = Number(env[`AI_DAILY_LIMIT_${kind.toUpperCase()}`]);
  return fromEnv > 0 ? fromEnv : DEFAULTS[kind] || DEFAULTS.other;
};

const indiaDay = (now = new Date()) => new Date(now.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

// Takes one action from the person's allowance. Atomic: two requests at once cannot both take the last one.
const takeAiAction = async (Usage, userId, kind, { now = new Date(), env = process.env } = {}) => {
  const limit = limitFor(kind, env);
  try {
    const row = await Usage.findOneAndUpdate(
      { key: `ai:${kind}:${userId}:${indiaDay(now)}`, count: { $lt: limit } },
      { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(now.getTime() + 2 * DAY) } },
      { upsert: true, new: true },
    );
    return { ok: true, remaining: Math.max(0, limit - row.count), limit };
  } catch (err) {
    if (err.code === 11000) return { ok: false, limit }; // the row exists and is already at the limit
    throw err;
  }
};

const aiDailyCap = (kind = 'other', Usage) => async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return next();
  try {
    const Model = Usage || require('../models/AssistantUsage');
    const result = await takeAiAction(Model, userId, kind);
    if (!result.ok) {
      return res.status(429).json({ msg: 'You have reached today\'s limit for AI tools. Please try again tomorrow.' });
    }
    return next();
  } catch (err) {
    console.error('AI daily cap check failed, allowing the request:', err.message);
    return next();
  }
};

module.exports = { aiDailyCap, takeAiAction, limitFor, indiaDay };
