'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');

const { db } = h;

// A recurring subscription as createSubscriptionOrder leaves it on Razorpay, plus the body a browser sends to verify it.
const subscriptionCheckout = ({ subscriptionId = 'sub_1', paymentId = 'pay_first', userId = 'tpo1', planId = 'planCampus', couponCode = '' } = {}) => {
  h.razorpay.subscriptions[subscriptionId] = { id: subscriptionId, notes: { userId, planId, couponCode } };
  return {
    razorpay_payment_id: paymentId,
    razorpay_subscription_id: subscriptionId,
    razorpay_signature: h.sign(paymentId, subscriptionId),
    planId: 'planCampus'
  };
};

describe('POST /payments/verify-subscription', () => {
  beforeEach(() => {
    h.reset();
    h.makeUser('tpo1');
    h.makeCollege('tpo1');
  });

  it('activates the college, records the payment against the subscription, and alerts admins once', async () => {
    const res = await h.verifySubscription('tpo1', subscriptionCheckout());

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(db.users.tpo1.subscription, 'planCampus');
    assert.equal(db.users.tpo1.autoRenew, true);
    assert.equal(db.collegeByTpo.tpo1.razorpaySubscriptionId, 'sub_1');
    assert.equal(db.payments.length, 1);
    assert.equal(db.payments[0].razorpay_order_id, 'sub_1');
    assert.equal(db.payments[0].isRenewal, false);
    assert.equal(db.adminNotes.length, 1);
  });

  it('does not fail with a 500 after taking payment when no college or company record is found', async () => {
    delete db.collegeByTpo.tpo1;
    const res = await h.verifySubscription('tpo1', subscriptionCheckout());

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.record, null);
    assert.equal(db.payments.length, 1);
    assert.equal(db.users.tpo1.subscription, 'planCampus');
  });

  it('answers a replay as success without setting the college up again', async () => {
    const body = subscriptionCheckout();
    await h.verifySubscription('tpo1', body);
    const savesAfterFirst = db.saves;

    const replay = await h.verifySubscription('tpo1', body);
    assert.equal(replay.statusCode, 200);
    assert.equal(replay.body.alreadyProcessed, true);
    assert.equal(db.payments.length, 1);
    assert.equal(db.saves, savesAfterFirst);
    assert.equal(db.adminNotes.length, 1);
  });

  it('handles concurrent requests for one payment as a single activation', async () => {
    const body = subscriptionCheckout();
    const results = await Promise.all(Array.from({ length: 5 }, () => h.verifySubscription('tpo1', body)));

    assert.ok(results.every(r => r.statusCode === 200 && r.body.success));
    assert.equal(db.payments.length, 1);
    assert.equal(db.adminNotes.length, 1);
  });

  it('counts the coupon stored on the subscription once', async () => {
    const body = subscriptionCheckout({ couponCode: 'SAVE10' });
    await h.verifySubscription('tpo1', body);
    await h.verifySubscription('tpo1', body);

    assert.equal(db.couponUses, 1);
    assert.equal(db.payments[0].baseAmount, 4500);
  });

  it('rejects a subscription that belongs to another user or another plan', async () => {
    h.makeUser('other');
    const others = await h.verifySubscription('other', subscriptionCheckout({ subscriptionId: 'sub_a' }));
    assert.equal(others.statusCode, 400);

    const wrongPlan = await h.verifySubscription('tpo1', subscriptionCheckout({ subscriptionId: 'sub_b', planId: 'planPro', paymentId: 'pay_b' }));
    assert.equal(wrongPlan.statusCode, 400);
    assert.equal(db.payments.length, 0);
  });

  it('rejects a bad signature and missing fields', async () => {
    const body = subscriptionCheckout();
    assert.equal((await h.verifySubscription('tpo1', { ...body, razorpay_signature: 'deadbeef' })).statusCode, 400);
    assert.equal((await h.verifySubscription('tpo1', { planId: 'planCampus' })).statusCode, 400);
    assert.equal(db.payments.length, 0);
  });
});
