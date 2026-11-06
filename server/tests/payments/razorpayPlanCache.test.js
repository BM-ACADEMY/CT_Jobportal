'use strict';
// A Razorpay plan cannot be edited, so a changed price or billing period needs a new one.
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');

describe('cached Razorpay plan follows the plan in admin', () => {
  let original;
  beforeEach(() => {
    h.reset(); h.makeUser('tpo');
    process.env.RECURRING_PLANS_ENABLED = 'true';
    const campus = h.plans.campus;
    original = { price: campus.price, duration: campus.duration, razorpayPlanId: campus.razorpayPlanId, razorpayPlanMeta: campus.razorpayPlanMeta };
    campus.razorpayPlanId = ''; campus.razorpayPlanMeta = undefined;
  });
  afterEach(() => { Object.assign(h.plans.campus, original); delete process.env.RECURRING_PLANS_ENABLED; });
  const buy = () => h.createSubscriptionOrder('tpo', { planId: 'planCampus' }, 'college');

  it('reuses the Razorpay plan while price and period are unchanged', async () => {
    assert.equal((await buy()).statusCode, 200);
    assert.equal((await buy()).statusCode, 200);
    assert.equal(h.razorpay.createdPlans.length, 1);
  });

  it('creates a new Razorpay plan when the billing period is changed in admin', async () => {
    await buy();
    h.plans.campus.duration = 'Monthly';
    await buy();
    assert.equal(h.razorpay.createdPlans.length, 2);
    assert.deepEqual([h.razorpay.createdPlans[1].period, h.razorpay.createdPlans[1].interval], ['monthly', 1]);
    assert.equal(h.razorpay.createdSubscriptions[1].plan_id, 'plan_rzp_2');
  });

  it('creates a new Razorpay plan when the price is changed in admin', async () => {
    await buy();
    h.plans.campus.price = 6000;
    await buy();
    assert.equal(h.razorpay.createdPlans.length, 2);
    assert.equal(h.razorpay.createdPlans[1].item.amount, 708000, '6000 + 18% GST in paise');
  });

  it('a plan cached before this fix (no record of its terms) is replaced once, then reused', async () => {
    h.plans.campus.razorpayPlanId = 'plan_old_unknown';
    await buy();
    assert.equal(h.razorpay.createdPlans.length, 1);
    await buy();
    assert.equal(h.razorpay.createdPlans.length, 1);
  });
});
