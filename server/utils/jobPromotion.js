// Sponsored and urgent jobs. Turned on by an admin by hand after the company has paid (no prices here, nothing through Razorpay).
// Pure functions so the rules are easy to test.
const DAY = 86400000;
const MAX_SPONSORED = 5;      // at most this many sponsored jobs show at once, so the list stays useful
const MAX_SPONSOR_DAYS = 30;
const MAX_URGENT_DAYS = 14;

const promoState = (job, now = new Date()) => ({
  isSponsored: !!job?.sponsoredUntil && new Date(job.sponsoredUntil) > now,
  isUrgent: !!job?.urgentUntil && new Date(job.urgentUntil) > now,
});

// Sponsored jobs first (newest sponsorship first, capped), everything else in its existing order.
const withPromotion = (jobs, now = new Date()) => {
  const flagged = jobs.map((j) => ({ ...j, ...promoState(j, now) }));
  const sponsored = flagged.filter((j) => j.isSponsored).sort((a, b) => new Date(b.sponsoredUntil) - new Date(a.sponsoredUntil)).slice(0, MAX_SPONSORED);
  const keep = new Set(sponsored);
  return [...sponsored, ...flagged.filter((j) => !keep.has(j)).map((j) => (j.isSponsored ? { ...j, isSponsored: false } : j))];
};

const wholeDays = (v, max) => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= max ? n : 0; };

// job.company must be the company document (with is_verified). activeOthers = sponsored jobs running now, not counting this one.
const checkSponsor = ({ job, days, note, activeOthers, now = new Date() }) => {
  if (!job || job.status !== 'active') return { error: 'Only a live job can be sponsored' };
  if (!job.company?.is_verified) return { error: 'Only verified companies can sponsor a job' };
  const d = wholeDays(days, MAX_SPONSOR_DAYS); if (!d) return { error: `Choose 1 to ${MAX_SPONSOR_DAYS} days` };
  const n = String(note || '').replace(/\s+/g, ' ').trim().slice(0, 200); if (!n) return { error: 'Note how it was paid, for example the UPI reference' };
  if (activeOthers >= MAX_SPONSORED) return { error: `${MAX_SPONSORED} jobs are already sponsored. Wait for one to end.` };
  return { until: new Date(now.getTime() + d * DAY), note: n };
};

const checkUrgent = ({ job, days, now = new Date() }) => {
  if (!job || job.status !== 'active') return { error: 'Only a live job can be marked urgent' };
  const d = wholeDays(days, MAX_URGENT_DAYS); if (!d) return { error: `Choose 1 to ${MAX_URGENT_DAYS} days` };
  return { until: new Date(now.getTime() + d * DAY) };
};

module.exports = { MAX_SPONSORED, MAX_SPONSOR_DAYS, MAX_URGENT_DAYS, promoState, withPromotion, checkSponsor, checkUrgent };
