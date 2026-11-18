// Balance board: live jobs against job seekers, by field of work. Pure builder, so it can be tested.
// jobRows / seekerRows: [{ _id: <category key or ''/null>, n }]. A seeker may pick up to 3 fields, so seeker rows can add up to more than the number of people.
const { JOB_CATEGORIES } = require('../config/jobCategories');

const buildBalance = (jobRows = [], seekerRows = []) => {
  const jobs = new Map(); const seekers = new Map();
  const add = (map, rows) => rows.forEach((r) => { const k = r._id || ''; map.set(k, (map.get(k) || 0) + (Number(r.n) || 0)); });
  add(jobs, jobRows); add(seekers, seekerRows);
  const label = (k) => (k ? (JOB_CATEGORIES.find((c) => c.key === k)?.label || k) : 'Not set');
  const keys = [...new Set([...JOB_CATEGORIES.map((c) => c.key), ...jobs.keys(), ...seekers.keys()])].filter((k) => jobs.get(k) || seekers.get(k));
  const rows = keys.map((k) => {
    const j = jobs.get(k) || 0; const s = seekers.get(k) || 0;
    return { key: k, label: label(k), liveJobs: j, jobSeekers: s, seekersPerJob: j > 0 ? Math.round((s / j) * 10) / 10 : null };
  }).sort((a, b) => b.jobSeekers - a.jobSeekers || b.liveJobs - a.liveJobs || a.label.localeCompare(b.label));
  return { rows, totals: { liveJobs: rows.reduce((t, r) => t + r.liveJobs, 0), jobSeekers: rows.reduce((t, r) => t + r.jobSeekers, 0) } };
};

module.exports = { buildBalance };
