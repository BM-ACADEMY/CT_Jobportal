/**
 * Upserts all 4 Campus plans (Free, Lite, Pro, Elite) to match the current pricing/feature
 * matrix. Safe to re-run — updates existing docs in place (matched by name for the paid tiers,
 * by {role:'college', price:0} for Free, since the Free doc may predate this script and be
 * named differently) rather than skipping them.
 * Usage: node scripts/seedCampusPlans.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');

const CAMPUS_PLANS = [
  {
    name: 'Campus Free',
    price: 0,
    currency: 'INR',
    duration: 'Lifetime',
    role: 'college',
    isActive: true,
    activeJobPostings: 0,
    candidateSearchPerDay: 0,
    userSeats: 1,
    features: [
      { name: 'Student Capacity', isActive: true, value: 100 },
      { name: 'CSV Bulk Student Upload', isActive: true, value: true },
      { name: 'Auto Candidate Account Creation', isActive: true, value: true },
      { name: 'Co-Branded Certificates', isActive: false, value: 'Platform Only' },
      { name: 'Automated MoU Generation', isActive: false, value: false },
      { name: 'WhatsApp Interview Invites', isActive: false, value: false },
      { name: 'Scheduled Placement Reports', isActive: false, value: 'None' },
      { name: 'ID Verification Badges', isActive: true, value: 'Manual Queue' },
      { name: 'Razorpay Auto-Renewal', isActive: false, value: 'N/A' },
    ]
  },
  {
    name: 'Campus Lite',
    price: 14999,
    currency: 'INR',
    duration: 'Yearly',
    role: 'college',
    isActive: true,
    activeJobPostings: 0,
    candidateSearchPerDay: 0,
    userSeats: 3,
    pricingOptions: [{ quantity: 1, price: 14999 }],
    features: [
      { name: 'Student Capacity', isActive: true, value: 1000 },
      { name: 'CSV Bulk Student Upload', isActive: true, value: true },
      { name: 'Auto Candidate Account Creation', isActive: true, value: true },
      { name: 'Co-Branded Certificates', isActive: true, value: 'Standard' },
      { name: 'Automated MoU Generation', isActive: false, value: false },
      { name: 'WhatsApp Interview Invites', isActive: false, value: false },
      { name: 'Scheduled Placement Reports', isActive: true, value: 'Monthly PDF' },
      { name: 'ID Verification Badges', isActive: true, value: '250 Students' },
      { name: 'Razorpay Auto-Renewal', isActive: true, value: 'Mandate' },
    ]
  },
  {
    name: 'Campus Pro',
    price: 39999,
    currency: 'INR',
    duration: 'Yearly',
    role: 'college',
    isActive: true,
    activeJobPostings: 0,
    candidateSearchPerDay: 0,
    userSeats: 5,
    pricingOptions: [{ quantity: 1, price: 39999 }],
    features: [
      { name: 'Student Capacity', isActive: true, value: 3500 },
      { name: 'CSV Bulk Student Upload', isActive: true, value: true },
      { name: 'Auto Candidate Account Creation', isActive: true, value: true },
      { name: 'Co-Branded Certificates', isActive: true, value: 'Standard' },
      { name: 'Automated MoU Generation', isActive: true, value: true },
      { name: 'WhatsApp Interview Invites', isActive: true, value: true },
      { name: 'Scheduled Placement Reports', isActive: true, value: 'Weekly/Monthly PDF' },
      { name: 'ID Verification Badges', isActive: true, value: 'Unlimited' },
      { name: 'Razorpay Auto-Renewal', isActive: true, value: 'Mandate' },
    ]
  },
  {
    name: 'Campus Elite',
    price: 89999,
    currency: 'INR',
    duration: 'Yearly',
    role: 'college',
    isActive: true,
    activeJobPostings: 0,
    candidateSearchPerDay: 0,
    userSeats: 10,
    pricingOptions: [{ quantity: 1, price: 89999 }],
    features: [
      // Stored as the string 'Unlimited' rather than 0 — paymentController.js's `studentLimit`
      // assignment and pdfGenerator.js's MoU text already treat any non-positive value as unlimited
      // ('Unlimited' > 0 is false in both), and the pricing card only renders a friendly "Unlimited"
      // label when it sees this exact string (it doesn't auto-convert 0 for college plans).
      { name: 'Student Capacity', isActive: true, value: 'Unlimited' },
      { name: 'CSV Bulk Student Upload', isActive: true, value: true },
      { name: 'Auto Candidate Account Creation', isActive: true, value: true },
      { name: 'Co-Branded Certificates', isActive: true, value: 'Custom Layout' },
      { name: 'Automated MoU Generation', isActive: true, value: true },
      { name: 'WhatsApp Interview Invites', isActive: true, value: true },
      { name: 'Scheduled Placement Reports', isActive: true, value: 'Custom Schedule' },
      { name: 'ID Verification Badges', isActive: true, value: 'Unlimited' },
      { name: 'Razorpay Auto-Renewal', isActive: true, value: 'Custom Billing' },
    ]
  }
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal');
  console.log('Connected to MongoDB');

  for (const plan of CAMPUS_PLANS) {
    const filter = plan.price === 0
      ? { role: 'college', price: 0 }
      : { name: plan.name, role: 'college' };

    const existing = await Subscription.findOne(filter);
    if (existing) {
      const previousName = existing.name;
      Object.assign(existing, plan);
      await existing.save();
      console.log(previousName === plan.name ? `Updated ${plan.name}` : `Updated ${plan.name} (was named "${previousName}")`);
    } else {
      await Subscription.create(plan);
      console.log(`Created ${plan.name}`);
    }
  }

  console.log('Done!');
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
