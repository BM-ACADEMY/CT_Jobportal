// Raises ONE account's active job-posting limit without a payment (for example the CoreTalents account that will post
// about 150 openings). It adds an extra allowance to that user only; the plan itself is not changed.
//
//   node scripts/grantJobPostings.js --email recruiter@example.com --limit 150 --by "Manager name" --note "CoreTalents, about 150 openings"
//        -> DRY RUN: prints what would change
//   ... --apply   -> writes it (and a record of who asked and when)
//   --days 365    how long the extra allowance lasts (default 365)
//
// --limit is the TOTAL number of active jobs the account may have (plan limit + this extra). The job limit check
// already counts extra allowances (utils/enforceJobLimits.js), so nothing else needs changing.
// Safe to run twice: if the account already has that many, it does nothing.
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
require('../models/Role');          // loaded so populate('role') works when this script runs on its own
require('../models/Subscription');  // loaded so populate('subscription') works
const { getEffectivePlanLimit } = require('../utils/getEffectivePlanLimit');

const arg = (name, fallback = '') => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};

(async () => {
  const email = String(arg('email')).trim().toLowerCase();
  const limit = Number(arg('limit', 150));
  const days = Number(arg('days', 365));
  const by = String(arg('by')).trim();
  const note = String(arg('note')).trim();
  const apply = process.argv.includes('--apply');

  if (!email || !Number.isInteger(limit) || limit < 1 || limit > 1000 || !Number.isInteger(days) || days < 1) {
    console.log('Usage: node scripts/grantJobPostings.js --email <login email> --limit 150 --by "<who asked>" --note "<why>" [--days 365] [--apply]');
    process.exit(1);
  }
  if (apply && !by) { console.log('--by "<who asked>" is required with --apply, so the record shows who asked.'); process.exit(1); }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({ email }).populate('role').populate('subscription');
    if (users.length !== 1) { console.log(`Expected exactly 1 account with email ${email}, found ${users.length}. Nothing changed.`); return; }
    const user = users[0];
    const roleName = user.role?.name || 'recruiter';
    if (!['recruiter', 'company', 'org_employee'].includes(roleName)) {
      console.log(`${email} is a "${roleName}" account, not a recruiter or company. Nothing changed.`); return;
    }

    const planLimit = await getEffectivePlanLimit(user, roleName);
    if (planLimit === 0) { console.log('This account already has unlimited job postings on its plan. Nothing to do.'); return; }
    const now = new Date();
    const existingExtra = (user.purchasedFeatures || [])
      .filter((f) => f.isActive && f.featureKey === 'activeJobPostings' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > now))
      .reduce((sum, f) => sum + f.usageLeft, 0);
    const current = planLimit + existingExtra;
    const extra = limit - current;

    console.log(`Account: ${user.name} <${user.email}>  role=${roleName}  id=${user._id}`);
    console.log(`Plan limit: ${planLimit}   existing extra postings: ${existingExtra}   current total: ${current}`);
    if (extra <= 0) { console.log(`Already allows ${current} (wanted ${limit}). Nothing to do.`); return; }
    const expiresAt = new Date(now.getTime() + days * 86400000);
    console.log(`Would add ${extra} extra postings (new total ${limit}) until ${expiresAt.toISOString().slice(0, 10)}. Plan unchanged.`);
    console.log(`Asked by: ${by || '(not given yet; needed with --apply)'}   note: ${note || '-'}`);
    if (!apply) { console.log('Dry run. Add --apply to save.'); return; }

    user.purchasedFeatures.push({ featureKey: 'activeJobPostings', isActive: true, usageLeft: extra, expiresAt, purchasedAt: now });
    await user.save();
    await mongoose.connection.db.collection('joblimitgrants').insertOne({
      user: user._id, email: user.email, limit, extraAdded: extra, previousTotal: current, expiresAt, requestedBy: by, note, at: now,
    });
    console.log(`Saved. ${user.email} may now have ${limit} active jobs. Recorded in joblimitgrants (by ${by}, ${now.toISOString()}).`);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
