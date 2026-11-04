'use strict';
// PAYMENTS_ENABLED master switch: while off, nothing paid can be ordered, but free plans still work.
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');
const { paymentsOpen, requirePaymentsOpen } = require('../../utils/paymentsSwitch');

describe('payments master switch', () => {
  beforeEach(() => { h.reset(); h.makeUser('u1'); delete process.env.PAYMENTS_ENABLED; });
  afterEach(() => { process.env.PAYMENTS_ENABLED = 'true'; });

  it('is off unless PAYMENTS_ENABLED is exactly "true"', () => {
    assert.equal(paymentsOpen(), false);
    process.env.PAYMENTS_ENABLED = 'yes'; assert.equal(paymentsOpen(), false);
    process.env.PAYMENTS_ENABLED = 'true'; assert.equal(paymentsOpen(), true);
  });

  it('refuses a paid plan order with 503 and creates nothing at Razorpay', async () => {
    const res = await h.createOrder('u1', { planId: 'planPro' });
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.paymentsEnabled, false);
    assert.match(res.body.msg, /not open yet/);
    assert.equal(h.razorpay.createdOrders.length, 0);
  });

  it('refuses a pay-per add-on order with 503', async () => {
    const res = await h.payPerCreateOrder('u1', { featureId: h.feature._id });
    assert.equal(res.statusCode, 503);
    assert.equal(h.razorpay.createdOrders.length, 0);
  });

  it('still lets a person choose a free plan', async () => {
    const res = await h.verifyPayment('u1', { planId: 'planFree', isFree: true, razorpay_payment_id: 'free_1', razorpay_order_id: 'free_o1', razorpay_signature: 'free' });
    assert.equal(res.statusCode, 200);
    assert.equal(h.db.users.u1.subscription, 'planFree');
  });

  it('middleware form answers 503 when off and passes when on', () => {
    const res = h.mockRes();
    let passed = false;
    requirePaymentsOpen({}, res, () => { passed = true; });
    assert.equal(passed, false);
    assert.equal(res.statusCode, 503);
    process.env.PAYMENTS_ENABLED = 'true';
    requirePaymentsOpen({}, h.mockRes(), () => { passed = true; });
    assert.equal(passed, true);
  });
});
