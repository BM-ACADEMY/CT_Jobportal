// What the public Jobs and Companies pages may show (decided by Kamar, 9 Nov):
// jobs newer than 45 days (or renewed), not hidden by admin, and from verified companies.
const JOB_MAX_AGE_DAYS = 45;
const DAY = 86400000;
const SHORT_LIFE_DAYS = 14; // jobs from the limited free tier (free email address)

// HIDE_UNVERIFIED_JOBS=false turns the verified-company rule off. On by default.
const hideUnverified = () => process.env.HIDE_UNVERIFIED_JOBS !== 'false';

const freshCutoff = (now = Date.now()) => new Date(now - JOB_MAX_AGE_DAYS * DAY);

// Mongo conditions every public job list must add.
const publicJobConditions = ({ now = Date.now(), verifiedCompanyIds = null, hiddenCompanyIds = null } = {}) => {
  const cut = freshCutoff(now);
  const and = [
    { hiddenFromPublic: { $ne: true } },
    { $or: [
      { shortLife: { $ne: true }, $or: [{ createdAt: { $gte: cut } }, { renewedAt: { $gte: cut } }] },
      { shortLife: true, createdAt: { $gte: new Date(now - SHORT_LIFE_DAYS * DAY) } },
    ] },
  ];
  if (verifiedCompanyIds) and.push({ company: { $in: verifiedCompanyIds } });
  else if (hiddenCompanyIds && hiddenCompanyIds.length) and.push({ company: { $nin: hiddenCompanyIds } });
  return and;
};

// Whole-company check used by the Companies page.
const publicCompanyConditions = () => ({ hiddenFromPublic: { $ne: true }, ...(hideUnverified() ? { is_verified: true } : {}) });

// Same rules for one job already loaded (company populated with is_verified / hiddenFromPublic).
// Used by the search-engine pages so Google is never told about a job the site itself hides.
const jobIsPublic = (job, now = Date.now()) => {
  if (!job || job.hiddenFromPublic) return false;
  const cut = freshCutoff(now).getTime();
  const t = (d) => (d ? new Date(d).getTime() : 0);
  if (job.shortLife) { if (t(job.createdAt) < now - SHORT_LIFE_DAYS * DAY) return false; }
  else if (t(job.createdAt) < cut && t(job.renewedAt) < cut) return false;
  const c = job.company;
  if (!c) return !hideUnverified(); // a job with no company is hidden by the list rule too, so the pages match
  if (typeof c === 'object') {
    if (c.hiddenFromPublic) return false;
    if (hideUnverified() && !c.is_verified) return false;
  }
  return true;
};

module.exports = { jobIsPublic, JOB_MAX_AGE_DAYS, hideUnverified, freshCutoff, publicJobConditions, publicCompanyConditions };
