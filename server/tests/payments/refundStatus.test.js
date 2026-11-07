'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { syncRefundStatuses, needsCheck } = require('../../utils/refundStatus');

const NOW = Date.parse('2026-11-07T08:00:00Z');
const pay = (over = {}) => ({ _id: 'p1', status: 'refunded', razorpay_refund_id: 'rfnd_1', refundGatewayStatus: 'pending', refundStatusCheckedAt: null, saves: 0, async save() { this.saves += 1; }, ...over });
const rz = (status, calls = []) => ({ refunds: { fetch: async (id) => { calls.push(id); if (status instanceof Error) throw status; return { id, status }; } } });

test('pending becomes processed, exactly as Razorpay says, and is saved', async () => {
  const p = pay(); const calls = [];
  await syncRefundStatuses(rz('processed', calls), [p], NOW);
  assert.equal(p.refundGatewayStatus, 'processed');
  assert.equal(p.saves, 1);
  assert.deepEqual(calls, ['rfnd_1']);
});

test('a processed or failed refund is never asked about again', async () => {
  const calls = [];
  await syncRefundStatuses(rz('processed', calls), [pay({ refundGatewayStatus: 'processed' }), pay({ _id: 'p2', refundGatewayStatus: 'failed' })], NOW);
  assert.equal(calls.length, 0);
});

test('Razorpay is not asked more than once every 2 minutes, and only for refunded payments with a refund id', async () => {
  const calls = [];
  await syncRefundStatuses(rz('pending', calls), [
    pay({ refundStatusCheckedAt: new Date(NOW - 30 * 1000) }),
    pay({ _id: 'p3', status: 'completed' }),
    pay({ _id: 'p4', razorpay_refund_id: '' }),
  ], NOW);
  assert.equal(calls.length, 0);
  assert.equal(needsCheck(pay({ refundStatusCheckedAt: new Date(NOW - 3 * 60 * 1000) }), NOW), true);
});

test('at most 5 refunds are checked per page load', async () => {
  const calls = [];
  await syncRefundStatuses(rz('pending', calls), Array.from({ length: 8 }, (_, i) => pay({ _id: `p${i}`, razorpay_refund_id: `rfnd_${i}` })), NOW);
  assert.equal(calls.length, 5);
});

test('if Razorpay fails, the page still works and the old status is kept', async () => {
  const p = pay();
  await syncRefundStatuses(rz(new Error('timeout')), [p], NOW);
  assert.equal(p.refundGatewayStatus, 'pending');
  assert.equal(p.saves, 0);
});
