// Walk-in tag on an ordinary job (job.walkIn = { enabled, date, venue }). Optional: jobs without it show nothing.
// A walk-in whose date has passed is no longer shown as a walk-in.
export const walkInActive = (job, now = new Date()) => {
  const w = job?.walkIn;
  if (!w || w.enabled !== true || !w.date) return false;
  const d = new Date(w.date);
  if (Number.isNaN(d.getTime())) return false;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d >= startOfToday;
};

export const walkInLabel = (job) => {
  if (!walkInActive(job)) return '';
  const d = new Date(job.walkIn.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `Walk-in ${d}`;
};
