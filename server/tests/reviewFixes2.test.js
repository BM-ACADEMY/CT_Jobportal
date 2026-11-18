const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { sanitizeCompanyData } = require('../utils/companyData');

test('company profile form cannot set paid or visibility fields', () => {
  const out = sanitizeCompanyData({ name: 'A', hiddenFromPublic: false, subscription_tier: 'elite', subscriptionExpiry: '2099-01-01', subscription: {}, razorpaySubscriptionId: 'x', nextRenewalDate: 'y', is_verified: true });
  ['hiddenFromPublic', 'subscription_tier', 'subscriptionExpiry', 'subscription', 'razorpaySubscriptionId', 'nextRenewalDate', 'is_verified'].forEach((k) => assert.strictEqual(out[k], undefined, k));
  assert.strictEqual(out.name, 'A');
});

test('public search pages use named wildcards and escaped regex', () => {
  const seo = fs.readFileSync(path.join(__dirname, '../routes/seoRoutes.js'), 'utf8');
  assert.ok(seo.includes("'/page/*splat'") && !seo.includes("'/page/*'"));
  const pub = fs.readFileSync(path.join(__dirname, '../routes/publicRoutes.js'), 'utf8');
  assert.ok(!/\$regex: (search|industry)\b/.test(pub));
});

test('clone resets paid and flagged state, update strips owner fields', () => {
  const src = fs.readFileSync(path.join(__dirname, '../controllers/jobController.js'), 'utf8');
  assert.ok(/'sponsoredUntil'.*'urgentUntil'.*'scamFlags'.*'reportCount'.*\.forEach\(\(k\) => \{ delete newJobData/.test(src));
  assert.ok(/'company', 'recruiter'/.test(src));
});

test('csv cells starting with a formula character are made safe', () => {
  const { toCsv } = require('../utils/driveRules');
  assert.strictEqual(toCsv([['=HYPERLINK("x")', '+91 98', 'ok', -5]]), `"'=HYPERLINK(""x"")",'+91 98,ok,-5`);
});
