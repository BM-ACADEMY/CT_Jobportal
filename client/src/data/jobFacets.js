// Filter and display rules for who can apply, how a job pays and how it is worked.
// Pure functions with no imports, so server/tests can load this same file. The server cleans the same fields in server/utils/jobFacets.js.

export const EDUCATION_LEVELS = [
  { key: 'any', label: 'No minimum', rank: 0 },
  { key: '10th', label: '10th pass', rank: 1 },
  { key: '12th', label: '12th pass', rank: 2 },
  { key: 'iti-diploma', label: 'ITI / Diploma', rank: 3 },
  { key: 'graduate', label: 'Graduate', rank: 4 },
  { key: 'postgraduate', label: 'Post-graduate', rank: 5 },
];
export const PAY_UNITS = [
  { key: 'year', label: 'per year (LPA)' },
  { key: 'month', label: 'per month' },
  { key: 'day', label: 'per day' },
  { key: 'hour', label: 'per hour' },
];
export const PART_TIME_SCHEDULES = [
  { key: 'flexible', label: 'Flexible hours' },
  { key: 'mornings', label: 'Mornings' },
  { key: 'evenings', label: 'Evenings' },
  { key: 'weekdays', label: 'Weekdays' },
  { key: 'weekends', label: 'Weekends only' },
];
// Monthly pay bands: local jobs are quoted per month, not per year.
export const MONTHLY_PAY_RANGES = [
  { label: 'Any', min: 0, max: Infinity },
  { label: 'Under ₹10,000', min: 0, max: 10000 },
  { label: '₹10,000 – 20,000', min: 10000, max: 20000 },
  { label: '₹20,000 – 35,000', min: 20000, max: 35000 },
  { label: '₹35,000 – 60,000', min: 35000, max: 60000 },
  { label: '₹60,000 and above', min: 60000, max: Infinity },
];
export const POSTED_WITHIN = [
  { label: 'Any time', days: 0 },
  { label: 'Last 24 hours', days: 1 },
  { label: 'Last 3 days', days: 3 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
];
export const WORK_MODES = ['On-site', 'Remote', 'Hybrid'];

const WORKING_DAYS = 26;
const rankOf = (key) => EDUCATION_LEVELS.find((e) => e.key === key)?.rank;

// Pay as a monthly figure so every job can be compared. Old jobs have no unit and are yearly. 0 when no pay is stated.
export const monthlyPay = (job) => {
  const s = job?.salary;
  if (!s || s.isRangeHidden) return 0;
  const amount = Number(s.min) || Number(s.max) || 0;
  if (!amount) return 0;
  switch (s.unit) {
    case 'month': return amount;
    case 'day': return amount * WORKING_DAYS;
    case 'hour': return amount * (Number(job.partTime?.hoursPerDay) || 8) * WORKING_DAYS;
    default: return amount / 12;
  }
};

// Does a job suit a person with this education? Empty level = no filter.
// A job that never stated its education only suits graduates and above, so "no degree needed" never shows jobs that may need one.
export const educationFits = (job, level) => {
  const mine = rankOf(level);
  if (mine === undefined || !level) return true;
  const needed = rankOf(job?.education);
  if (needed === undefined) return mine >= 4;
  return needed <= mine;
};

export const postedWithinDays = (job, days, now = Date.now()) => {
  if (!days) return true;
  const t = new Date(job?.createdAt).getTime();
  return Number.isFinite(t) && now - t <= days * 86400000;
};

const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
// "₹18,000–25,000 / month", "₹600 / day", "₹3.5–6.0 LPA". Internship stipends are handled by the caller.
export const formatPay = (salary) => {
  if (typeof salary === 'string') return salary;
  if (!salary || salary.isRangeHidden) return 'Not Disclosed';
  const { min, max, unit } = salary;
  if (!min && !max) return 'Competitive';
  if (unit === 'month' || unit === 'day' || unit === 'hour') {
    const suffix = ` / ${unit}`;
    if (min && max && min !== max) return `${rupees(min)}–${Math.round(max).toLocaleString('en-IN')}${suffix}`;
    return `${rupees(min || max)}${max && !min ? '' : ''}${suffix}`;
  }
  if (min && max) return `₹${(min / 100000).toFixed(1)}–${(max / 100000).toFixed(1)} LPA`;
  return `₹${((min || max) / 100000).toFixed(1)}${min && !max ? '+' : ''} LPA`;
};

// Short facts for a card: "12th pass", "Contract · 6 months", "Part-time · 4 h/day · Evenings".
export const jobFacts = (job) => {
  const out = [];
  const edu = EDUCATION_LEVELS.find((e) => e.key === job?.education);
  if (edu && edu.key !== 'any') out.push(edu.label);
  else if (edu) out.push('Any education');
  if (job?.jobType === 'Contract' && job.contractMonths) out.push(`Contract · ${job.contractMonths} months`);
  if (job?.jobType === 'Part-time' && (job.partTime?.hoursPerDay || job.partTime?.schedule)) {
    const sch = PART_TIME_SCHEDULES.find((s) => s.key === job.partTime.schedule)?.label;
    out.push(['Part-time', job.partTime.hoursPerDay ? `${job.partTime.hoursPerDay} h/day` : '', sch || ''].filter(Boolean).join(' · '));
  }
  if (job?.freshersWelcome) out.push('Freshers welcome');
  return out;
};
