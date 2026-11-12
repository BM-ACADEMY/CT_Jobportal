// Government jobs (step 1). Only the Super Admin or staff holding the `government_jobs` permission post them
// (routes/adminRoutes.js, middlewares/staffPermission.js); companies cannot. Candidates read the official notification
// at notificationUrl, and the listing hides itself after lastDate. Pure functions so the rules are easy to test.
const DAY = 86400000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const MAX_DAYS_AHEAD = 366;

const clip = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

// "2026-12-31" (or a full ISO date) -> the last moment of that day in India (23:59:59.999 IST). null when not a real date.
const endOfDayIST = (raw) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw ?? '').trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utcMidnight = Date.UTC(y, mo - 1, d);
  const check = new Date(utcMidnight);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return new Date(utcMidnight + DAY - 1 - IST_OFFSET_MS);
};

// Only an https link, no login details inside it. Returns the cleaned URL or ''.
const cleanNotificationUrl = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s || s.length > 500) return '';
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:' || u.username || u.password) return '';
    return u.toString();
  } catch { return ''; }
};

// body: { title, department, description, lastDate, notificationUrl, location?, vacancies?, jobType? } -> { data } or { error }
const cleanGovernmentJob = (body = {}, now = new Date()) => {
  const title = clip(body.title, 150);
  const department = clip(body.department, 150);
  const description = String(body.description ?? '').trim().slice(0, 5000);
  if (title.length < 3) return { error: 'Post title is required.' };
  if (department.length < 2) return { error: 'Department or recruiting body is required.' };
  if (description.length < 30) return { error: 'Write a short summary in your own words (at least 30 characters).' };
  const lastDate = endOfDayIST(body.lastDate);
  if (!lastDate) return { error: 'Last date is required (YYYY-MM-DD).' };
  if (lastDate.getTime() < now.getTime()) return { error: 'The last date has already passed.' };
  if (lastDate.getTime() > now.getTime() + MAX_DAYS_AHEAD * DAY) return { error: 'The last date is more than a year away. Please check it.' };
  const notificationUrl = cleanNotificationUrl(body.notificationUrl);
  if (!notificationUrl) return { error: 'Official notification link is required (an https link to the department site).' };
  const vacancies = Number(body.vacancies);
  return {
    data: {
      title, department, description, lastDate, notificationUrl,
      location: clip(body.location, 120) || 'India',
      vacancies: Number.isInteger(vacancies) && vacancies > 0 && vacancies < 1000000 ? vacancies : 1,
      jobType: clip(body.jobType, 40) || 'Full-time',
    },
  };
};

// Mongo filter for the public list: live, government, not hidden, and the last date has not passed.
const openGovernmentFilter = (now = new Date()) => ({
  isGovernment: true,
  status: 'active',
  hiddenFromPublic: { $ne: true },
  lastDate: { $gte: now },
});

// Same rule for one job already loaded.
const isGovernmentOpen = (job, now = new Date()) =>
  !!job && job.isGovernment === true && job.status === 'active' && !job.hiddenFromPublic && !!job.lastDate && new Date(job.lastDate).getTime() >= now.getTime();

const publicShape = (j) => ({
  _id: j._id, title: j.title, department: j.department || '', location: j.location || '', vacancies: j.vacancies || 1,
  lastDate: j.lastDate, notificationUrl: j.notificationUrl || '', summary: String(j.description || '').slice(0, 400), createdAt: j.createdAt,
});

module.exports = { endOfDayIST, cleanNotificationUrl, cleanGovernmentJob, openGovernmentFilter, isGovernmentOpen, publicShape };
