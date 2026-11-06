'use strict';
// A custom-priced plan (Enterprise: price 0 is only a placeholder) must never be self-serve:
// not through the free-plan path, not through an order, and not by sending isFree.
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');

describe('custom-priced plan (Enterprise) is not self-serve', () => {
  beforeEach(() => { h.reset(); h.makeUser('co'); h.makeUser('rec'); });

  it('a company owner cannot activate it through verify-payment (isFree)', async () => {
    const res = await h.verifyPayment('co', { planId: 'planEnterprise', isFree: true }, 'company');
    assert.equal(res.statusCode, 400);
    assert.match(res.body.msg, /priced on request/i);
    assert.equal(h.db.payments.length, 0);
    assert.equal(h.db.users.co.subscription, null);
  });

  it('it cannot be activated by sending nothing extra either, or by a recruiter', async () => {
    assert.equal((await h.verifyPayment('co', { planId: 'planEnterprise' }, 'company')).statusCode, 400);
    assert.equal((await h.verifyPayment('rec', { planId: 'planEnterprise', isFree: true }, 'recruiter')).statusCode, 400);
    assert.equal(h.db.users.rec.subscription, null);
  });

  it('no Razorpay order can be created for it', async () => {
    const res = await h.createOrder('co', { planId: 'planEnterprise' }, 'company');
    assert.equal(res.statusCode, 400);
    assert.equal(h.razorpay.createdOrders.length, 0);
  });

  it('the normal free company plan still activates', async () => {
    assert.equal((await h.verifyPayment('co', { planId: 'planOrgFree', isFree: true }, 'company')).statusCode, 200);
  });
});
