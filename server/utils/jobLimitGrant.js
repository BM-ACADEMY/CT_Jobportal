// Raising an employer account's active-job limit without a payment (admin screen and scripts/grantJobPostings.js).
// It adds an "extra postings" allowance to that user only. The plan is not changed. enforceJobLimits and the post-job
// check already count these allowances next to the plan limit.
const { getEffectivePlanLimit } = require('./getEffectivePlanLimit');

const EMPLOYER_ROLES = ['recruiter', 'company', 'org_employee'];

const activeExtra = (user, now = new Date()) => (user.purchasedFeatures || [])
  .filter((f) => f.isActive && f.featureKey === 'activeJobPostings' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > now))
  .reduce((sum, f) => sum + f.usageLeft, 0);

// What an account may have today, and what must be added to reach `limit` active jobs in total.
// user needs role and subscription populated.
const planGrant = async (user, limit, now = new Date()) => {
  const roleName = user.role?.name || 'recruiter';
  if (!EMPLOYER_ROLES.includes(roleName)) return { eligible: false, reason: `a "${roleName}" account is not an employer account` };
  const planLimit = await getEffectivePlanLimit(user, roleName);
  if (planLimit === 0) return { eligible: true, unlimited: true, planLimit, existingExtra: 0, current: 0, extra: 0 };
  const existingExtra = activeExtra(user, now);
  const current = planLimit + existingExtra;
  return { eligible: true, unlimited: false, planLimit, existingExtra, current, extra: Math.max(0, limit - current) };
};

const applyGrant = async (user, extra, days, now = new Date()) => {
  const expiresAt = new Date(now.getTime() + days * 86400000);
  user.purchasedFeatures.push({ featureKey: 'activeJobPostings', isActive: true, usageLeft: extra, expiresAt, purchasedAt: now });
  await user.save();
  return expiresAt;
};

module.exports = { planGrant, applyGrant, activeExtra, EMPLOYER_ROLES };
