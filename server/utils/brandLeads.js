// Rules that decide who is a lead for BM Academy (job seekers) or CoreTalents (employers).
// Pure functions: every lead gets a plain reason so the team knows what to offer.
const STATUSES = ['new', 'called', 'interested', 'not_interested'];
const cleanLeadStatus = (v) => (STATUSES.includes(v) ? v : null);

const PROGRAM_WORDS = /digital marketing|\bseo\b|social media|data analy|power ?bi|\banalytics?\b|\bexcel\b/i;

// Final year: still studying, and the course ends this year or next.
const isFinalYear = (qualification = [], now = new Date()) => (qualification || []).some((q) => {
  if (!q || !q.currentlyPursuing) return false;
  const end = parseInt(q.endYear || q.year, 10);
  return Number.isFinite(end) && end >= now.getFullYear() && end <= now.getFullYear() + 1;
});

// Does the profile show interest in what BM Academy teaches (AI digital marketing, data analytics with Power BI)?
const wantsAcademyProgram = (p = {}) => PROGRAM_WORDS.test([p.headline, p.preferredRole, ...(p.skills || []), ...(p.interestedDomain || [])].filter(Boolean).join(' | '));

// stats: { applications, shortlisted, failedTests, daysSinceSignup, finalYear, programInterest }
// Returns { reason, score } or null. A higher score means call this person first.
const academyLead = (s = {}) => {
  const reasons = []; let score = 0;
  if (s.programInterest) { reasons.push('Interested in digital marketing or data analytics'); score += 3; }
  if ((s.applications || 0) >= 5 && !(s.shortlisted || 0)) { reasons.push(`Applied to ${s.applications} jobs, never shortlisted`); score += 3; }
  if ((s.failedTests || 0) >= 1) { reasons.push(`Scored low in ${s.failedTests} skill test${s.failedTests > 1 ? 's' : ''}`); score += 2 + Math.min(s.failedTests - 1, 2); }
  if (s.finalYear) { reasons.push('Final-year student'); score += 2; }
  if (!(s.applications || 0) && (s.daysSinceSignup || 0) >= 3) { reasons.push(`Signed up ${s.daysSinceSignup} days ago, no application yet`); score += 1; }
  return reasons.length ? { reason: reasons.join('; '), score } : null;
};
const academyReason = (s = {}) => { const l = academyLead(s); return l ? l.reason : null; };

// stats: { jobs, staleJobs, vacancies }   staleJobs = open 21+ days with fewer than 3 applicants
const coreLead = (s = {}) => {
  const reasons = []; let score = 0;
  if ((s.jobs || 0) >= 3) { reasons.push(`Posted ${s.jobs} jobs`); score += 1; }
  if ((s.staleJobs || 0) >= 1) { reasons.push(`${s.staleJobs} job${s.staleJobs > 1 ? 's' : ''} open 3+ weeks with few applicants`); score += 3 + Math.min(s.staleJobs - 1, 2); }
  if ((s.vacancies || 0) >= 10) { reasons.push(`${s.vacancies} vacancies open`); score += 2; }
  return reasons.length ? { reason: reasons.join('; '), score } : null;
};
const coreReason = (s = {}) => { const l = coreLead(s); return l ? l.reason : null; };

// A follow-up date from the page: "2026-11-20", or empty to clear it. Anything else is refused (undefined).
const cleanFollowUp = (v) => {
  if (v === null || v === '') return null;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  const d = new Date(`${v}T00:00:00+05:30`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const csvCell = (v) => { let t = String(v == null ? '' : v); if (/^[=+\-@]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const toCsv = (rows) => ['Name,Email,Phone,City,Reason,Status,Note,Priority,Follow-up,Last contacted', ...rows.map((r) => [r.name, r.email, r.phone, r.city, r.reason, r.status, r.note, r.score ?? '', day(r.followUpAt), day(r.lastContactedAt)].map(csvCell).join(','))].join('\n');

module.exports = { STATUSES, cleanLeadStatus, academyReason, academyLead, coreReason, coreLead, isFinalYear, wantsAcademyProgram, cleanFollowUp, toCsv };
