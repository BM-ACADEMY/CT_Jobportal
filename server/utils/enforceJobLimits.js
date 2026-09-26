const Job = require('../models/Job');
const { getEffectivePlanLimit } = require('./getEffectivePlanLimit');

/**
 * Enforces the job posting limits based on the user's active plan.
 * If the user's active jobs exceed the limit (e.g., plan expired and downgraded to free),
 * it converts the oldest active jobs to 'draft' status.
 */
const enforceJobLimits = async (user, userId) => {
  try {
    const roleName = user.role?.name || 'recruiter';
    const planLimit = await getEffectivePlanLimit(user, roleName);
    
    // Add pay-per-feature limits
    let payPerLimit = 0;
    if (Array.isArray(user.purchasedFeatures)) {
      user.purchasedFeatures.forEach(f => {
        if (f.isActive && f.featureKey === 'activeJobPostings' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > new Date())) {
          payPerLimit += f.usageLeft;
        }
      });
    }

    const isUnlimited = planLimit === 0;
    const totalAllowed = planLimit + payPerLimit;

    if (isUnlimited) return;

    let activeQuery = { status: 'active', recruiter: userId };
    if (user.company) {
      activeQuery = { status: 'active', $or: [{ company: user.company }, { recruiter: userId }] };
    }

    // Sort by newest first (descending)
    const activeJobs = await Job.find(activeQuery).sort({ createdAt: -1 });
    console.log(`[enforceJobLimits] User ${user.email} (company: ${user.company}) - totalAllowed: ${totalAllowed}, activeJobs: ${activeJobs.length}`);

    if (activeJobs.length > totalAllowed) {
      // The newest `totalAllowed` jobs remain active. The rest become draft.
      const excessJobs = activeJobs.slice(totalAllowed);
      
      for (const job of excessJobs) {
        console.log(`[enforceJobLimits] Downgrading job ${job._id} to draft`);
        job.status = 'draft';
        await job.save();
      }
    }
  } catch (error) {
    console.error('Error enforcing job limits:', error);
  }
};

module.exports = { enforceJobLimits };
