const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { daysLeft, planSummary, featureRows } = require('../utils/userUsage');

const now = new Date('2026-11-11T00:00:00Z');
test('days left rounds up and never goes below zero', () => {
  assert.strictEqual(daysLeft('2026-11-14T00:00:00Z', now), 3);
  assert.strictEqual(daysLeft('2026-11-11T10:00:00Z', now), 1);
  assert.strictEqual(daysLeft('2026-11-01T00:00:00Z', now), 0);
  assert.strictEqual(daysLeft(null, now), null);
});

test('plan summary: paid, expired, free, none, lifetime', () => {
  const paid = planSummary({ details: { name: 'Pro', price: 999, duration: 'Monthly' }, expiry: '2026-11-21T00:00:00Z', autoRenew: true, now });
  assert.deepStrictEqual([paid.state, paid.paid, paid.daysLeft, paid.autoRenew], ['active', true, 10, true]);
  const old = planSummary({ details: { name: 'Pro', price: 999 }, expiry: '2026-10-01T00:00:00Z', now });
  assert.deepStrictEqual([old.state, old.paid, old.daysLeft], ['expired', false, 0]);
  assert.strictEqual(planSummary({ details: { name: 'Free', price: 0 }, now }).state, 'free');
  assert.strictEqual(planSummary({ details: null, now }).state, 'none');
  const life = planSummary({ details: { name: 'Life', price: 5000, duration: 'Lifetime' }, expiry: null, now });
  assert.deepStrictEqual([life.state, life.daysLeft, life.expiry], ['active', null, null]);
});

test('bought-separately rows show what is left and whether still active', () => {
  const rows = featureRows([{ featureKey: 'resume_review', isActive: true, usageLeft: 2, expiresAt: '2026-11-16T00:00:00Z' }, { featureKey: 'x', isActive: true, usageLeft: 1, expiresAt: '2026-10-01T00:00:00Z' }], now);
  assert.deepStrictEqual([rows[0].active, rows[0].daysLeft, rows[1].active], [true, 5, false]);
});

test('usage route is behind the admin-only gate and read only', () => {
  const src = fs.readFileSync(path.join(__dirname, '../routes/adminRoutes.js'), 'utf8');
  assert.ok(src.indexOf("'/users/:id/usage'") > src.indexOf("router.use(authorizeRoles('admin'))"));
  assert.ok(!/router\.(post|put|patch|delete)\('\/users\/:id\/usage'/.test(src));
});
