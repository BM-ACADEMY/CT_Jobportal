'use strict';
// Recurring plans are not for sale until RECURRING_PLANS_ENABLED=true (default off).
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');

describe('recurring plans switch', () => {
  beforeEach(() => { h.reset(); h.makeUser('tpo'); h.makeUser('u1'); delete process.env.RECURRING_PLANS_ENABLED; });
  afterEach(() => { delete process.env.RECURRING_PLANS_ENABLED; });

  it('create-subscription answers 503 while the switch is off and touches nothing at Razorpay', async () => {
    const res = await h.createSubscriptionOrder('tpo', { planId: 'planCampus' }, 'college');
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.msg, 'Recurring plans open soon');
    assert.equal(res.body.recurringPlansEnabled, false);
    assert.equal(h.razorpay.createdPlans.length, 0);
    assert.equal(h.razorpay.createdSubscriptions.length, 0);
  });

  it('only the exact value "true" opens it', async () => {
    for (const v of ['1', 'yes', 'TRUE', 'on']) {
      process.env.RECURRING_PLANS_ENABLED = v;
      assert.equal((await h.createSubscriptionOrder('tpo', { planId: 'planCampus' }, 'college')).statusCode, 503, v);
    }
    process.env.RECURRING_PLANS_ENABLED = 'true';
    const res = await h.createSubscriptionOrder('tpo', { planId: 'planCampus' }, 'college');
    assert.equal(res.statusCode, 200);
    assert.equal(h.razorpay.createdSubscriptions.length, 1);
    assert.equal(h.razorpay.createdSubscriptions[0].notes.userId, 'tpo');
    assert.equal(res.body.amount, 590000, '5000 + 18% GST in paise, unchanged');
  });

  it('one-time plans are not affected by the switch', async () => {
    assert.equal((await h.createOrder('u1', { planId: 'planPro' })).statusCode, 200);
    assert.equal((await h.verifyPayment('u1', { planId: 'planFree', isFree: true })).statusCode, 200);
  });
});
