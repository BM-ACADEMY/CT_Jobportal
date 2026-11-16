// Rules that decide who is a lead for BM Academy (job seekers) or CoreTalents (employers).
// Pure functions: every lead gets a plain reason so the team knows what to offer.
const STATUSES = ['new', 'called', 'interested', 'not_interested'];
const cleanLeadStatus = (v) => (STATUSES.includes(v) ? v : null);

// stats: { applications, shortlisted, failedTests }
const academyReason = (s = {}) => {
  const reasons = [];
  if ((s.applications || 0) >= 5 && !(s.shortlisted || 0)) reasons.push(`Applied to ${s.applications} jobs, never shortlisted`);
  if ((s.failedTests || 0) >= 1) reasons.push(`Scored low in ${s.failedTests} skill test${s.failedTests > 1 ? 's' : ''}`);
  return reasons.length ? reasons.join('; ') : null;
};

// stats: { jobs, staleJobs, vacancies }   staleJobs = open 21+ days with fewer than 3 applicants
const coreReason = (s = {}) => {
  const reasons = [];
  if ((s.jobs || 0) >= 3) reasons.push(`Posted ${s.jobs} jobs`);
  if ((s.staleJobs || 0) >= 1) reasons.push(`${s.staleJobs} job${s.staleJobs > 1 ? 's' : ''} open 3+ weeks with few applicants`);
  if ((s.vacancies || 0) >= 10) reasons.push(`${s.vacancies} vacancies open`);
  return reasons.length ? reasons.join('; ') : null;
};

const csvCell = (v) => { let t = String(v == null ? '' : v); if (/^[=+\-@]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
const toCsv = (rows) => ['Name,Email,Phone,City,Reason,Status,Note', ...rows.map((r) => [r.name, r.email, r.phone, r.city, r.reason, r.status, r.note].map(csvCell).join(','))].join('\n');

module.exports = { STATUSES, cleanLeadStatus, academyReason, coreReason, toCsv };
