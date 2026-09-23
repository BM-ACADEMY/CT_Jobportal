'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');

const { db } = h;

describe('POST /payments/verify-payment — a payment is processed exactly once', () => {
  beforeEach(() => {
    h.reset();
    h.makeUser('u1');
  });

  it('grants the plan, records the amount Razorpay charged, and sends one receipt', async () => {
    const body = h.paidOrder({ orderId: 'order_1', paymentId: 'pay_1', planId: 'planPro', userId: 'u1' });
    const res = await h.verifyPayment('u1', body);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.alreadyProcessed, undefined);
    assert.equal(db.users.u1.subscription, 'planPro');
    assert.equal(db.users.u1.downloadsUsed, 0, 'usage counters reset for the new plan');
    assert.equal(db.payments.length, 1);
    assert.equal(db.payments[0].amount, 1180);
    assert.equal(db.emails.length, 1);
    assert.equal(db.adminNotes.length, 1);
  });

  it('answers a replayed request as success without granting, emailing or counting again', async () => {
    const body = h.paidOrder({ orderId: 'order_1', paymentId: 'pay_1', planId: 'planPro', userId: 'u1' });
    await h.verifyPayment('u1', body);
    const replay = await h.verifyPayment('u1', body);

    assert.equal(replay.statusCode, 200);
    assert.equal(replay.body.success, true);
    assert.equal(replay.body.alreadyProcessed, true);
    assert.equal(db.payments.length, 1);
    assert.equal(db.saves, 1);
    assert.equal(db.emails.length, 1);
    assert.equal(db.adminNotes.length, 1);
    assert.equal(db.payments[0].status, 'completed', 'the payment is not superseded by its own replay');
  });

  it('handles many concurrent requests for one payment (double-click, retries) as a single purchase', async () => {
    const body = h.paidOrder({ orderId: 'order_2', paymentId: 'pay_2', planId: 'planPro', userId: 'u1' });
    const results = await Promise.all(Array.from({ length: 6 }, () => h.verifyPayment('u1', body)));

    assert.ok(results.every(r => r.statusCode === 200 && r.body.success));
    assert.equal(db.payments.length, 1);
    assert.equal(db.saves, 1);
    assert.equal(db.emails.length, 1);
  });

  it('counts a coupon use once, and not again on a replay', async () => {
    const body = h.paidOrder({
      orderId: 'order_c', paymentId: 'pay_c', planId: 'planPro', userId: 'u1', amountRupees: 1062,
      notes: h.orderNotes('u1', 'planPro', 1, 'SAVE10')
    });
    await h.verifyPayment('u1', body);
    await h.verifyPayment('u1', body);

    assert.equal(db.payments.length, 1);
    assert.equal(db.payments[0].couponApplied, 'coupon1');
    assert.equal(db.payments[0].baseAmount, 900);
    assert.equal(db.couponUses, 1);
  });

  it('supersedes the previous plan payment, but not pay-per-feature purchases', async () => {
    db.payments.push(
      { _id: 'old', user: 'u1', status: 'completed', paymentType: 'subscription', amount: 500, razorpay_payment_id: 'pay_old' },
      { _id: 'addon', user: 'u1', status: 'completed', paymentType: 'pay-per-feature', amount: 100, razorpay_payment_id: 'pay_addon' }
    );
    await h.verifyPayment('u1', h.paidOrder({ orderId: 'order_1', paymentId: 'pay_1', planId: 'planPro', userId: 'u1' }));

    const byId = Object.fromEntries(db.payments.map(p => [p._id, p.status]));
    assert.equal(byId.old, 'superseded');
    assert.equal(byId.addon, 'completed');
  });

  it('releases the payment if the plan cannot be granted, so a retry succeeds', async () => {
    const body = h.paidOrder({ orderId: 'order_r', paymentId: 'pay_r', planId: 'planPro', userId: 'u1' });
    const workingSave = db.users.u1.save;
    db.users.u1.save = async () => { throw new Error('database down'); };

    const failed = await h.verifyPayment('u1', body);
    assert.equal(failed.statusCode, 500);
    assert.equal(db.payments.length, 0, 'no orphaned payment row is left behind');

    db.users.u1.save = workingSave;
    const retry = await h.verifyPayment('u1', body);
    assert.equal(retry.statusCode, 200);
    assert.equal(db.users.u1.subscription, 'planPro');
    assert.equal(db.payments.length, 1);
  });
});

describe('POST /payments/verify-payment — the request cannot lie about what was paid', () => {
  beforeEach(() => {
    h.reset();
    h.makeUser('u1');
  });

  it('ignores isFree: a paid plan cannot be claimed without paying', async () => {
    const withFields = await h.verifyPayment('u1', {
      planId: 'planPro', isFree: true, razorpay_payment_id: 'x', razorpay_order_id: 'y', razorpay_signature: 'z'
    });
    const withoutFields = await h.verifyPayment('u1', { planId: 'planPro', isFree: true });

    assert.equal(withFields.statusCode, 400);
    assert.equal(withoutFields.statusCode, 400);
    assert.equal(db.users.u1.subscription, null);
    assert.equal(db.payments.length, 0);
  });

  it('does not let a custom-priced plan (price stored as 0) be self-activated', async () => {
    const res = await h.verifyPayment('u1', { planId: 'planEnterprise', isFree: true });
    assert.equal(res.statusCode, 400);
    assert.equal(db.users.u1.subscription, null);
  });

  it('rejects a bad signature', async () => {
    const body = h.paidOrder({ orderId: 'order_1', paymentId: 'pay_1', planId: 'planPro', userId: 'u1' });
    const res = await h.verifyPayment('u1', { ...body, razorpay_signature: 'deadbeef' });
    assert.equal(res.statusCode, 400);
    assert.equal(db.payments.length, 0);
  });

  it('rejects missing payment fields', async () => {
    const res = await h.verifyPayment('u1', { planId: 'planPro', razorpay_order_id: 'order_1' });
    assert.equal(res.statusCode, 400);
  });

  it('does not let an order paid for a cheap plan claim an expensive one', async () => {
    const body = h.paidOrder({ orderId: 'order_1', paymentId: 'pay_1', planId: 'planCheap', userId: 'u1', amountRupees: 118 });
    const res = await h.verifyPayment('u1', { ...body, planId: 'planPro' });
    assert.equal(res.statusCode, 400);
    assert.equal(db.users.u1.subscription, null);
    assert.equal(db.payments.length, 0);
  });

  it("does not let one user claim another user's paid order", async () => {
    h.makeUser('victim');
    const body = h.paidOrder({ orderId: 'order_1', paymentId: 'pay_1', planId: 'planPro', userId: 'victim' });
    const res = await h.verifyPayment('u1', body);
    assert.equal(res.statusCode, 400);
    assert.equal(db.users.u1.subscription, null);
  });

  it('refuses a payment id that another account already used', async () => {
    h.makeUser('u2');
    const body = h.paidOrder({ orderId: 'order_1', paymentId: 'pay_1', planId: 'planPro', userId: 'u1' });
    await h.verifyPayment('u1', body);
    const res = await h.verifyPayment('u2', body);
    assert.equal(res.statusCode, 409);
    assert.equal(db.users.u2.subscription, null);
  });

  it('for orders created before checkout notes existed, accepts only the amount the plan costs', async () => {
    const good = h.paidOrder({ orderId: 'order_old1', paymentId: 'pay_old1', planId: 'planPro', userId: 'u1', amountRupees: 1180, notes: {} });
    const accepted = await h.verifyPayment('u1', { ...good, quantity: 1 });
    assert.equal(accepted.statusCode, 200);

    h.makeUser('u2');
    const cheap = h.paidOrder({ orderId: 'order_old2', paymentId: 'pay_old2', planId: 'planPro', userId: 'u2', amountRupees: 118, notes: {} });
    const rejected = await h.verifyPayment('u2', { ...cheap, quantity: 1 });
    assert.equal(rejected.statusCode, 400);
    assert.equal(db.users.u2.subscription, null);
  });

  it('keeps organization plans away from delegated team members', async () => {
    h.makeUser('member', { isTeamManaged: true });
    const body = h.paidOrder({ orderId: 'order_1', paymentId: 'pay_1', planId: 'planOrg', userId: 'member', amountRupees: 2360 });
    const res = await h.verifyPayment('member', body);
    assert.equal(res.statusCode, 403);
    assert.equal(db.payments.length, 0);
  });
});

describe('POST /payments/verify-payment — free plans', () => {
  beforeEach(() => {
    h.reset();
    h.makeUser('u1');
  });

  it('switches to a free plan and records it', async () => {
    const res = await h.verifyPayment('u1', { planId: 'planFree', isFree: true });
    assert.equal(res.statusCode, 200);
    assert.equal(db.users.u1.subscription, 'planFree');
    assert.equal(db.payments.length, 1);
    assert.equal(db.payments[0].amount, 0);
  });

  it('does nothing when the user is already on that free plan (no duplicate row, usage not reset)', async () => {
    await h.verifyPayment('u1', { planId: 'planFree', isFree: true });
    db.users.u1.downloadsUsed = 5;

    const again = await h.verifyPayment('u1', { planId: 'planFree', isFree: true });
    assert.equal(again.body.alreadyProcessed, true);
    assert.equal(db.payments.length, 1);
    assert.equal(db.users.u1.downloadsUsed, 5);
  });
});
