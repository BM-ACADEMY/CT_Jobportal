const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PACK } = require('../config/collegePack');
const { flagsFor } = require('../utils/collegeFunnel');

const seed = fs.readFileSync(__dirname + '/../scripts/seedCampusPlans.js', 'utf8');
const block = seed.slice(seed.indexOf("name: 'Campus Starter'"), seed.indexOf("name: 'Campus Lite'"));

test('Campus Starter costs the same as one student pack and holds Free capacity plus that pack', () => {
  assert.match(block, new RegExp(`price: ${PACK.price},`));
  assert.match(block, new RegExp(`name: 'Student Capacity', isActive: true, value: ${100 + PACK.students}`));
  assert.match(block, /duration: 'Yearly'/);
});

test('Campus Starter has none of the paid-only perks', () => {
  for (const perk of ['Automated MoU Generation', 'WhatsApp Interview Invites', 'Scheduled Placement Reports', 'Company Drive Invites', 'Co-Branded Certificates']) {
    assert.match(block, new RegExp(`name: '${perk}', isActive: false`), perk);
  }
});

test('Campus Starter is left out of the tier map, so tier-based limits keep treating it as Free', () => {
  const pf = fs.readFileSync(__dirname + '/../utils/paymentFulfillment.js', 'utf8');
  assert.ok(!/Campus Starter/.test(pf));
  assert.match(fs.readFileSync(__dirname + '/../models/College.js', 'utf8'), /enum: \['campus_free', 'campus_lite', 'campus_pro', 'campus_elite'\]/);
});

test('the funnel counts a Starter buyer as paid even though the tier stays free', () => {
  assert.equal(flagsFor({ tier: 'campus_free' }).paid, false);
  assert.equal(flagsFor({ tier: 'campus_free', paidPlan: true }).paid, true);
});
