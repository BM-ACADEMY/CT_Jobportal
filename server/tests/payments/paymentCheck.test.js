'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluatePayment } = require('../../utils/paymentCheck');

const NOW = Date.parse('2026-11-07T08:00:00Z');
const plan = { _id: 'planPlus', name: 'Plus', role: 'jobseeker', price: 499, duration: 'Monthly' };
const rzp = { id: 'pay_1', order_id: 'order_1', amount: 58882, status: 'captured', subscription_id: null };
const record = { status: 'completed', amount: 588.82, baseAmount: 499, gstPercentage: 18 };
const user = { subscription: 'planPlus', subscriptionDetails: { name: 'Plus' }, subscriptionExpiry: new Date(NOW + 30 * 86400000) };
const run = (over = {}) => evaluatePayment({ rzp, record, user, plan, gstPercentage: 18, now: NOW, ...over });

test('a good Plus purchase passes: recorded, plan active, 18% GST, no subscription', () => {
  const r = run();
  assert.equal(r.ok, true, r.problems.join(' | '));
  assert.equal(r.summary.planActive, true);
  assert.equal(r.summary.subscription, false);
});

test('money taken but no record on our side is a problem', () => {
  const r = run({ record: null });
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /NO payment record/);
});

test('plan not active on the buyer account is a problem (and an expired plan counts as not active)', () => {
  assert.match(run({ user: { subscription: null, subscriptionDetails: null } }).problems.join(' '), /NOT active/);
  assert.match(run({ user: { ...user, subscriptionExpiry: new Date(NOW - 1000) } }).problems.join(' '), /NOT active/);
});

test('a refunded or cancelled payment is not expected to have an active plan', () => {
  assert.equal(run({ record: { ...record, status: 'refunded' }, user: { subscription: null } }).ok, true);
  assert.equal(run({ record: { ...record, status: 'cancelled' }, user: { subscription: null } }).ok, true);
});

test('wrong GST is a problem', () => {
  assert.match(run({ record: { ...record, gstPercentage: 0, baseAmount: 588.82 } }).problems.join(' '), /0% GST but the site setting is 18%/);
  assert.match(run({ gstPercentage: 5 }).problems.join(' '), /18% GST but the site setting is 5%/);
  assert.match(run({ record: { ...record, baseAmount: 400 } }).problems.join(' '), /is not Rs 588.82/);
});

test('amount at Razorpay different from our record is a problem', () => {
  assert.match(run({ rzp: { ...rzp, amount: 49900 } }).problems.join(' '), /Razorpay charged Rs 499/);
});

test('any Razorpay subscription (auto-renewal) is a problem', () => {
  assert.match(run({ rzp: { ...rzp, subscription_id: 'sub_X' } }).problems.join(' '), /automatic renewal/);
});

test('a company or college plan bought while recurring plans are closed is a problem', () => {
  assert.match(run({ plan: { ...plan, role: 'company', name: 'Starter' } }).problems.join(' '), /company plan/);
  assert.match(run({ plan: { ...plan, role: 'college', name: 'Campus Pro' } }).problems.join(' '), /college plan/);
});

test('a pay-per-feature purchase (no plan) still gets the money and GST checks', () => {
  const r = run({ plan: null, user: null });
  assert.equal(r.ok, true, r.problems.join(' | '));
  assert.equal(r.summary.plan, '(pay-per feature)');
});
