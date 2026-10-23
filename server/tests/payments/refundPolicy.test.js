const test = require('node:test');
const assert = require('node:assert');
const { checkRefundEligibility } = require('../../utils/refundPolicy');

const HOUR = 3600 * 1000;
const NOW = Date.parse('2026-10-22T10:00:00Z');
const mk = (over = {}) => ({ _id: 'p1', user: 'u1', plan: 'planA', amount: 999, status: 'completed', createdAt: new Date(NOW - 2 * HOUR), ...over });
const deps = ({ twin = null, earlier = null } = {}) => ({
  now: () => NOW,
  Payment: { findOne: (q) => ({ select: async () => (q.plan || q.payPerFeature) && q.createdAt ? twin : earlier }) },
  User: { find: () => ({ select: async () => [{ _id: 'u1' }] }) },
});
const ctx = { user: { email: 'a@b.com' }, planRole: 'company', phone: '9876543210' };

test('refund within 24h is eligible', async () => {
  assert.equal((await checkRefundEligibility(mk(), deps(), ctx)).eligible, true);
});
test('after 24h is rejected', async () => {
  const r = await checkRefundEligibility(mk({ createdAt: new Date(NOW - 30 * HOUR) }), deps(), ctx);
  assert.equal(r.code, 'window_closed');
});
test('duplicate charge is refundable after the window', async () => {
  const r = await checkRefundEligibility(mk({ createdAt: new Date(NOW - 30 * HOUR) }), deps({ twin: { _id: 'p0' } }), ctx);
  assert.equal(r.eligible, true);
  assert.equal(r.duplicate, true);
});
test('college plans are contact-only', async () => {
  const r = await checkRefundEligibility(mk(), deps(), { ...ctx, planRole: 'college' });
  assert.equal(r.code, 'contact_support');
});
test('second refund for the same account/email/phone is rejected', async () => {
  const r = await checkRefundEligibility(mk(), deps({ earlier: { _id: 'old' } }), ctx);
  assert.equal(r.code, 'already_refunded');
});
test('non-completed and free payments are rejected', async () => {
  assert.equal((await checkRefundEligibility(mk({ status: 'refunded' }), deps(), ctx)).code, 'not_completed');
  assert.equal((await checkRefundEligibility(mk({ amount: 0 }), deps(), ctx)).code, 'free');
});
