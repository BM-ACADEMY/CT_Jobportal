// Counts for verification codes (see models/OtpEvent.js). Recording never breaks a login or signup: every failure is swallowed.
const record = (type, purpose, user, ms) => {
  try {
    const OtpEvent = require('../models/OtpEvent');
    Promise.resolve(OtpEvent.create({ type, purpose: purpose || '', user: user && (user._id || user) || null, ms: Number.isFinite(ms) ? ms : null })).catch(() => {});
  } catch (e) { /* ignore */ }
};

// Sends the mail and records "sent" (with how long the mail server took) or "send_failed".
const sendTracked = async (sendEmail, purpose, user, options) => {
  const t0 = Date.now();
  const ok = await sendEmail(options);
  record(ok ? 'sent' : 'send_failed', purpose, user, Date.now() - t0);
  return ok;
};

const TYPES = ['sent', 'send_failed', 'wrong', 'locked', 'expired', 'no_code', 'verified'];
const SLOW_MS = 5000;

const percentile = (sorted, p) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] : null);

// events: [{at, type, purpose, ms}]. Returns today (IST day) and last-7-day totals plus how fast the mail server answered.
const summarize = (events, now = new Date()) => {
  const ist = (d) => new Date(new Date(d).getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
  const today = ist(now);
  const weekAgo = now.getTime() - 7 * 86400000;
  const blank = () => Object.fromEntries(TYPES.map((t) => [t, 0]));
  const t = blank(); const w = blank(); const times = [];
  for (const e of events) {
    if (!TYPES.includes(e.type)) continue;
    if (ist(e.at) === today) t[e.type]++;
    if (new Date(e.at).getTime() >= weekAgo) {
      w[e.type]++;
      if (e.type === 'sent' && Number.isFinite(e.ms)) times.push(e.ms);
    }
  }
  times.sort((a, b) => a - b);
  return {
    today: t, week: w,
    mailSpeed: { samples: times.length, medianMs: percentile(times, 0.5), slowestTenPercentMs: percentile(times, 0.9), slowCount: times.filter((x) => x > SLOW_MS).length, slowMs: SLOW_MS },
  };
};

module.exports = { record, sendTracked, summarize, TYPES };
