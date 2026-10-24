// READ-ONLY. Prints the live Free plan limits and how many users still carry an older copy of them.
// Usage: cd server && node scripts/printFreePlanLimits.js
// Why: each user stores a copy of their plan (user.subscriptionDetails) when the account is created, and that copy
// wins over the plan row. Editing the Free plan in the admin screen therefore does not change existing free users.
require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Role = require('../models/Role');

const FIELDS = ['activeJobPostings', 'candidateSearchPerDay'];

(async () => {
  if (!process.env.MONGODB_URI) { console.error('MONGODB_URI is not set'); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);

  const plans = await Subscription.find({ price: 0 }).lean();
  console.log(`Free (price 0) plans: ${plans.length}`);
  for (const role of ['jobseeker', 'recruiter', 'company', 'college']) {
    const rows = plans.filter((p) => p.role === role);
    if (!rows.length) { console.log(`  ${role}: NO FREE PLAN ROW  <-- code falls back to defaults (jobs ${process.env.DEFAULT_FREE_JOB_LIMIT || 2}, searches ${process.env.DEFAULT_FREE_SEARCH_LIMIT || 10})`); continue; }
    rows.forEach((p) => console.log(`  ${role}: "${p.name}" active=${p.isActive} jobs=${p.activeJobPostings} (0 = unlimited) searches/day=${p.candidateSearchPerDay} (0 = unlimited)`));
    if (rows.filter((p) => p.isActive).length > 1) console.log(`    WARNING: more than one active Free plan for ${role}`);
  }

  console.log('\nUsers whose stored plan copy differs from the live Free plan:');
  const roles = await Role.find({ name: { $in: ['recruiter', 'company'] } }).lean();
  for (const r of roles) {
    const live = plans.find((p) => p.role === r.name && p.isActive);
    if (!live) continue;
    for (const f of FIELDS) {
      const n = await User.countDocuments({ role: r._id, 'subscriptionDetails.price': 0, [`subscriptionDetails.${f}`]: { $ne: live[f] } });
      console.log(`  ${r.name} / ${f}: ${n} user(s) differ from live value ${live[f]}`);
    }
    const none = await User.countDocuments({ role: r._id, subscription: null });
    console.log(`  ${r.name}: ${none} user(s) with no subscription at all`);
  }
  console.log('\n"3 free hires": no limit with that name exists in the server code.');
  console.log('Nothing was changed.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
