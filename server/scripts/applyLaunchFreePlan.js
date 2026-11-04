// Sets the live Free job seeker plan to the launch settings. Safe to run twice.
//   node scripts/applyLaunchFreePlan.js          -> dry run, only prints what would change
//   node scripts/applyLaunchFreePlan.js --apply  -> writes the change
// Only touches the fields below. The dynamic catalog toggles ("Apply to jobs", Salary Benchmarking)
// are set in Admin > Subscriptions > Plans > Free > Feature toggles.
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
require('dotenv').config({ path: __dirname + '/../.env' });

const LAUNCH_FREE = {
  hasResumeBuilder: true,
  resumeBuilderCount: 1,
  jobAlerts: 'Weekly',
  hasCareerCounselling: true,
  careerCounsellingCount: 1,   // 0 would mean unlimited free sessions
  hasJobMatchAnalysis: true,
  hasAiResumeReview: false,
  aiResumeReviewCount: 0,
  hasProfileBoost: false,
  hasProfileViewInsights: false,
  hasMockInterviews: false,
  hasPriorityBadge: false,
};

(async () => {
  const apply = process.argv.includes('--apply');
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal');
    const plans = await Subscription.find({ role: 'jobseeker', name: 'Free', price: 0 });
    if (plans.length !== 1) {
      console.log(`Expected exactly 1 Free job seeker plan, found ${plans.length}. Nothing changed.`);
      return;
    }
    const plan = plans[0];
    const changes = Object.entries(LAUNCH_FREE).filter(([k, v]) => plan[k] !== v);
    if (!changes.length) { console.log('Free plan already has the launch settings.'); return; }
    changes.forEach(([k, v]) => console.log(`${k}: ${JSON.stringify(plan[k])} -> ${JSON.stringify(v)}`));
    if (!apply) { console.log('Dry run. Add --apply to save.'); return; }
    changes.forEach(([k, v]) => { plan[k] = v; });
    await plan.save();
    console.log('Saved.');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
