// Cleans the fields that say who can apply and how a job is worked. Pure functions, easy to test.
// Same keys as client/src/data/jobFacets.js. Anything unknown becomes empty, never an error.
const EDUCATION_KEYS = ['any', '10th', '12th', 'iti-diploma', 'graduate', 'postgraduate'];
const PAY_UNITS = ['year', 'month', 'day', 'hour'];
const SCHEDULES = ['flexible', 'mornings', 'evenings', 'weekdays', 'weekends'];

const cleanEducation = (raw) => { const k = String(raw ?? '').trim().toLowerCase(); return EDUCATION_KEYS.includes(k) ? k : ''; };
const cleanPayUnit = (raw) => { const k = String(raw ?? '').trim().toLowerCase(); return PAY_UNITS.includes(k) ? k : 'year'; };
const intIn = (raw, lo, hi) => { const n = Number(raw); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };
const cleanContractMonths = (raw) => intIn(raw, 1, 36);
const cleanPartTime = (raw) => {
  if (!raw || typeof raw !== 'object') return { hoursPerDay: null, schedule: '' };
  const schedule = String(raw.schedule ?? '').toLowerCase();
  return { hoursPerDay: intIn(raw.hoursPerDay, 1, 8), schedule: SCHEDULES.includes(schedule) ? schedule : '' };
};

// Only the fields that apply to this job type are kept, so a Full-time job never carries a contract length.
const cleanFacets = (body = {}) => {
  const out = { education: cleanEducation(body.education), freshersWelcome: body.freshersWelcome === true };
  out.contractMonths = body.jobType === 'Contract' ? cleanContractMonths(body.contractMonths) : null;
  out.partTime = body.jobType === 'Part-time' ? cleanPartTime(body.partTime) : { hoursPerDay: null, schedule: '' };
  return out;
};

// salary.unit for a salary object from the form: year for anything unknown (old jobs have no unit).
const cleanSalary = (salary) => {
  if (!salary || typeof salary !== 'object') return salary;
  return { ...salary, unit: cleanPayUnit(salary.unit) };
};

module.exports = { EDUCATION_KEYS, PAY_UNITS, SCHEDULES, cleanEducation, cleanPayUnit, cleanContractMonths, cleanPartTime, cleanFacets, cleanSalary };
