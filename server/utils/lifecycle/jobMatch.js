// Ranks fresh jobs for one job seeker. Pure, so it is easy to test.
const { rankJobsForSeeker } = require('../relevance');

const norm = (v) => String(v || '').toLowerCase().trim();
const words = (v) => norm(v).split(/[^a-z0-9+#.]+/).filter((w) => w.length > 2);

const rankJobsForUser = (user, jobs, limit = 5) => {
  const profile = user?.profile || {};
  const prefs = profile.jobPreferences || {};
  const skills = new Set((profile.skills || []).map(norm).filter(Boolean));
  const titleWords = new Set([...(prefs.jobTitles || []), profile.preferredRole, profile.headline].flatMap(words));
  const cities = new Set([profile.location, ...(prefs.onSiteLocations || []).map((l) => l?.city)].map(norm).filter(Boolean));
  const wantsRemote = (prefs.locationTypes || []).some((t) => norm(t) === 'remote');

  return jobs
    .map((job) => {
      let score = 0;
      const jobSkills = (job.skillsRequired || []).map(norm);
      score += jobSkills.filter((s) => skills.has(s)).length * 3;
      score += words(job.title).filter((w) => titleWords.has(w)).length * 2;
      const loc = norm(job.location);
      if (loc && [...cities].some((c) => loc.includes(c) || c.includes(loc))) score += 2;
      if (wantsRemote && norm(job.workMode) === 'remote') score += 2;
      return { job, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || new Date(b.job.createdAt) - new Date(a.job.createdAt))
    .slice(0, limit)
    .map((r) => r.job);
};

// Mail uses the same engine as the website (utils/relevance.js) when RELEVANCE_ENGINE_ENABLED=true, so the email and the
// "jobs for you" page agree. Each job comes back with `why` (the reasons). Otherwise the original ranker above is used.
const MIN_MAIL_SCORE = 15;
const rankForMail = (user, jobs, limit = 5, { appliedJobIds = [], env = process.env, now = new Date() } = {}) => {
  if (env.RELEVANCE_ENGINE_ENABLED !== 'true') return rankJobsForUser(user, jobs, limit);
  return rankJobsForSeeker(user, jobs, { limit, minScore: MIN_MAIL_SCORE, appliedJobIds, now })
    .filter((r) => !r.thin)
    .map((r) => ({ ...r.job, why: r.reasons }));
};

// Which jobs a paying user is entitled to alerts for, and how often.
const ALERT_PERIOD_DAYS = { Daily: 1, Weekly: 7, Monthly: 30 };
const alertFrequency = (user, now = new Date()) => {
  const feature = (user.purchasedFeatures || []).find((f) =>
    f.isActive && ['jobAlerts', 'hasJobAlerts'].includes(f.featureKey) && (!f.expiresAt || new Date(f.expiresAt) > now));
  if (feature) return 'Daily';
  const expiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
  const planOk = !expiry || expiry > now;
  const f = user.subscriptionDetails?.jobAlerts;
  return planOk && ALERT_PERIOD_DAYS[f] ? f : null;
};

module.exports = { rankJobsForUser, rankForMail, alertFrequency, ALERT_PERIOD_DAYS };
