// Short, plain reasons a recommended job fits a job seeker: `matchReasons: string[]` (at most 4) on each job of
// GET /api/jobs/matched. Works on the classic matching and on the relevance engine alike.
// OFF unless MATCH_REASONS_ENABLED=true. It defaults to off because the relevance engine (RELEVANCE_ENGINE_ENABLED) is off by default.
// Reads only skills, location, field of work and experience years: never name, gender, age or other personal data.
// Pure; no database.
const { canonicalSkill, canonicalSet } = require('./skillAliases');
const { cleanInterestedCategories, JOB_CATEGORIES } = require('../config/jobCategories');
const { experienceYears } = require('./relevance');

const MAX_REASONS = 4;
const norm = (v) => String(v || '').toLowerCase().trim();
const matchReasonsEnabled = (env = process.env) => env.MATCH_REASONS_ENABLED === 'true';

const buildMatchReasons = (user, job) => {
  if (!job) return [];
  const out = [];
  const profile = user?.profile || {};
  const j = job || {};

  // 1. skills overlap
  const have = canonicalSet(profile.skills);
  const raw = (j.skillsRequired || []).filter(Boolean);
  const hit = [...new Map(raw.filter((s) => have.has(canonicalSkill(s))).map((s) => [canonicalSkill(s), s])).values()];
  if (hit.length) out.push(`Skills: ${hit.slice(0, 3).join(', ')}`);

  // 2. location (remote job when the person accepts remote, or the same city)
  const prefs = profile.jobPreferences || {};
  const cities = [profile.location, ...(prefs.onSiteLocations || []).map((l) => l?.city)].map(norm).filter(Boolean);
  const loc = norm(j.location);
  if (norm(j.workMode) === 'remote' && (prefs.locationTypes || []).map(norm).includes('remote')) out.push('Remote, as you prefer');
  else if (loc && cities.some((c) => loc.includes(c) || c.includes(loc))) out.push(`In ${j.location}`);

  // 3. field of work
  const cats = cleanInterestedCategories(profile.interestedCategories);
  if (j.category && cats.includes(j.category)) {
    const label = (JOB_CATEGORIES.find((c) => c.key === j.category) || {}).label;
    if (label) out.push(`Your field: ${label}`);
  }

  // 4. experience band
  const years = experienceYears(profile);
  const min = Number(j.experience?.min) || 0;
  const max = Number(j.experience?.max) || 0;
  if (min === 0 && years < 1) out.push('Open to freshers');
  else if (min > 0 && years >= min && (!max || years <= max + 1)) out.push('Fits your experience');

  return out.slice(0, MAX_REASONS);
};

// Adds `matchReasons` to each job (plain objects or documents) when the flag is on. Never throws: on any error the jobs come back unchanged.
const withMatchReasons = (user, jobs, env = process.env) => {
  if (!matchReasonsEnabled(env)) return jobs;
  try {
    return (jobs || []).map((job) => {
      const plain = job && typeof job.toObject === 'function' ? job.toObject() : { ...job };
      return { ...plain, matchReasons: buildMatchReasons(user, plain) };
    });
  } catch (err) {
    console.error('Match reasons failed:', err.message);
    return jobs;
  }
};

module.exports = { buildMatchReasons, withMatchReasons, matchReasonsEnabled, MAX_REASONS };
