'use strict';
// A plan the admin switched off (isActive: false) cannot be bought or activated.
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');

describe('inactive plans', () => {
  beforeEach(() => { h.reset(); h.makeUser('u1'); h.makeUser('u2'); });
  afterEach(() => { h.plans.free.isActive = undefined; });

  it('createOrder refuses an inactive plan before touching Razorpay', async () => {
    const res = await h.createOrder('u1', { planId: 'planOld' });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.msg, 'This plan is not available');
    assert.equal(h.razorpay.createdOrders.length, 0);
  });

  it('createSubscriptionOrder refuses an inactive recurring plan', async () => {
    process.env.RECURRING_PLANS_ENABLED = 'true';
    const res = await h.createSubscriptionOrder('u1', { planId: 'planOldCampus' }, 'college');
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.msg, 'This plan is not available');
    assert.equal(h.razorpay.createdSubscriptions.length, 0);
    delete process.env.RECURRING_PLANS_ENABLED;
  });

  it('verifyPayment refuses an inactive paid plan even with payment fields', async () => {
    const body = h.paidOrder({ orderId: 'order_old', paymentId: 'pay_old', planId: 'planOld', userId: 'u1', amountRupees: 944 });
    const res = await h.verifyPayment('u1', body);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.msg, 'This plan is not available');
    assert.equal(h.db.payments.length, 0);
    assert.equal(h.db.users.u1.subscription, null);
  });

  it('a free plan that was switched off still works for someone already on it, but not for a newcomer', async () => {
    assert.equal((await h.verifyPayment('u1', { planId: 'planFree', isFree: true })).statusCode, 200);
    h.plans.free.isActive = false;
    const again = await h.verifyPayment('u1', { planId: 'planFree', isFree: true });
    assert.equal(again.statusCode, 200);
    assert.equal(again.body.alreadyProcessed, true);
    const newcomer = await h.verifyPayment('u2', { planId: 'planFree', isFree: true });
    assert.equal(newcomer.statusCode, 400);
    assert.equal(newcomer.body.msg, 'This plan is not available');
  });

  it('active plans are unaffected (isActive undefined or true)', async () => {
    assert.equal((await h.createOrder('u1', { planId: 'planPro' })).statusCode, 200);
    h.plans.pro.isActive = true;
    assert.equal((await h.createOrder('u1', { planId: 'planPro' })).statusCode, 200);
    delete h.plans.pro.isActive;
  });
});
