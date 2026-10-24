// One relevance engine for jobs shown to a job seeker (website feed, "matching jobs", job emails, WhatsApp alerts).
// Pure functions: no database, no clock except the `now` you pass, so the same person sees the same order everywhere.
//
// Score is 0 to 100 and every result carries a "why" list. Weights (base 95 + priority bonus 5):
//   skills overlap 35 | job title / preferred role 25 | location and work mode 15 | experience and education 10 | freshness 10
//   priority listing: at most +5, only on a job that already matches, and always shown as a "Priority" label.
//
// Fairness: the score reads ONLY skills, titles, location, work mode, experience years, qualification, job age and
// the priority flag. It never reads name, gender, age, religion, caste, photo, marital status or any other personal
// field (see the test that changes those and checks the score does not move).
const { canonicalSkill, canonicalSet } = require('./skillAliases');

const WEIGHTS = { skills: 35, title: 25, location: 15, experience: 10, freshness: 10, priorityBonus: 5 };
const FRESH_DAYS = 30;
const PRIORITY_MIN_BASE = 20; // a priority job that matches nothing must not rise
const THIN_PROFILE_BELOW = 40; // profile completion percent
const DAY = 86400000;

const norm = (v) => String(v || '').toLowerCase().trim();
const STOP = new Set(['and', 'the', 'for', 'with', 'job', 'jobs', 'opening', 'vacancy', 'required', 'needed', 'hiring', 'urgent', 'immediate', 'in', 'at', 'of', 'a', 'an']);
const words = (v) => norm(v).split(/[^a-z0-9+#.]+/).filter((w) => w.length > 2 && !STOP.has(w));

// "2 years", "1.5 yrs", "6 months" -> years. Unparseable text counts as 0 (never guess a long career).
const yearsFromDuration = (text) => {
  const t = norm(text);
  const num = parseFloat((t.match(/(\d+(\.\d+)?)/) || [])[1]);
  if (!Number.isFinite(num)) return 0;
  if (/month|mo\b/.test(t)) return num / 12;
  return num;
};
const experienceYears = (profile) => (profile?.experience || []).reduce((sum, e) => sum + yearsFromDuration(e?.duration), 0);

const userSignals = (user) => {
  const profile = user?.profile || {};
  const prefs = profile.jobPreferences || {};
  const titles = [...(prefs.jobTitles || []), profile.preferredRole, profile.headline].filter(Boolean);
  const cities = [profile.location, ...(prefs.onSiteLocations || []).map((l) => l?.city)].map(norm).filter(Boolean);
  return {
    skills: canonicalSet(profile.skills),
    titleWords: new Set(titles.flatMap(words)),
    cities,
    modes: new Set((prefs.locationTypes || []).map(norm)),
    years: experienceYears(profile),
    hasQualification: (profile.qualification || []).length > 0,
    completion: Number(profile.profileCompletion) || 0,
  };
};

const isThinProfile = (user) => {
  const s = userSignals(user);
  return s.completion < THIN_PROFILE_BELOW && s.skills.size === 0 && s.titleWords.size === 0;
};

const cityMatches = (jobLocation, cities) => {
  const loc = norm(jobLocation);
  return Boolean(loc) && cities.some((c) => loc.includes(c) || c.includes(loc));
};

const isRemote = (job) => norm(job.workMode) === 'remote';

// Why a job is not shown at all (never score these).
const isExcluded = (job, user, { appliedJobIds = [], now = new Date() } = {}) => {
  if (!job || (job.status && job.status !== 'active')) return true;
  if (job.validThrough && new Date(job.validThrough) <= now) return true;
  if (appliedJobIds.some((id) => String(id) === String(job._id))) return true;
  const blocked = (user?.blockedEntities || []).map(String);
  if (blocked.length) {
    const owners = [job.company?._id || job.company, job.recruiter?._id || job.recruiter].filter(Boolean).map(String);
    if (owners.some((o) => blocked.includes(o))) return true;
  }
  return false;
};

/**
 * Scores one job for one job seeker.
 * @returns {{score:number, base:number, reasons:string[], matchedSkills:string[], priority:boolean, parts:object}}
 */
const scoreJobForSeeker = (user, job, { now = new Date() } = {}) => {
  const sig = userSignals(user);
  const reasons = [];
  const parts = { skills: 0, title: 0, location: 0, experience: 0, freshness: 0 };
  let possible = WEIGHTS.freshness + WEIGHTS.experience; // always applicable

  // skills (35): share of the job's required skills that the person has
  const jobSkillsRaw = (job.skillsRequired || []).filter(Boolean);
  const jobSkills = [...new Set(jobSkillsRaw.map(canonicalSkill).filter(Boolean))];
  const matchedSkills = jobSkills.filter((s) => sig.skills.has(s));
  if (jobSkills.length && sig.skills.size) {
    possible += WEIGHTS.skills;
    parts.skills = WEIGHTS.skills * (matchedSkills.length / jobSkills.length);
    if (matchedSkills.length) {
      const shown = jobSkillsRaw.filter((raw) => sig.skills.has(canonicalSkill(raw))).slice(0, 4);
      reasons.push(`Matches ${shown.join(', ')}`);
    }
  }

  // title / preferred role (25): share of the job title's words found in the person's roles
  const titleWordsOfJob = [...new Set(words(job.title))];
  if (titleWordsOfJob.length && sig.titleWords.size) {
    possible += WEIGHTS.title;
    const hit = titleWordsOfJob.filter((w) => sig.titleWords.has(w));
    parts.title = WEIGHTS.title * (hit.length / titleWordsOfJob.length);
    if (hit.length) reasons.push('Fits your preferred role');
  }

  // location and work mode (15): city 10, work mode 5; a remote job fits anywhere if the person accepts remote
  if (sig.cities.length || sig.modes.size) {
    possible += WEIGHTS.location;
    const remoteOk = isRemote(job) && sig.modes.has('remote');
    const cityOk = remoteOk || cityMatches(job.location, sig.cities);
    // A matching work mode alone means nothing in the wrong city, so it only counts together with the city.
    const modeFits = remoteOk || sig.modes.size === 0 || sig.modes.has(norm(job.workMode));
    if (cityOk) parts.location += 10;
    if (cityOk && modeFits) parts.location += 5;
    if (remoteOk) reasons.push('Remote, as you prefer');
    else if (cityOk) reasons.push(`In ${job.location}`);
  }

  // experience and education (10): freshers are never hidden from entry-level jobs
  const minExp = Number(job.experience?.min) || 0;
  const maxExp = Number(job.experience?.max) || 0;
  if (minExp <= sig.years && (!maxExp || sig.years <= maxExp + 1)) parts.experience += 7;
  else if (sig.years >= minExp - 1) parts.experience += 3.5;
  if (minExp === 0 && sig.years < 1) reasons.push('Open to freshers');
  if (sig.hasQualification) parts.experience += 3;

  // freshness (10): linear over 30 days
  const ageDays = Math.max(0, (now.getTime() - new Date(job.createdAt || now).getTime()) / DAY);
  parts.freshness = WEIGHTS.freshness * Math.max(0, 1 - ageDays / FRESH_DAYS);
  if (ageDays <= 3) reasons.push('Posted recently');

  const earned = Object.values(parts).reduce((a, b) => a + b, 0);
  // Freshness and experience are context, not relevance: with no skill, title or location evidence a job stays low.
  const content = parts.skills + parts.title + parts.location;
  const raw = Math.round((earned / possible) * 100);
  const base = content === 0 ? Math.min(raw, 12) : raw;

  // priority listing: a small, labelled bonus that can only help a job that already fits
  const priority = Boolean(job.isPriority);
  const bonus = priority && base >= PRIORITY_MIN_BASE ? WEIGHTS.priorityBonus : 0;
  const score = Math.min(100, base + bonus);

  return { score, base, reasons, matchedSkills, priority, parts };
};

/**
 * Ranks jobs for a job seeker.
 * @param {object} user  User document or plain object
 * @param {object[]} jobs
 * @param {{limit?:number, minScore?:number, appliedJobIds?:any[], now?:Date}} opts
 * @returns {{job:object, score:number, reasons:string[], priority:boolean}[]}
 */
const rankJobsForSeeker = (user, jobs, { limit = 20, minScore = 0, appliedJobIds = [], now = new Date() } = {}) => {
  const open = (jobs || []).filter((j) => !isExcluded(j, user, { appliedJobIds, now }));
  const age = (j) => new Date(j.createdAt || 0).getTime();

  // Thin profile: nothing to match on, so show jobs near the person, newest first, and let the checklist fill the profile.
  if (isThinProfile(user)) {
    const cities = userSignals(user).cities;
    return open
      .map((job) => ({ job, near: cityMatches(job.location, cities) }))
      .sort((a, b) => Number(b.near) - Number(a.near) || age(b.job) - age(a.job))
      .slice(0, limit)
      .map(({ job, near }) => ({ job, score: 0, reasons: near ? [`In ${job.location}`] : [], priority: Boolean(job.isPriority), thin: true }));
  }

  return open
    .map((job) => ({ job, ...scoreJobForSeeker(user, job, { now }) }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score || age(b.job) - age(a.job))
    .slice(0, limit)
    .map(({ job, score, reasons, priority }) => ({ job, score, reasons, priority }));
};

module.exports = { WEIGHTS, scoreJobForSeeker, rankJobsForSeeker, isExcluded, isThinProfile, experienceYears, userSignals };
