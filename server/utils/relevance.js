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

// ---------------------------------------------------------------------------------------------------------------
// Recruiter side: how well a candidate fits one job.
//   skills overlap 40 | role and experience 20 | location 15 | qualification 10 | profile completeness 10 |
//   verified skill-test certificate 5 | paid "priority" badge: at most +5, only for a candidate who already fits,
//   always shown as a label. Same fairness rule: no name, gender, age, religion, caste, photo or marital status.
const CANDIDATE_WEIGHTS = { skills: 40, role: 20, location: 15, qualification: 10, completeness: 10, certificate: 5, priorityBonus: 5 };

// The stored profile completion includes 5 points for having a photo. A photo must never lift a score, so those
// points are taken back out and the rest is rescaled to 0-100.
const candidateCompleteness = (candidate) => {
  const stored = Number(candidate?.profile?.profileCompletion) || 0;
  const withoutPhoto = Math.max(0, stored - (candidate?.avatar ? 5 : 0));
  return Math.min(100, (withoutPhoto / 95) * 100);
};

const candidateRoleWords = (profile = {}) => new Set([profile.preferredRole, profile.headline, ...(profile.experience || []).map((e) => e?.role)].filter(Boolean).flatMap(words));

/**
 * @param {object} candidate  job seeker (plain object): profile.skills, preferredRole, headline, experience, qualification,
 *                            location, profileCompletion, avatar (only used to remove the photo from completeness), isPriority
 * @param {object} job        the job being filled
 * @param {{hasCertificate?:boolean}} opts
 */
const scoreCandidateForJob = (candidate, job, { hasCertificate = false } = {}) => {
  const profile = candidate?.profile || {};
  const reasons = [];
  const parts = { skills: 0, role: 0, experience: 0, location: 0, qualification: 0, completeness: 0, certificate: 0 };
  let possible = CANDIDATE_WEIGHTS.qualification + CANDIDATE_WEIGHTS.completeness + CANDIDATE_WEIGHTS.certificate;

  // skills (40)
  const jobSkillsRaw = (job.skillsRequired || []).filter(Boolean);
  const jobSkills = [...new Set(jobSkillsRaw.map(canonicalSkill).filter(Boolean))];
  const have = canonicalSet(profile.skills);
  const matched = jobSkills.filter((s) => have.has(s));
  if (jobSkills.length) {
    possible += CANDIDATE_WEIGHTS.skills;
    parts.skills = CANDIDATE_WEIGHTS.skills * (matched.length / jobSkills.length);
    if (matched.length) reasons.push(`Has ${jobSkillsRaw.filter((r) => have.has(canonicalSkill(r))).slice(0, 4).join(', ')}`);
  }

  // role and experience (20): role words 12 (relevance), experience years 8 (context only, never relevance on its own)
  possible += CANDIDATE_WEIGHTS.role;
  const jobTitleWords = [...new Set(words(job.title))];
  const roleWords = candidateRoleWords(profile);
  if (jobTitleWords.length && roleWords.size) {
    const hit = jobTitleWords.filter((w) => roleWords.has(w));
    parts.role += 12 * (hit.length / jobTitleWords.length);
    if (hit.length) reasons.push('Role fits');
  }
  const years = experienceYears(profile);
  const minExp = Number(job.experience?.min) || 0;
  const maxExp = Number(job.experience?.max) || 0;
  if (minExp <= years && (!maxExp || years <= maxExp + 1)) { parts.experience += 8; if (minExp > 0) reasons.push(`${Math.round(years * 10) / 10} years experience`); }
  else if (years >= minExp - 1) parts.experience += 4;
  if (minExp === 0 && years < 1) reasons.push('Fresher, suits an entry-level job');

  // location (15): same city, or any city for a remote job
  const candidateCity = norm(profile.location);
  if (candidateCity && (job.location || isRemote(job))) {
    possible += CANDIDATE_WEIGHTS.location;
    const loc = norm(job.location);
    if (isRemote(job) || (loc && (loc.includes(candidateCity) || candidateCity.includes(loc)))) {
      parts.location = CANDIDATE_WEIGHTS.location;
      reasons.push(isRemote(job) ? 'Remote job' : `Lives in ${profile.location}`);
    }
  }

  // qualification (10), completeness (10), verified certificate (5)
  if ((profile.qualification || []).length) parts.qualification = CANDIDATE_WEIGHTS.qualification;
  parts.completeness = CANDIDATE_WEIGHTS.completeness * (candidateCompleteness(candidate) / 100);
  if (hasCertificate) { parts.certificate = CANDIDATE_WEIGHTS.certificate; reasons.push('Passed a verified skill test'); }

  const earned = Object.values(parts).reduce((a, b) => a + b, 0);
  const content = parts.skills + parts.role + parts.location;
  const raw = Math.round((earned / possible) * 100);
  const base = content === 0 ? Math.min(raw, 12) : raw;

  const priority = Boolean(candidate?.isPriority);
  const bonus = priority && base >= PRIORITY_MIN_BASE ? CANDIDATE_WEIGHTS.priorityBonus : 0;
  return { score: Math.min(100, base + bonus), base, reasons, priority, matchedSkills: matched, parts };
};

/**
 * Orders candidates for a job: best fit first, then more complete profile, then a stable id order (never by name).
 * @param {object[]} candidates
 * @param {object|null} job  the reference job; null means "no job to compare with", so only completeness decides
 * @param {{certifiedIds?:Set<string>}} opts
 */
const rankCandidatesForJob = (candidates, job, { certifiedIds = new Set() } = {}) => {
  const scored = (candidates || []).map((candidate) => {
    const hasCertificate = certifiedIds.has(String(candidate._id));
    const r = job ? scoreCandidateForJob(candidate, job, { hasCertificate }) : { score: 0, reasons: [], priority: Boolean(candidate.isPriority) };
    return { candidate, score: r.score, reasons: r.reasons, priority: r.priority, completeness: candidateCompleteness(candidate) };
  });
  return scored.sort((a, b) => b.score - a.score || b.completeness - a.completeness || String(a.candidate._id).localeCompare(String(b.candidate._id)));
};

module.exports = {
  WEIGHTS, CANDIDATE_WEIGHTS, scoreJobForSeeker, rankJobsForSeeker, isExcluded, isThinProfile, experienceYears, userSignals,
  scoreCandidateForJob, rankCandidatesForJob, candidateCompleteness,
};
