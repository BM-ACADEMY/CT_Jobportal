// Internships: details, and the free-posting rule. Pure functions, easy to test.
// A verified company can have up to FREE_LIVE_INTERNSHIPS live internships that do not use its paid job slots.
// Anyone else posts internships like any other job, under their plan.
const FREE_LIVE_INTERNSHIPS = 3;
const MODES = ['onsite', 'remote', 'hybrid'];
const str = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

// Returns { error } or { data } from what the posting form sends. Stipend must be stated: paid with an amount, or plainly unpaid.
const cleanInternship = (raw) => {
  if (!raw || typeof raw !== 'object') return { error: 'Please fill in the internship details' };
  const durationMonths = Number(raw.durationMonths);
  if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 12) return { error: 'Choose a duration from 1 to 12 months' };
  const stipendType = raw.stipendType === 'paid' ? 'paid' : raw.stipendType === 'unpaid' ? 'unpaid' : '';
  if (!stipendType) return { error: 'Say whether the internship is paid or unpaid' };
  let stipendAmount = 0;
  if (stipendType === 'paid') {
    stipendAmount = Math.floor(Number(raw.stipendAmount));
    if (!Number.isFinite(stipendAmount) || stipendAmount < 1 || stipendAmount > 200000) return { error: 'Enter the monthly stipend in rupees' };
  }
  const mode = MODES.includes(raw.mode) ? raw.mode : '';
  if (!mode) return { error: 'Choose on-site, remote or hybrid' };
  return { data: { durationMonths, stipendType, stipendAmount, mode, certificate: raw.certificate === true, ppo: raw.ppo === true } };
};

// liveFree = this company's live internships that are already free. Free only for verified companies.
const freeInternshipSlot = ({ isInternship, companyVerified, liveFree }) => !!isInternship && !!companyVerified && liveFree < FREE_LIVE_INTERNSHIPS;

// Counts for the college dashboard. Statuses as used by applications; 'accepted' = selected.
const summariseInternshipApps = (rows) => {
  const by = (s) => rows.filter((r) => r.status === s).length;
  return {
    applications: rows.length,
    students: new Set(rows.map((r) => String(r.student))).size,
    shortlisted: by('shortlisted'), selected: by('accepted'), rejected: by('rejected'),
  };
};

module.exports = { summariseInternshipApps, FREE_LIVE_INTERNSHIPS, MODES, cleanInternship, freeInternshipSlot };
