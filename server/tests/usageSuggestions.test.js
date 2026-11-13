const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { suggestFor } = require('../utils/userUsage');

const free = { state: 'free', paid: false };
test('failed test on a free plan points to a BM Academy course', () => {
  assert.match(suggestFor({ plan: free, latestTest: { skill: 'excel', percentage: 30, passed: false } }), /BM Academy course/);
});
test('good score on a free plan points to premium', () => {
  assert.match(suggestFor({ plan: free, latestTest: { skill: 'excel', percentage: 85, passed: true } }), /premium/);
});
test('heavy free AI use points to premium; light use gives nothing', () => {
  assert.match(suggestFor({ plan: free, freeAi30: 6 }), /premium/);
  assert.strictEqual(suggestFor({ plan: free, freeAi30: 1 }), '');
});
test('paid people get no sales hint; expired ones get a renew hint', () => {
  assert.strictEqual(suggestFor({ plan: { state: 'active', paid: true }, latestTest: { skill: 'x', percentage: 10, passed: false } }), '');
  assert.match(suggestFor({ plan: { state: 'expired', paid: false } }), /renew/);
});
test('free companies that posted jobs get a paid-plan hint; others none', () => {
  assert.match(suggestFor({ role: 'recruiter', plan: free, jobsPosted: 2 }), /paid plan/);
  assert.strictEqual(suggestFor({ role: 'recruiter', plan: free, jobsPosted: 0 }), '');
  assert.strictEqual(suggestFor({ role: 'college', plan: free, jobsPosted: 3 }), '');
});
test('both admin screens use it and the usage route stays admin only', () => {
  const r = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
  assert.match(r('../controllers/skillTestAdminController.js'), /suggestFor/);
  assert.match(r('../controllers/adminUserUsageController.js'), /suggestFor/);
  const ar = r('../routes/adminRoutes.js');
  assert.ok(ar.indexOf("/users/:id/usage") > ar.indexOf("authorizeRoles('admin')"));
});
