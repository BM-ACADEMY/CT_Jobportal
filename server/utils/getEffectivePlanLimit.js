const Subscription = require('../models/Subscription');

// In plans, 0 means unlimited. If the Free plan row is missing from the database (never seeded, deactivated or
// deleted) we must NOT fall through to 0, or every free account would become unlimited. These defaults match the
// seeded Free plan (config/seedSubscriptions.js) and can be overridden in env.
const FALLBACK_FREE_JOB_LIMIT = () => Number(process.env.DEFAULT_FREE_JOB_LIMIT) || 3;
const FALLBACK_FREE_SEARCH_LIMIT = () => Number(process.env.DEFAULT_FREE_SEARCH_LIMIT) || 10;

/**
 * Resolves the effective job posting plan limit for a user.
 * If the user's current paid plan is expired, falls back to the Free plan for their role.
 * @param {Object} user - Mongoose user document (must have subscription populated)
 * @param {string} roleName - The user's role name (e.g. 'recruiter', 'company')
 * @returns {Promise<number>} The active plan's job posting limit
 */
const getEffectivePlanLimit = async (user, roleName) => {
  let plan = user.subscription;

  if (user.subscriptionDetails) {
    const details = user.subscriptionDetails;
    const expiry = user.subscriptionExpiry;
    const isSnapshotValid = details.price === 0 || details.duration === 'Lifetime' || !expiry || new Date(expiry) > new Date();
    if (isSnapshotValid) {
      plan = plan ? { ...plan.toObject ? plan.toObject() : plan, ...details } : details;
    }
  }

  // Map org_employee to company for free plan lookup since there is no 'org_employee' plan
  const planRole = roleName === 'org_employee' ? 'company' : roleName;

  if (!plan) {
    // No plan at all — fall back to Free plan
    const freePlan = await Subscription.findOne({ price: 0, role: planRole, isActive: true });
    return freePlan ? (freePlan.activeJobPostings || 0) : FALLBACK_FREE_JOB_LIMIT();
  }

  // Check if current plan is still valid
  const isValid =
    plan.price === 0 ||
    plan.duration === 'Lifetime' ||
    !user.subscriptionExpiry ||
    new Date(user.subscriptionExpiry) > new Date();

  if (isValid) {
    return plan.activeJobPostings || 0;
  }

  // Paid plan is expired — fall back to free plan for this role
  const freePlan = await Subscription.findOne({ price: 0, role: planRole, isActive: true });
  return freePlan ? (freePlan.activeJobPostings || 0) : FALLBACK_FREE_JOB_LIMIT();
};

// Candidate profile views per day (0 = unlimited on a real plan). A user with no plan at all gets the Free default.
const getEffectiveSearchLimit = (plan) => (plan ? (plan.candidateSearchPerDay || 0) : FALLBACK_FREE_SEARCH_LIMIT());

module.exports = { getEffectivePlanLimit, getEffectiveSearchLimit };
