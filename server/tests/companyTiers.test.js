const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { emailKind, isPersonalEmail } = require('../utils/emailKind');
const { isLimitedTier, SHORT_LIFE_DAYS, LIMITED_MAX_ACTIVE } = require('../utils/companyTier');
const { publicJobConditions, jobIsPublic } = require('../utils/publicVisibility');
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const DAY = 86400000;
const now = Date.now();
const paid = { name: 'Plus', price: 999, duration: 'Monthly' };

test('free email addresses can register; only they are the limited tier, and only until a paid plan', () => {
  assert.strictEqual(isLimitedTier({ email: 'ravi@gmail.com' }), true);
  assert.strictEqual(isLimitedTier({ email: 'hr@sritraders.in' }), false);
  assert.strictEqual(isLimitedTier({ email: 'ravi@gmail.com', subscriptionDetails: paid, subscriptionExpiry: new Date(now + 20 * DAY) }), false, 'a paid plan lifts it');
  assert.strictEqual(isLimitedTier({ email: 'ravi@gmail.com', subscriptionDetails: paid, subscriptionExpiry: new Date(now - DAY) }), true, 'an ended plan does not');
  assert.strictEqual(isPersonalEmail('x@gmail.com.evil.in'), false);
  assert.strictEqual(SHORT_LIFE_DAYS, 14);
  assert.strictEqual(LIMITED_MAX_ACTIVE, 1);
  assert.ok(!/blocksCompanySignup/.test(read('../controllers/authController.js')), 'sign-up is no longer blocked');
});
test('a short-life job is public for 14 days and renewing does not extend it; normal jobs keep 45 days', () => {
  const company = { is_verified: true };
  const j = (o) => ({ company, hiddenFromPublic: false, ...o });
  assert.strictEqual(jobIsPublic(j({ shortLife: true, createdAt: new Date(now - 10 * DAY) }), now), true);
  assert.strictEqual(jobIsPublic(j({ shortLife: true, createdAt: new Date(now - 15 * DAY) }), now), false);
  assert.strictEqual(jobIsPublic(j({ shortLife: true, createdAt: new Date(now - 15 * DAY), renewedAt: new Date(now - DAY) }), now), false, 'renewing does not extend');
  assert.strictEqual(jobIsPublic(j({ createdAt: new Date(now - 30 * DAY) }), now), true);
  assert.strictEqual(jobIsPublic(j({ createdAt: new Date(now - 50 * DAY) }), now), false);
  assert.strictEqual(jobIsPublic(j({ shortLife: true, createdAt: new Date(now - 2 * DAY), company: { is_verified: false } }), now), false, 'still needs a verified company');
  const cond = JSON.stringify(publicJobConditions({ now }));
  assert.match(cond, /shortLife/);
});
test('the list query applies the same 14-day rule', () => {
  const cond = publicJobConditions({ now });
  const branch = cond[1].$or.find((b) => b.shortLife === true);
  assert.ok(branch && new Date(branch.createdAt.$gte).getTime() === now - 14 * DAY);
});
test('posting: one live job at a time for the limited tier, flag set by the server, cannot be renewed', () => {
  const c = read('../controllers/jobController.js');
  assert.match(c, /limitedTier && req\.body\.status !== 'draft' && await limitedTierFull\(user\)/);
  assert.match(c, /if \(limitedTier\) newJob\.shortLife = true;/);
  assert.match(c, /code: 'free_email_one_job'/);
  assert.match(c, /createdAt: \{ \$gte: shortLifeCutoff\(\) \}/, 'an expired job stops counting');
  assert.ok((c.match(/'shortLife'/g) || []).length >= 2, 'the poster cannot set shortLife');
  assert.match(read('../controllers/visibilityController.js'), /job\.shortLife\) return res\.status\(400\)/);
});
test('a company email on the same website domain is still verified at once; a free email never is', () => {
  assert.strictEqual(emailKind('hr@sritraders.in', 'https://www.sritraders.in').matchesWebsite, true);
  assert.strictEqual(emailKind('a@gmail.com', 'gmail.com').matchesWebsite, false);
  assert.match(read('../controllers/recruiterController.js'), /user\.isVerified && emailKind\(user\.email, sanitizedCompanyData\.website\)\.matchesWebsite/);
});
test('free email companies are told what to send and what the limit is', () => {
  const b = read('../../client/src/components/company/VerificationBanner.jsx');
  assert.match(b, /GST certificate, Shops licence or Udyam/);
  assert.match(b, /one live job at a time, shown for 14 days/);
  assert.match(read('../../client/src/pages/auth/Register.jsx'), /one live job at a time for 14 days/);
});
