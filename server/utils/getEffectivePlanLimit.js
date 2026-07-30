const Subscription = require('../models/Subscription');

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

  if (!plan) {
    // No plan at all — fall back to Free plan
    const freePlan = await Subscription.findOne({ price: 0, role: roleName, isActive: true });
    return freePlan?.activeJobPostings || 0;
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
  const freePlan = await Subscription.findOne({ price: 0, role: roleName, isActive: true });
  return freePlan?.activeJobPostings || 0;
};

module.exports = { getEffectivePlanLimit };
