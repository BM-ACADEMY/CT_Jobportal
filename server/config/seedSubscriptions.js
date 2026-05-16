const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Role = require('../models/Role');

const FREE_PLANS = [
  {
    name: 'Free',
    price: 0,
    currency: 'INR',
    duration: 'Lifetime',
    role: 'jobseeker',
    isActive: true,

    // Resume
    hasResumeBuilder: true,
    resumeBuilderCount: 1,       // 1 resume allowed

    // Job Alerts
    jobAlerts: 'Monthly',

    // Premium features OFF by default
    hasProfileBoost: false,
    hasProfileViewInsights: false,
    hasMessageRecruiters: true,
    messageRecruitersCount: 1,   // 1 recruiter conversation

    hasCareerCounselling: true,
    careerCounsellingCount: 0,   // 0 = unlimited sessions (basic counselling)

    hasInterviewPrep: false,
    hasPriorityBadge: false,
    hasSalaryBenchmarking: false,
    hasAiResumeReview: false,
  },
  {
    name: 'Free',
    price: 0,
    currency: 'INR',
    duration: 'Lifetime',
    role: 'recruiter',
    isActive: true,

    // Job postings
    activeJobPostings: 2,        // 2 active job posts

    // Candidate search
    candidateSearchPerDay: 10,

    // Premium features OFF
    hasATSPipeline: false,
    hasAnalyticsDashboard: false,
    hasCandidateDBExport: false,
    hasBulkMessaging: false,
    hasVideoInterview: false,
    hasInterviewScheduling: false,

    // Org
    userSeats: 1,
    companyProfileType: 'Basic',
    hasTeamCollaboration: false,
    hasBulkApplicantManagement: false,
    hasDedicatedOnboarding: false,
  },
  {
    name: 'Free',
    price: 0,
    currency: 'INR',
    duration: 'Lifetime',
    role: 'company',
    isActive: true,

    activeJobPostings: 2,
    candidateSearchPerDay: 10,

    hasATSPipeline: false,
    hasAnalyticsDashboard: false,
    hasCandidateDBExport: false,
    hasBulkMessaging: false,
    hasVideoInterview: false,
    hasInterviewScheduling: false,

    userSeats: 1,
    companyProfileType: 'Basic',
    hasTeamCollaboration: false,
    hasBulkApplicantManagement: false,
    hasDedicatedOnboarding: false,
  },
];

const seedSubscriptions = async () => {
  try {
    for (const planData of FREE_PLANS) {
      const existing = await Subscription.findOne({ price: 0, role: planData.role, isActive: true });
      if (!existing) {
        await Subscription.create(planData);
        console.log(`✅ Default Free plan created for role: ${planData.role}`);
      } else {
        console.log(`⚡ Free plan already exists for role: ${planData.role}`);
      }
    }
    console.log('Subscription plans initialization checked.');
  } catch (error) {
    console.error('❌ Error seeding subscriptions:', error);
  }
};

// Migrate all existing users who have no subscription to the free plan for their role
const migrateUsersToFreePlan = async () => {
  try {
    const usersWithoutPlan = await User.find({ subscription: null }).populate('role');

    if (usersWithoutPlan.length === 0) {
      console.log('⚡ All users already have a subscription plan.');
      return;
    }

    // Build a role→freePlan map to avoid repeated DB queries
    const freePlanCache = {};
    for (const roleName of ['jobseeker', 'recruiter', 'company', 'org_employee', 'admin', 'subadmin']) {
      const plan = await Subscription.findOne({ price: 0, isActive: true, role: roleName });
      if (plan) freePlanCache[roleName] = plan._id;
    }

    let migrated = 0;
    for (const user of usersWithoutPlan) {
      const roleName = user.role?.name;
      // org_employee, admin, subadmin get jobseeker free plan as fallback
      const planId = freePlanCache[roleName] || freePlanCache['jobseeker'];
      if (!planId) continue;

      await User.findByIdAndUpdate(user._id, { subscription: planId, subscriptionExpiry: null });
      migrated++;
    }

    console.log(`✅ Migrated ${migrated} user(s) to the Free plan.`);
  } catch (error) {
    console.error('❌ Error migrating users to free plan:', error);
  }
};

module.exports = { seedSubscriptions, migrateUsersToFreePlan };
