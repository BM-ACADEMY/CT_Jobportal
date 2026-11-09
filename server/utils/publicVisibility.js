// What the public Jobs and Companies pages may show (decided by Kamar, 9 Nov):
// jobs newer than 45 days (or renewed), not hidden by admin, and from verified companies.
const JOB_MAX_AGE_DAYS = 45;
const DAY = 86400000;

// HIDE_UNVERIFIED_JOBS=false turns the verified-company rule off. On by default.
const hideUnverified = () => process.env.HIDE_UNVERIFIED_JOBS !== 'false';

const freshCutoff = (now = Date.now()) => new Date(now - JOB_MAX_AGE_DAYS * DAY);

// Mongo conditions every public job list must add.
const publicJobConditions = ({ now = Date.now(), verifiedCompanyIds = null, hiddenCompanyIds = null } = {}) => {
  const cut = freshCutoff(now);
  const and = [
    { hiddenFromPublic: { $ne: true } },
    { $or: [{ createdAt: { $gte: cut } }, { renewedAt: { $gte: cut } }] },
  ];
  if (verifiedCompanyIds) and.push({ company: { $in: verifiedCompanyIds } });
  else if (hiddenCompanyIds && hiddenCompanyIds.length) and.push({ company: { $nin: hiddenCompanyIds } });
  return and;
};

// Whole-company check used by the Companies page.
const publicCompanyConditions = () => ({ hiddenFromPublic: { $ne: true }, ...(hideUnverified() ? { is_verified: true } : {}) });

module.exports = { JOB_MAX_AGE_DAYS, hideUnverified, freshCutoff, publicJobConditions, publicCompanyConditions };
