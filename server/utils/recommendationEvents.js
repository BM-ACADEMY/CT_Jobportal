// Recording and summarising recommendation events (see models/RecommendationEvent.js).
// Pure helpers: the model is passed in, so they can be tested without a database.
const mongoose = require('mongoose');

const SURFACES = ['jobs_matched', 'home_feed', 'email', 'top_candidates', 'candidate_search'];
const CLIENT_EVENTS = ['shown', 'clicked'];
const MAX_PER_REQUEST = 50;
const ATTRIBUTION_DAYS = 30;
const DAY = 86400000;

const isId = (v) => mongoose.isValidObjectId(v) && String(v).length === 24;
const dayOf = (now) => new Date(now.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10); // India date
const cleanScore = (s) => (s !== null && s !== undefined && s !== '' && Number.isFinite(Number(s)) ? Math.max(0, Math.min(100, Math.round(Number(s)))) : null);

// Turns what the browser sent into upsert operations. Anything malformed is dropped; the browser is never trusted for outcomes.
const buildClientEvents = (userId, side, raw, now = new Date()) => {
  const list = Array.isArray(raw) ? raw.slice(0, MAX_PER_REQUEST) : [];
  const ops = [];
  for (const e of list) {
    if (!e || !CLIENT_EVENTS.includes(e.event) || !SURFACES.includes(e.surface)) continue;
    if (side === 'seeker' && !isId(e.jobId)) continue;
    if (side === 'recruiter' && !isId(e.candidateId)) continue;
    const doc = {
      user: userId, side, event: e.event, surface: e.surface,
      job: isId(e.jobId) ? e.jobId : null,
      candidate: side === 'recruiter' ? e.candidateId : null,
      day: dayOf(now),
    };
    ops.push({ filter: doc, update: { $setOnInsert: { score: cleanScore(e.score), createdAt: now } } });
  }
  return ops;
};

const recordClientEvents = async (Model, userId, side, raw, now = new Date()) => {
  const ops = buildClientEvents(userId, side, raw, now);
  if (!ops.length) return 0;
  await Model.bulkWrite(ops.map((o) => ({ updateOne: { filter: o.filter, update: o.update, upsert: true } })), { ordered: false });
  return ops.length;
};

// An application or a shortlisting counts as a result of a suggestion only if that person was shown (or opened)
// the job in the last 30 days, either as a "job for you" or as a candidate suggested to the recruiter.
const recordOutcome = async (Model, { event, applicantId, jobId }, now = new Date()) => {
  if (!['applied', 'shortlisted'].includes(event) || !isId(applicantId) || !isId(jobId)) return false;
  const since = new Date(now.getTime() - ATTRIBUTION_DAYS * DAY);
  const origin = await Model.findOne({
    job: jobId, event: { $in: CLIENT_EVENTS }, createdAt: { $gte: since },
    $or: [{ user: applicantId, side: 'seeker' }, { candidate: applicantId, side: 'recruiter' }],
  }).sort({ createdAt: -1 }).lean();
  if (!origin) return false;
  await Model.updateOne(
    { user: applicantId, side: origin.side, event, surface: origin.surface, job: jobId, candidate: origin.side === 'recruiter' ? applicantId : null, day: dayOf(now) },
    { $setOnInsert: { score: origin.score, createdAt: now } },
    { upsert: true },
  );
  return true;
};

const rate = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

// rows: [{ _id: { side, surface, event }, count }] -> per side and surface with click, apply and shortlist rates (percent).
const summarise = (rows) => {
  const out = new Map();
  for (const r of rows) {
    const key = `${r._id.side}|${r._id.surface}`;
    if (!out.has(key)) out.set(key, { side: r._id.side, surface: r._id.surface, shown: 0, clicked: 0, applied: 0, shortlisted: 0 });
    out.get(key)[r._id.event] = r.count;
  }
  return [...out.values()].map((s) => ({
    ...s,
    clickRate: rate(s.clicked, s.shown),
    applyRate: rate(s.applied, s.shown),
    shortlistRate: rate(s.shortlisted, s.applied),
  })).sort((a, b) => a.side.localeCompare(b.side) || a.surface.localeCompare(b.surface));
};

module.exports = { SURFACES, buildClientEvents, recordClientEvents, recordOutcome, summarise, dayOf, MAX_PER_REQUEST, ATTRIBUTION_DAYS };
