'use strict';
// Payments are ON but recurring (college and company) plans are CLOSED: only job seeker and recruiter plans can be bought.
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');

describe('payments on, recurring plans closed', () => {
  beforeEach(() => { h.reset(); h.makeUser('u1'); h.makeUser('rec'); h.makeUser('co'); h.makeUser('tpo'); delete process.env.RECURRING_PLANS_ENABLED; });
  afterEach(() => { process.env.RECURRING_PLANS_ENABLED = 'true'; });

  it('a job seeker plan and a recruiter plan can be ordered', async () => {
    assert.equal((await h.createOrder('u1', { planId: 'planPro' })).statusCode, 200);
    assert.equal((await h.createOrder('rec', { planId: 'planRecruiter' }, 'recruiter')).statusCode, 200);
    assert.equal(h.razorpay.createdOrders.length, 2);
  });

  it('a company plan cannot be bought, even as a one-time order sent straight to the API', async () => {
    for (const [user, role] of [['co', 'company'], ['rec', 'recruiter']]) {
      const res = await h.createOrder(user, { planId: 'planOrg' }, role);
      assert.equal(res.statusCode, 503);
      assert.equal(res.body.msg, 'Recurring plans open soon');
    }
    assert.equal(h.razorpay.createdOrders.length, 0);
  });

  it('a college plan cannot be ordered either, and the subscription route stays closed', async () => {
    assert.equal((await h.createOrder('tpo', { planId: 'planCampus' }, 'college')).statusCode, 503);
    assert.equal((await h.createSubscriptionOrder('tpo', { planId: 'planCampus' }, 'college')).statusCode, 503);
    assert.equal(h.razorpay.createdOrders.length + h.razorpay.createdSubscriptions.length, 0);
  });

  it('with the recurring switch on, company plans can be ordered again', async () => {
    process.env.RECURRING_PLANS_ENABLED = 'true';
    assert.equal((await h.createOrder('co', { planId: 'planOrg' }, 'company')).statusCode, 200);
  });
});
