/**
 * Registers the 9 Campus plan features (already embedded on each Subscription doc via
 * seedCampusPlans.js) into the global Feature catalog, so they show up in the admin's
 * "Dynamic Feature Catalog" panel and can be managed/toggled from there like every other role.
 * Safe to re-run — skips any feature name that's already in the catalog, and never touches the
 * isActive/value already set on existing plans (only adds a plan a feature if it's missing it).
 * Requires 'college' to already be in Feature.js's role enum.
 * Usage: node scripts/backfillCollegeFeatureCatalog.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Feature = require('../models/Feature');
const Subscription = require('../models/Subscription');

const COLLEGE_FEATURES = [
  { name: 'Student Capacity', type: 'count', unit: 'students', defaultValue: 100 },
  { name: 'CSV Bulk Student Upload', type: 'boolean', defaultValue: true },
  { name: 'Auto Candidate Account Creation', type: 'boolean', defaultValue: true },
  { name: 'Co-Branded Certificates', type: 'boolean', defaultValue: false },
  { name: 'Automated MoU Generation', type: 'boolean', defaultValue: false },
  { name: 'WhatsApp Interview Invites', type: 'boolean', defaultValue: false },
  { name: 'Scheduled Placement Reports', type: 'boolean', defaultValue: false },
  { name: 'ID Verification Badges', type: 'boolean', defaultValue: true },
  { name: 'Razorpay Auto-Renewal', type: 'boolean', defaultValue: false },
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal');
  console.log('Connected to MongoDB');

  for (const f of COLLEGE_FEATURES) {
    const existing = await Feature.findOne({ name: f.name, role: 'college' });
    if (existing) {
      console.log(`Already registered: ${f.name}`);
      continue;
    }
    await Feature.create({ ...f, role: 'college', isActive: true });
    console.log(`Registered: ${f.name}`);
  }

  // Make sure every college plan actually has all 9 entries (defensive — they already should,
  // since these are the exact names seedCampusPlans.js writes).
  const plans = await Subscription.find({ role: 'college' });
  for (const plan of plans) {
    let changed = false;
    for (const f of COLLEGE_FEATURES) {
      if (!plan.features.some(pf => pf.name === f.name)) {
        plan.features.push({ name: f.name, isActive: false, value: f.defaultValue ?? null });
        changed = true;
      }
    }
    if (changed) {
      await plan.save();
      console.log(`Backfilled missing features on plan: ${plan.name}`);
    }
  }

  console.log('Done!');
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
