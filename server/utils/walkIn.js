// Walk-in tag on an ordinary job: a date and a venue. Optional; jobs without it are unaffected.
// Pure function. Returns { data } (what to save) or { error } (what to tell the recruiter).
const DAY = 86400000;
const str = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

const cleanWalkIn = (raw, now = new Date()) => {
  if (!raw || typeof raw !== 'object' || raw.enabled !== true) return { data: { enabled: false } };
  const date = new Date(raw.date);
  if (!raw.date || Number.isNaN(date.getTime())) return { error: 'Choose the walk-in date' };
  if (date.getTime() < now.getTime() - DAY) return { error: 'The walk-in date cannot be in the past' };
  const venue = str(raw.venue, 200);
  if (venue.length < 3) return { error: 'Enter the walk-in venue' };
  return { data: { enabled: true, date, venue } };
};

module.exports = { cleanWalkIn };
