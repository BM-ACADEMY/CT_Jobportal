// "Usually responds in ..." on a public company profile.
// Median hours from an application being received to the company's first status change, over the last 90 days.
// Only applications that have a recorded first response count (firstResponseAt, set by applicationController),
// so nothing is guessed for older applications. Shown only when at least MIN_SAMPLE applications qualify.
const HOUR = 3600000;
const WINDOW_DAYS = 90;
const MIN_SAMPLE = 5;

// apps = [{ createdAt, firstResponseAt }]. Returns { medianHours, sample } or null when there is not enough real data.
const computeResponseTime = (apps, now = new Date()) => {
  const since = now.getTime() - WINDOW_DAYS * 24 * HOUR;
  const hours = [];
  for (const a of apps || []) {
    if (!a?.createdAt || !a?.firstResponseAt) continue;
    const received = new Date(a.createdAt).getTime();
    const responded = new Date(a.firstResponseAt).getTime();
    if (!Number.isFinite(received) || !Number.isFinite(responded)) continue;
    if (received < since || received > now.getTime()) continue; // last 90 days only
    const h = (responded - received) / HOUR;
    if (h < 0) continue; // never a negative number
    hours.push(h);
  }
  if (hours.length < MIN_SAMPLE) return null;
  hours.sort((x, y) => x - y);
  const mid = Math.floor(hours.length / 2);
  const median = hours.length % 2 ? hours[mid] : (hours[mid - 1] + hours[mid]) / 2;
  return { medianHours: Math.round(median * 10) / 10, sample: hours.length };
};

// Plain words. Rounds up so the claim is never faster than the data.
const formatResponseTime = (medianHours) => {
  if (!Number.isFinite(medianHours) || medianHours < 0) return '';
  if (medianHours <= 1) return 'within an hour';
  if (medianHours < 24) return `${Math.ceil(medianHours)} hours`;
  const days = Math.ceil(medianHours / 24);
  return days === 1 ? '1 day' : `${days} days`;
};

// Used by the public company route. Models are required lazily. Returns { label, medianHours, sample } or null.
const getCompanyResponseTime = async (companyId, now = new Date()) => {
  const Job = require('../models/Job');
  const Application = require('../models/Application');
  const since = new Date(now.getTime() - WINDOW_DAYS * 24 * HOUR);
  const jobIds = await Job.find({ company: companyId }).select('_id').lean();
  if (!jobIds.length) return null;
  const apps = await Application.find({
    job: { $in: jobIds.map((j) => j._id) },
    createdAt: { $gte: since },
    firstResponseAt: { $ne: null },
  }).select('createdAt firstResponseAt').limit(5000).lean();
  const r = computeResponseTime(apps, now);
  if (!r) return null;
  const label = formatResponseTime(r.medianHours);
  return label ? { ...r, label } : null;
};

module.exports = { computeResponseTime, formatResponseTime, getCompanyResponseTime, MIN_SAMPLE, WINDOW_DAYS };
