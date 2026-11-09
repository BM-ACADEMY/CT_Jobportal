// Free AI for candidates is a marketing budget with two limits: a small monthly allowance per person, and one monthly
// ceiling for everyone. People on a paid plan are not counted here. Counters hold numbers only, never content.
//   FREE_AI_RESUME_BUILD, FREE_AI_RESUME_CHECK, FREE_AI_JOB_MATCH   per person per month (defaults 1, 2, 10)
//   FREE_AI_MONTHLY_CEILING   all free AI uses on the site per month (0 or unset = no ceiling)
//   FREE_AI_COST_PER_CALL     rupees, only used to show an estimated cost in admin
const KINDS = {
  resume_build: { label: 'AI resume builder', env: 'FREE_AI_RESUME_BUILD', def: 1 },
  resume_check: { label: 'resume checker', env: 'FREE_AI_RESUME_CHECK', def: 2 },
  job_match: { label: 'job match check', env: 'FREE_AI_JOB_MATCH', def: 10 },
};
const DAY = 86400000;

const allowanceFor = (kind, env = process.env) => {
  const k = KINDS[kind]; if (!k) return 0;
  const n = parseInt(env[k.env], 10);
  return Number.isFinite(n) && n >= 0 ? n : k.def;
};
const ceilingFrom = (env = process.env) => { const n = parseInt(env.FREE_AI_MONTHLY_CEILING, 10); return Number.isFinite(n) && n > 0 ? n : 0; };
const ist = (now) => new Date(now.getTime() + 330 * 60000);
const monthKey = (now = new Date()) => ist(now).toISOString().slice(0, 7);
const resetsOn = (now = new Date()) => { const d = ist(now); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - 330 * 60000); };

// Paid means an active plan with a price. The free plan, no plan and an expired plan all count as free.
const isPaid = (plan, expiry, now = new Date()) => !!plan && Number(plan.price) > 0 && (!expiry || new Date(expiry) > now);

const keys = (kind, userId, ym) => ({ person: `fa:u:${kind}:${userId}:${ym}`, total: `fa:total:${ym}`, feature: `fa:f:${kind}:${ym}` });
const expiry = (now) => new Date(now.getTime() + 40 * DAY);

// Takes one free use. `dedupe` (for example a job id) means the same thing asked twice in a month is charged once.
// Returns { ok:true, charged, left, limit } or { ok:false, reason:'person'|'paused', limit }.
const takeFree = async (Usage, { userId, kind, dedupe = '', now = new Date(), env = process.env }) => {
  const limit = allowanceFor(kind, env); const ceiling = ceilingFrom(env); const ym = monthKey(now); const k = keys(kind, userId, ym);
  if (dedupe) {
    const seen = await Usage.findOneAndUpdate({ key: `fa:d:${kind}:${userId}:${dedupe}:${ym}` }, { $setOnInsert: { count: 1, expireAt: expiry(now) } }, { upsert: true, new: false });
    if (seen) { const row = await Usage.findOne({ key: k.person }).lean(); return { ok: true, charged: false, left: Math.max(0, limit - (row?.count || 0)), limit }; }
  }
  const undoSeen = async () => { if (dedupe) await Usage.deleteOne({ key: `fa:d:${kind}:${userId}:${dedupe}:${ym}` }).catch(() => {}); };
  let person;
  try {
    person = await Usage.findOneAndUpdate({ key: k.person, count: { $lt: limit } }, { $inc: { count: 1 }, $setOnInsert: { expireAt: expiry(now) } }, { upsert: true, new: true });
  } catch (e) { if (e.code === 11000) { await undoSeen(); return { ok: false, reason: 'person', limit }; } throw e; }
  if (limit === 0) { await undoSeen(); return { ok: false, reason: 'person', limit }; }
  try {
    const filter = ceiling > 0 ? { key: k.total, count: { $lt: ceiling } } : { key: k.total };
    await Usage.findOneAndUpdate(filter, { $inc: { count: 1 }, $setOnInsert: { expireAt: expiry(now) } }, { upsert: true, new: true });
  } catch (e) {
    if (e.code === 11000) { await Usage.updateOne({ key: k.person }, { $inc: { count: -1 } }); await undoSeen(); return { ok: false, reason: 'paused', limit }; }
    throw e;
  }
  await Usage.updateOne({ key: k.feature }, { $inc: { count: 1 }, $setOnInsert: { expireAt: expiry(now) } }, { upsert: true }).catch(() => {});
  return { ok: true, charged: true, left: Math.max(0, limit - person.count), limit };
};

const messages = {
  person: (kind, limit) => `You have used your ${limit} free ${KINDS[kind].label}${limit === 1 ? '' : 's'} for this month. They come back on the 1st. A paid plan has no monthly limit on these tools.`,
  paused: () => 'Free AI is paused for the rest of this month because many people used it. It comes back on the 1st. Everything else on the site still works, and paid plans are not affected.',
};

module.exports = { KINDS, allowanceFor, ceilingFrom, monthKey, resetsOn, isPaid, takeFree, messages };
