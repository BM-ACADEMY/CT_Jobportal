'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');

const { db } = h;

describe('POST /pay-per/purchase/create-order', () => {
  beforeEach(() => {
    h.reset();
    h.makeUser('u1');
  });

  it('charges the feature price plus GST and records the order details', async () => {
    const res = await h.payPerCreateOrder('u1', { featureId: 'featBoost', quantity: 2 });
    assert.equal(res.statusCode, 200);
    assert.equal(h.razorpay.createdOrders[0].amount, 23600); // 2 x 100 + 18% GST
    assert.deepEqual(h.razorpay.createdOrders[0].notes, { userId: 'u1', featureId: 'featBoost', quantity: '2', couponCode: '' });
  });

  it('rejects unknown features', async () => {
    assert.equal((await h.payPerCreateOrder('u1', {})).statusCode, 400);
    assert.equal((await h.payPerCreateOrder('u1', { featureId: 'missing' })).statusCode, 404);
  });
});

describe('POST /pay-per/purchase/verify — credits are granted exactly once', () => {
  beforeEach(() => {
    h.reset();
    h.makeUser('u1');
  });

  it('grants the credits and records the payment', async () => {
    const body = h.paidFeatureOrder({ orderId: 'order_1', paymentId: 'pay_1', userId: 'u1', quantity: 2, amountRupees: 236 });
    const res = await h.payPerVerify('u1', body);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(db.users.u1.purchasedFeatures.length, 1);
    assert.equal(db.users.u1.purchasedFeatures[0].usageLeft, 10); // 5 uses x 2
    assert.equal(db.payments.length, 1);
    assert.equal(db.payments[0].paymentType, 'pay-per-feature');
    assert.equal(db.payments[0].amount, 236);
  });

  it('does not add the credits again when the same payment is verified twice', async () => {
    const body = h.paidFeatureOrder({ orderId: 'order_1', paymentId: 'pay_1', userId: 'u1' });
    await h.payPerVerify('u1', body);
    const replay = await h.payPerVerify('u1', body);

    assert.equal(replay.statusCode, 200);
    assert.equal(replay.body.alreadyProcessed, true);
    assert.equal(db.users.u1.purchasedFeatures.length, 1);
    assert.equal(db.payments.length, 1);
  });

  it('grants once when five verify requests arrive together', async () => {
    const body = h.paidFeatureOrder({ orderId: 'order_1', paymentId: 'pay_1', userId: 'u1' });
    const results = await Promise.all(Array.from({ length: 5 }, () => h.payPerVerify('u1', body)));

    assert.ok(results.every(r => r.statusCode === 200 && r.body.success));
    assert.equal(db.users.u1.purchasedFeatures.length, 1);
    assert.equal(db.payments.length, 1);
  });

  it('does not let an order paid for a cheap feature claim an expensive one', async () => {
    const body = h.paidFeatureOrder({ orderId: 'order_1', paymentId: 'pay_1', userId: 'u1' });
    const res = await h.payPerVerify('u1', { ...body, featureId: 'featPremium' });
    assert.equal(res.statusCode, 400);
    assert.equal(db.users.u1.purchasedFeatures.length, 0);
    assert.equal(db.payments.length, 0);
  });

  it("does not let one user claim another user's paid order", async () => {
    h.makeUser('victim');
    const body = h.paidFeatureOrder({ orderId: 'order_1', paymentId: 'pay_1', userId: 'victim' });
    const res = await h.payPerVerify('u1', body);
    assert.equal(res.statusCode, 400);
    assert.equal(db.users.u1.purchasedFeatures.length, 0);
  });

  it('refuses a payment id another account already used', async () => {
    h.makeUser('u2');
    const body = h.paidFeatureOrder({ orderId: 'order_1', paymentId: 'pay_1', userId: 'u1' });
    await h.payPerVerify('u1', body);
    const res = await h.payPerVerify('u2', body);
    assert.equal(res.statusCode, 409);
    assert.equal(db.users.u2.purchasedFeatures.length, 0);
  });

  it('rejects a bad signature and missing fields', async () => {
    const body = h.paidFeatureOrder({ orderId: 'order_1', paymentId: 'pay_1', userId: 'u1' });
    assert.equal((await h.payPerVerify('u1', { ...body, razorpay_signature: 'deadbeef' })).statusCode, 400);
    assert.equal((await h.payPerVerify('u1', { featureId: 'featBoost' })).statusCode, 400);
    assert.equal(db.payments.length, 0);
  });

  it('for orders created before checkout notes existed, accepts only the amount the feature costs', async () => {
    h.razorpay.orders.order_old = { id: 'order_old', amount: 1000, notes: {} };
    const cheap = await h.payPerVerify('u1', {
      razorpay_order_id: 'order_old', razorpay_payment_id: 'pay_old', razorpay_signature: h.sign('order_old', 'pay_old'),
      featureId: 'featBoost', quantity: 1
    });
    assert.equal(cheap.statusCode, 400);
    assert.equal(db.users.u1.purchasedFeatures.length, 0);
  });

  it('releases the payment if the credits cannot be granted, so a retry succeeds', async () => {
    const body = h.paidFeatureOrder({ orderId: 'order_1', paymentId: 'pay_1', userId: 'u1' });
    const workingSave = db.users.u1.save;
    db.users.u1.save = async () => { throw new Error('database down'); };

    const failed = await h.payPerVerify('u1', body);
    assert.equal(failed.statusCode, 500);
    assert.equal(db.payments.length, 0);

    db.users.u1.save = workingSave;
    db.users.u1.purchasedFeatures.length = 0; // the failed attempt pushed the credit in memory before save threw
    const retry = await h.payPerVerify('u1', body);
    assert.equal(retry.statusCode, 200);
    assert.equal(db.users.u1.purchasedFeatures.length, 1);
    assert.equal(db.payments.length, 1);
  });
});
