// Free AI for candidates is a marketing budget, kept gentle. Only the two costly resume tools are limited, and only
// for people on the free plan. Each use comes back a few days later (a rolling window, not a calendar reset), and the
// person is always told the exact time they can use it again. Job match checks and skill tests are not limited here.
//   FREE_AI_RESUME_BUILD, FREE_AI_RESUME_CHECK   free uses per window (defaults 3 and 5)
//   FREE_AI_WINDOW_DAYS                          days before a used one comes back (default 7)
//   FREE_AI_DAILY_CEILING                        all free uses on the site per day (0 or unset = no ceiling)
//   FREE_AI_LIMITS=off                           switches every limit above off
//   FREE_AI_COST_PER_CALL                        rupees, only used to show an estimated cost in admin
// Counters hold numbers and times only, never content.
const KINDS = {
  resume_build: { label: 'AI resume builder', env: 'FREE_AI_RESUME_BUILD', def: 3 },
  resume_check: { label: 'resume checker', env: 'FREE_AI_RESUME_CHECK', def: 5 },
};
const DAY = 86400000;
const num = (v, d, min = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) && n >= min ? n : d; };

const limitsOn = (env = process.env) => String(env.FREE_AI_LIMITS || '').toLowerCase() !== 'off';
const allowanceFor = (kind, env = process.env) => (KINDS[kind] ? num(env[KINDS[kind].env], KINDS[kind].def) : 0);
const windowMs = (env = process.env) => num(env.FREE_AI_WINDOW_DAYS, 7, 1) * DAY;
const ceilingFrom = (env = process.env) => num(env.FREE_AI_DAILY_CEILING, 0);
const ist = (now) => new Date(now.getTime() + 330 * 60000);
const dayKey = (now = new Date()) => ist(now).toISOString().slice(0, 10);
const monthKey = (now = new Date()) => ist(now).toISOString().slice(0, 7);
const tomorrow = (now = new Date()) => { const d = ist(now); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - 330 * 60000); };
const when = (d) => new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });

// Paid means an active plan with a price. The free plan, no plan and an expired plan all count as free.
const isPaid = (plan, expiry, now = new Date()) => !!plan && Number(plan.price) > 0 && (!expiry || new Date(expiry) > now);

const prefix = (kind, userId) => `fa:r:${kind}:${userId}:`;

// What one person has left right now, and when the next one comes back.
const peek = async (Usage, { userId, kind, now = new Date(), env = process.env }) => {
  const limit = allowanceFor(kind, env); const w = windowMs(env);
  const rows = await Usage.find({ key: { $regex: `^${prefix(kind, userId)}` } }).select('key').lean();
  const times = rows.map((r) => parseInt(String(r.key).split(':')[4], 10)).filter((t) => Number.isFinite(t) && t > now.getTime() - w).sort((a, b) => a - b);
  const used = times.length; const left = Math.max(0, limit - used);
  const nextAt = used > 0 && used >= limit && limit > 0 ? new Date(times[used - limit] + w) : (used > 0 ? new Date(times[0] + w) : null);
  return { limit, used, left, nextAt };
};

// Takes one free use. Returns { ok:true, left, limit } or { ok:false, reason:'person'|'paused', nextAt }.
const takeFree = async (Usage, { userId, kind, now = new Date(), env = process.env }) => {
  const p = await peek(Usage, { userId, kind, now, env });
  if (p.left <= 0) return { ok: false, reason: 'person', limit: p.limit, nextAt: p.limit > 0 ? p.nextAt : null };
  const ceiling = ceilingFrom(env);
  try {
    const filter = ceiling > 0 ? { key: `fa:day:${dayKey(now)}`, count: { $lt: ceiling } } : { key: `fa:day:${dayKey(now)}` };
    await Usage.findOneAndUpdate(filter, { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(now.getTime() + 3 * DAY) } }, { upsert: true, new: true });
  } catch (e) {
    if (e.code === 11000) return { ok: false, reason: 'paused', limit: p.limit, nextAt: tomorrow(now) };
    throw e;
  }
  const ts = now.getTime();
  await Usage.create({ key: `${prefix(kind, userId)}${ts}-${Math.random().toString(36).slice(2, 6)}`, count: 1, expireAt: new Date(ts + windowMs(env) + DAY) });
  await Usage.updateOne({ key: `fa:f:${kind}:${monthKey(now)}` }, { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(ts + 40 * DAY) } }, { upsert: true }).catch(() => {});
  return { ok: true, left: p.left - 1, limit: p.limit };
};

const messages = {
  person: (kind, nextAt) => `You have used your free ${KINDS[kind].label} uses for now.${nextAt ? ` You can use it again on ${when(nextAt)}.` : ''} A paid plan has no limit on these tools.`,
  paused: (nextAt) => `Free AI has reached its limit for today because many people used it. It opens again on ${when(nextAt)}. Everything else on the site still works, and paid plans are not affected.`,
};

module.exports = { KINDS, limitsOn, allowanceFor, windowMs, ceilingFrom, dayKey, monthKey, tomorrow, when, isPaid, peek, takeFree, messages };
