const User = require('../models/User');
const AssistantUsage = require('../models/AssistantUsage');
const { resolveProvider, chatCompletion } = require('../utils/aiHelper');
const { buildMessages, cleanMessage, cleanReply, NOTICE } = require('../utils/assistant');
const { getRankedMatches, engineEnabled } = require('../utils/matchingJobs');

const DAILY_LIMIT = () => Number(process.env.ASSISTANT_DAILY_LIMIT) || 30; // messages per person per day
const MONTHLY_TOKEN_BUDGET = () => Number(process.env.ASSISTANT_MONTHLY_TOKEN_BUDGET) || 2000000; // all people, per month
const WARN_AT = 0.8;
const DAY = 86400000;

const assistantEnabled = (env = process.env) => env.ASSISTANT_ENABLED === 'true';
const indiaNow = (now = new Date()) => new Date(now.getTime() + 5.5 * 3600 * 1000).toISOString();
const dayKey = (userId, now) => `u:${userId}:${indiaNow(now).slice(0, 10)}`;
const monthKey = (now) => `g:${indiaNow(now).slice(0, 7)}`;

// Takes one message from the person's daily allowance. Atomic: two requests at once cannot both take the last one.
const takeDailyMessage = async (userId, now = new Date()) => {
  try {
    const row = await AssistantUsage.findOneAndUpdate(
      { key: dayKey(userId, now), count: { $lt: DAILY_LIMIT() } },
      { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(now.getTime() + 2 * DAY) } },
      { upsert: true, new: true },
    );
    return { ok: true, remaining: Math.max(0, DAILY_LIMIT() - row.count) };
  } catch (err) {
    if (err.code === 11000) return { ok: false }; // the row exists and is already at the limit
    throw err;
  }
};

const overBudget = async (now = new Date()) => {
  const row = await AssistantUsage.findOne({ key: monthKey(now) }).lean();
  return (row?.tokens || 0) >= MONTHLY_TOKEN_BUDGET();
};

// Adds the tokens used, and raises the cost alarm once when 80% of the month's budget is reached.
const addTokens = async (tokens, { io, now = new Date() } = {}) => {
  const row = await AssistantUsage.findOneAndUpdate(
    { key: monthKey(now) },
    { $inc: { tokens }, $setOnInsert: { expireAt: new Date(now.getTime() + 62 * DAY) } },
    { upsert: true, new: true },
  );
  if (row.tokens >= WARN_AT * MONTHLY_TOKEN_BUDGET()) {
    const first = await AssistantUsage.findOneAndUpdate({ key: monthKey(now), warned: { $ne: true } }, { $set: { warned: true } });
    if (first) {
      const msg = `Assistant cost alarm: ${row.tokens} of ${MONTHLY_TOKEN_BUDGET()} tokens used this month (${Math.round((row.tokens / MONTHLY_TOKEN_BUDGET()) * 100)}%). It stops at 100%.`;
      console.error(`[Assistant] ${msg}`);
      try {
        const { notifyRoles } = require('../utils/inAppNotifications');
        await notifyRoles({ io, roles: ['admin'], title: 'AI assistant budget warning', message: msg, type: 'assistant_budget', link: '/admin' });
      } catch (err) { console.error('[Assistant] alarm notification failed:', err.message); }
    }
  }
};

// @route POST /api/assistant/chat   Body: { message, history?: [{ role: 'user'|'assistant', content }] }
// @access Private (job seekers). Off unless ASSISTANT_ENABLED=true and the provider key and model are set.
const chat = async (req, res) => {
  try {
    if (!assistantEnabled()) return res.status(503).json({ msg: 'The assistant is not available right now.' });
    const provider = resolveProvider('ASSISTANT');
    if (provider.error) {
      console.error(`[Assistant] not configured: ${provider.error}`);
      return res.status(503).json({ msg: 'The assistant is not available right now.' });
    }

    const message = cleanMessage(req.body?.message);
    if (message.error) return res.status(400).json({ msg: message.error });

    if (await overBudget()) return res.status(503).json({ msg: 'The assistant is resting for now. Please try again later.' });

    const user = await User.findById(req.user.id).select('profile blockedEntities hiddenJobs');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const allowance = await takeDailyMessage(req.user.id);
    if (!allowance.ok) return res.status(429).json({ msg: `You have used your ${DAILY_LIMIT()} assistant messages for today. Please come back tomorrow.` });

    // Suggested jobs come from the same engine as the website, only when it is on. The person's own data and public job data only.
    let matches = [];
    if (engineEnabled()) {
      try { matches = await getRankedMatches(user, { Job: require('../models/Job'), User, Application: require('../models/Application') }, { limit: 5 }); } catch { matches = []; }
    }

    const messages = buildMessages(user, matches, req.body?.history, message.text);
    let result;
    try {
      result = await chatCompletion({ provider, messages, maxTokens: 400 });
    } catch (err) {
      // Never log the message or the profile; the provider's error text is enough.
      console.error('[Assistant] provider call failed:', String(err.message).slice(0, 200));
      return res.status(502).json({ msg: 'The assistant could not answer just now. Please try again.' });
    }
    await addTokens(result.tokens, { io: req.io }).catch((err) => console.error('[Assistant] usage update failed:', err.message));

    res.json({ reply: cleanReply(result.text), notice: NOTICE, remaining: allowance.remaining });
  } catch (err) {
    console.error('[Assistant] error:', err.message);
    res.status(500).json({ msg: 'Something went wrong. Please try again.' });
  }
};

// @route GET /api/assistant/status  -> { enabled, dailyLimit }. The widget only shows when this says enabled.
const status = (req, res) => {
  const ready = assistantEnabled() && !resolveProvider('ASSISTANT').error;
  res.json({ enabled: ready, dailyLimit: ready ? DAILY_LIMIT() : 0 });
};

module.exports = { chat, status, assistantEnabled, takeDailyMessage, overBudget, addTokens, dayKey, monthKey };
