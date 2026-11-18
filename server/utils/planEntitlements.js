// Changing ONE person's plan benefits (counts, switches, validity) without touching the plan itself.
//
// How it works: when someone buys a plan, the site saves their own copy of it (user.subscriptionDetails) and every limit
// check reads that copy (models/User.js: the `subscription` getter). So editing the copy changes only that person.
// The plan in Admin > Plans, and every other buyer of it, stay as they are.
//
// This file is pure (no database, no network) so the rules are easy to test.

// What an admin may edit. `zeroMeans` explains the 0 value for counts, as the code treats it today.
const FEATURE_FIELDS = [
  // job seeker
  { key: 'hasResumeBuilder', label: 'Resume builder', type: 'boolean', group: 'Job seeker' },
  { key: 'resumeBuilderCount', label: 'Resume count', type: 'number', group: 'Job seeker', zeroMeans: 'unlimited' },
  { key: 'jobAlerts', label: 'Job alerts', type: 'select', options: ['None', 'Monthly', 'Weekly', 'Daily', 'Instant'], group: 'Job seeker' },
  { key: 'hasProfileBoost', label: 'Profile boost', type: 'boolean', group: 'Job seeker' },
  { key: 'hasProfileViewInsights', label: 'Profile view insights', type: 'boolean', group: 'Job seeker' },
  { key: 'hasMessageRecruiters', label: 'Message recruiters', type: 'boolean', group: 'Job seeker' },
  { key: 'messageRecruitersCount', label: 'Recruiters they can message', type: 'number', group: 'Job seeker', zeroMeans: 'unlimited' },
  { key: 'hasCareerCounselling', label: 'Career counselling', type: 'boolean', group: 'Job seeker' },
  { key: 'careerCounsellingCount', label: 'Counselling sessions', type: 'number', group: 'Job seeker', zeroMeans: 'unlimited' },
  { key: 'hasAiResumeReview', label: 'AI resume review', type: 'boolean', group: 'Job seeker' },
  { key: 'aiResumeReviewCount', label: 'AI resume reviews', type: 'number', group: 'Job seeker', zeroMeans: 'unlimited' },
  { key: 'hasMockInterviews', label: 'Mock interviews', type: 'boolean', group: 'Job seeker' },
  { key: 'hasJobMatchAnalysis', label: 'Job match', type: 'boolean', group: 'Job seeker' },
  { key: 'hasPriorityBadge', label: 'Priority badge', type: 'boolean', group: 'Job seeker' },
  // recruiter and company
  { key: 'activeJobPostings', label: 'Active job postings', type: 'number', group: 'Employer', zeroMeans: 'unlimited' },
  { key: 'candidateSearchPerDay', label: 'Candidate searches a day', type: 'number', group: 'Employer', zeroMeans: 'unlimited' },
  { key: 'userSeats', label: 'Team seats', type: 'number', group: 'Employer', zeroMeans: 'none' },
  { key: 'hasATSPipeline', label: 'ATS pipeline', type: 'boolean', group: 'Employer' },
  { key: 'hasAnalyticsDashboard', label: 'Analytics dashboard', type: 'boolean', group: 'Employer' },
  { key: 'hasCandidateDBExport', label: 'Candidate export', type: 'boolean', group: 'Employer' },
  { key: 'hasBulkMessaging', label: 'Bulk messaging', type: 'boolean', group: 'Employer' },
  { key: 'hasVideoInterview', label: 'Video interviews', type: 'boolean', group: 'Employer' },
  { key: 'hasPriorityListing', label: 'Priority listing', type: 'boolean', group: 'Employer' },
  { key: 'hasAICandidateMatching', label: 'AI candidate matching', type: 'boolean', group: 'Employer' },
  { key: 'hasInterviewScheduling', label: 'Interview scheduling', type: 'boolean', group: 'Employer' },
  { key: 'hasDedicatedOnboarding', label: 'Dedicated onboarding', type: 'boolean', group: 'Employer' },
];

// Counters that go up as the person uses the plan. Resetting one gives them a fresh allowance.
const USAGE_FIELDS = [
  { key: 'downloadsUsed', label: 'Downloads used' },
  { key: 'candidateDBExportsUsed', label: 'Candidate exports used' },
  { key: 'searchUsed', label: 'Searches used' },
  { key: 'jobsUsed', label: 'Job posts used' },
  { key: 'messagesUsed', label: 'Messages sent to recruiters' },
  { key: 'counsellingSessionsUsed', label: 'Counselling sessions used' },
  { key: 'mockInterviewsUsed', label: 'Mock interviews used' },
  { key: 'aiResumeReviewUsed', label: 'AI resume reviews used' },
];

const MAX_COUNT = 100000;
const MAX_EXTEND_DAYS = 3650;     // 10 years
const DAY_MS = 24 * 60 * 60 * 1000;
const fieldByKey = Object.fromEntries(FEATURE_FIELDS.map((f) => [f.key, f]));
const usageKeys = USAGE_FIELDS.map((u) => u.key);

const displayValue = (field, v) => {
  if (field.type === 'boolean') return v ? 'On' : 'Off';
  if (field.type === 'number' && Number(v) === 0 && field.zeroMeans) return `0 (${field.zeroMeans})`;
  return v === undefined || v === null || v === '' ? 'not set' : String(v);
};

/** The editable values of a person's plan copy, in the order the screen shows them. */
const readFields = (details) => FEATURE_FIELDS.map((f) => ({
  key: f.key, label: f.label, type: f.type, group: f.group, options: f.options, zeroMeans: f.zeroMeans,
  value: details ? (details[f.key] ?? (f.type === 'boolean' ? false : f.type === 'number' ? 0 : '')) : null,
}));

/**
 * Checks the requested changes and works out what would change.
 * @param {object} details   the person's current plan copy
 * @param {object} requested { fieldKey: newValue }
 * @returns {{ errors: string[], next: object, diff: Array<{key,label,before,after,beforeText,afterText}> }}
 */
const buildChanges = (details, requested = {}) => {
  const errors = [];
  const next = { ...(details || {}) };
  const diff = [];
  for (const [key, raw] of Object.entries(requested || {})) {
    const f = fieldByKey[key];
    if (!f) { errors.push(`"${key}" is not a setting that can be changed here.`); continue; }
    let value = raw;
    if (f.type === 'number') {
      value = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
      if (!Number.isInteger(value) || value < 0 || value > MAX_COUNT) { errors.push(`${f.label} must be a whole number from 0 to ${MAX_COUNT}.`); continue; }
    } else if (f.type === 'boolean') {
      if (typeof raw !== 'boolean') { errors.push(`${f.label} must be On or Off.`); continue; }
    } else if (f.type === 'select') {
      if (!f.options.includes(raw)) { errors.push(`${f.label} must be one of: ${f.options.join(', ')}.`); continue; }
    }
    const before = details ? details[f.key] : undefined;
    if (before === value) continue; // nothing to change
    next[key] = value;
    diff.push({ key, label: f.label, before, after: value, beforeText: displayValue(f, before ?? (f.type === 'boolean' ? false : 0)), afterText: displayValue(f, value) });
  }
  return { errors, next, diff };
};

/**
 * The new end date. Give either a date (`expiry`) or a number of days to add (`extendDays`), not both.
 * Extending starts from the later of today and the current end date, so an expired plan is extended from today.
 * @returns {{ error?: string, expiry?: Date, changed: boolean }}
 */
const computeExpiry = ({ currentExpiry, expiry, extendDays, now = Date.now() }) => {
  const hasDate = expiry !== undefined && expiry !== null && expiry !== '';
  const hasDays = extendDays !== undefined && extendDays !== null && extendDays !== '';
  if (hasDate && hasDays) return { error: 'Give either a new end date or a number of days to add, not both.', changed: false };
  if (!hasDate && !hasDays) return { changed: false };
  let next;
  if (hasDays) {
    const days = Number(extendDays);
    if (!Number.isInteger(days) || days < 1 || days > MAX_EXTEND_DAYS) return { error: `Days to add must be a whole number from 1 to ${MAX_EXTEND_DAYS}.`, changed: false };
    const base = Math.max(now, currentExpiry ? new Date(currentExpiry).getTime() : 0);
    next = new Date(base + days * DAY_MS);
  } else {
    next = new Date(expiry);
    if (Number.isNaN(next.getTime())) return { error: 'The end date is not a valid date.', changed: false };
    next = new Date(next.getFullYear(), next.getMonth(), next.getDate(), 23, 59, 59); // the whole of that day
    if (next.getTime() <= now) return { error: 'The end date must be in the future. To end a plan, use Cancel plan.', changed: false };
    if (next.getTime() > now + MAX_EXTEND_DAYS * DAY_MS) return { error: 'The end date is too far away (10 years at most).', changed: false };
  }
  const same = currentExpiry && Math.abs(new Date(currentExpiry).getTime() - next.getTime()) < 1000;
  return { expiry: next, changed: !same };
};

/** Usage counters to set back to 0. Only known counters are accepted. */
const checkUsageReset = (keys) => {
  if (keys === undefined || keys === null) return { keys: [] };
  if (!Array.isArray(keys)) return { error: 'resetUsage must be a list.', keys: [] };
  const bad = keys.find((k) => !usageKeys.includes(k));
  if (bad) return { error: `"${bad}" is not a usage counter that can be reset.`, keys: [] };
  return { keys: [...new Set(keys)] };
};

module.exports = { FEATURE_FIELDS, USAGE_FIELDS, readFields, buildChanges, computeExpiry, checkUsageReset, displayValue, MAX_COUNT, MAX_EXTEND_DAYS };
