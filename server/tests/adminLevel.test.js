const test = require('node:test');
const assert = require('node:assert/strict');
const { isBlockedForLimited, levelOf, pathOf } = require('../middlewares/adminLevel');

const blocked = (m, p, q) => isBlockedForLimited(m, p, q);

test('limited admin is blocked from money, deletions, user edits, security and admin management', () => {
  for (const [m, p] of [
    ['POST', '/admin/admins'], ['DELETE', '/admin/admins/1'], ['POST', '/admin/staff'], ['PUT', '/admin/staff/1'],
    ['PATCH', '/admin/users/1/plan'], ['PATCH', '/admin/users/1/extend-subscription'], ['PATCH', '/admin/users/1/block'],
    ['PUT', '/admin/users/1'], ['DELETE', '/admin/users/1'], ['DELETE', '/admin/jobs/1'], ['DELETE', '/admin/companies/1'],
    ['PATCH', '/admin/2fa'], ['POST', '/admin/spend'], ['POST', '/admin/job-limits/grant'],
    ['POST', '/admin/jobs/1/sponsor'], ['POST', '/admin/drives/1/mark-paid'], ['POST', '/payments/admin/refunds/1/approve'],
    ['POST', '/coupons'], ['PATCH', '/settings'], ['PATCH', '/subscriptions/1/features/x'], ['PATCH', '/job-fairs/admin/stall-price'],
    ['PATCH', '/admin/users/1/verify-email'],
  ]) assert.equal(blocked(m, p), true, `${m} ${p}`);
});

test('limited admin can still do daily work', () => {
  for (const [m, p] of [
    ['GET', '/admin/users'], ['GET', '/admin/dashboard-stats'], ['PATCH', '/admin/companies/1/verify'], ['PATCH', '/admin/jobs/1/hide'],
    ['POST', '/admin/company-proofs/1/approve'], ['POST', '/admin/whatsapp/reply'], ['PUT', '/admin/needs-action/assign'],
    ['PATCH', '/admin/brand-leads/1'], ['GET', '/admin/otp-stats'], ['PATCH', '/admin/change-password'],
  ]) assert.equal(blocked(m, p), false, `${m} ${p}`);
});

test('csv exports are blocked, plain lists are not', () => {
  assert.equal(blocked('GET', '/admin/brand-leads', { format: 'csv' }), true);
  assert.equal(blocked('GET', '/admin/brand-leads', {}), false);
});

test('level defaults to owner so every existing admin keeps full access', () => {
  assert.equal(levelOf(null), 'owner');
  assert.equal(levelOf({}), 'owner');
  assert.equal(levelOf({ level: 'limited' }), 'limited');
});

test('pathOf strips /api and trailing slash', () => assert.equal(pathOf({ baseUrl: '/api/admin', path: '/users/1/' }), '/admin/users/1'));
