// Popular searches for the home page, built from the live job list so a chip never leads to an empty result.
// Pure function: no network, safe to unit test.

const MAX_LEN = 28;

// "Telecaller - Puducherry" and "Telecaller (Night Shift)" both become "Telecaller", which matches a keyword search.
export const cleanTitle = (raw) => {
  const base = String(raw || '').split(/\s[-–|]\s|[(|,]/)[0].replace(/\s+/g, ' ').trim();
  if (base.length < 3 || base.length > MAX_LEN) return '';
  return base;
};

const isOpen = (job, now) => {
  if (!job || (job.status && job.status !== 'active')) return false;
  if (job.validThrough && new Date(job.validThrough) < now) return false;
  return true;
};

// Most common titles first; ties go to the title with the newest job. Returns at most `limit` terms.
export const popularTerms = (jobs, { limit = 10, now = new Date() } = {}) => {
  if (!Array.isArray(jobs)) return [];
  const byKey = new Map();
  jobs.forEach((job) => {
    if (!isOpen(job, now)) return;
    const label = cleanTitle(job.title);
    if (!label) return;
    const key = label.toLowerCase();
    const at = new Date(job.createdAt || 0).getTime() || 0;
    const row = byKey.get(key) || { label, count: 0, latest: 0 };
    row.count += 1;
    row.latest = Math.max(row.latest, at);
    byKey.set(key, row);
  });
  return [...byKey.values()]
    .sort((a, b) => b.count - a.count || b.latest - a.latest)
    .slice(0, limit)
    .map((r) => r.label);
};

// Below this many terms the whole "Trending searches" block is hidden instead of shown half empty.
export const MIN_POPULAR_TERMS = 3;
