'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');

describe('POST /payments/create-order', () => {
  beforeEach(() => {
    h.reset();
    h.makeUser('u1');
  });

  it('charges the plan price plus GST, in paise', async () => {
    const res = await h.createOrder('u1', { planId: 'planPro' });
    assert.equal(res.statusCode, 200);
    assert.equal(h.razorpay.createdOrders[0].amount, 118000); // 1000 + 18% GST
    assert.equal(res.body.totalAmount, 1180);
  });

  it('records who the order is for on the Razorpay order, so verify can trust it later', async () => {
    await h.createOrder('u1', { planId: 'planPro', quantity: 1 });
    assert.deepEqual(h.razorpay.createdOrders[0].notes, { userId: 'u1', planId: 'planPro', quantity: '1', couponCode: '' });
  });

  it('applies a valid coupon and records it on the order', async () => {
    const res = await h.createOrder('u1', { planId: 'planPro', couponCode: 'save10' });
    assert.equal(h.razorpay.createdOrders[0].amount, 106200); // (1000 - 10%) + 18% GST
    assert.equal(h.razorpay.createdOrders[0].notes.couponCode, 'SAVE10');
    assert.equal(res.body.discountPercentage, 10);
  });

  it('ignores an unknown coupon', async () => {
    await h.createOrder('u1', { planId: 'planPro', couponCode: 'NOPE' });
    assert.equal(h.razorpay.createdOrders[0].amount, 118000);
    assert.equal(h.razorpay.createdOrders[0].notes.couponCode, '');
  });

  it('prices several billing periods with the volume discount', async () => {
    await h.createOrder('u1', { planId: 'planPro', quantity: 3 });
    assert.equal(h.razorpay.createdOrders[0].amount, 336300); // 3000 - 5%, + 18% GST
    assert.equal(h.razorpay.createdOrders[0].notes.quantity, '3');
  });

  it('refuses to create an order for a free plan', async () => {
    const res = await h.createOrder('u1', { planId: 'planFree' });
    assert.equal(res.statusCode, 400);
    assert.equal(h.razorpay.createdOrders.length, 0);
  });

  it('requires a planId and a real plan', async () => {
    assert.equal((await h.createOrder('u1', {})).statusCode, 400);
    assert.equal((await h.createOrder('u1', { planId: 'missing' })).statusCode, 404);
  });

  it('stops an org employee ordering the organization plan before any money is taken', async () => {
    const res = await h.createOrder('u1', { planId: 'planOrg' }, 'org_employee');
    assert.equal(res.statusCode, 403);
    assert.equal(h.razorpay.createdOrders.length, 0);
  });
});
