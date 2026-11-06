'use strict';
// A plan can only be bought or activated by the account type it is for.
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');
const { planRoleMatches, PLAN_ROLES_FOR } = require('../../utils/paymentFulfillment');

describe('plan / account type match', () => {
  beforeEach(() => { h.reset(); h.makeUser('u1'); h.makeUser('rec'); h.makeUser('co'); h.makeUser('tpo'); });

  it('the matrix', () => {
    assert.deepEqual(PLAN_ROLES_FOR, { jobseeker: ['jobseeker'], recruiter: ['recruiter', 'company'], company: ['recruiter', 'company'], college: ['college'], org_employee: [] });
    assert.equal(planRoleMatches('admin', { role: 'jobseeker' }), false);
    assert.equal(planRoleMatches(undefined, { role: 'jobseeker' }), false);
  });

  it('a candidate cannot buy a company plan', async () => {
    const res = await h.createOrder('u1', { planId: 'planOrg' });
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.msg, 'This plan is for a different type of account.');
    assert.equal(h.razorpay.createdOrders.length, 0);
  });

  it('a candidate cannot activate a company free plan through verify-payment', async () => {
    const res = await h.verifyPayment('u1', { planId: 'planOrgFree', isFree: true });
    assert.equal(res.statusCode, 403);
    assert.equal(h.db.payments.length, 0);
    assert.equal(h.db.users.u1.subscription, null);
    // their own free plan still works
    assert.equal((await h.verifyPayment('u1', { planId: 'planFree', isFree: true })).statusCode, 200);
  });

  it('a recruiter may buy a company plan (and a recruiter plan); a company owner too', async () => {
    const order = await h.createOrder('rec', { planId: 'planOrg' }, 'recruiter');
    assert.equal(order.statusCode, 200);
    assert.equal(h.razorpay.createdOrders.length, 1);
    assert.equal((await h.createOrder('rec', { planId: 'planRecruiter' }, 'recruiter')).statusCode, 200);
    assert.equal((await h.createOrder('co', { planId: 'planOrg' }, 'company')).statusCode, 200);
    const body = h.paidOrder({ orderId: order.body.orderId, paymentId: 'pay_rec', planId: 'planOrg', userId: 'rec', amountRupees: 2360 });
    const verified = await h.verifyPayment('rec', body, 'recruiter');
    assert.equal(verified.statusCode, 200);
    assert.equal(h.db.users.rec.subscription, 'planOrg');
  });

  it('a college can only use college plans; recruiters and companies cannot buy candidate plans', async () => {
    assert.equal((await h.createOrder('tpo', { planId: 'planPro' }, 'college')).statusCode, 403);
    assert.equal((await h.createOrder('rec', { planId: 'planPro' }, 'recruiter')).statusCode, 403);
    assert.equal((await h.createOrder('co', { planId: 'planCheap' }, 'company')).statusCode, 403);
    assert.equal((await h.verifyPayment('tpo', { planId: 'planFree', isFree: true }, 'college')).statusCode, 403);
    process.env.RECURRING_PLANS_ENABLED = 'true';
    assert.equal((await h.createSubscriptionOrder('u1', { planId: 'planCampus' }, 'jobseeker')).statusCode, 403);
    delete process.env.RECURRING_PLANS_ENABLED;
    assert.equal(h.razorpay.createdOrders.length, 0);
  });

  it('an org employee cannot buy any plan', async () => {
    for (const planId of ['planPro', 'planRecruiter', 'planOrg']) {
      const res = await h.createOrder('u1', { planId }, 'org_employee');
      assert.equal(res.statusCode, 403, planId);
      assert.match(res.body.msg, /Team member accounts cannot buy plans|organization admin/);
    }
    assert.equal((await h.verifyPayment('u1', { planId: 'planFree', isFree: true }, 'org_employee')).statusCode, 403);
  });
});

describe('auto-renew is only ever recorded for plans that really renew', () => {
  beforeEach(() => { h.reset(); h.makeUser('u1'); h.makeUser('co'); });

  it('a job seeker plan is never recorded as auto-renew, even if the browser sends autoRenew: true', async () => {
    const order = await h.createOrder('u1', { planId: 'planPro' });
    const body = h.paidOrder({ orderId: order.body.orderId, paymentId: 'pay_ar1', planId: 'planPro', userId: 'u1', amountRupees: 1180 });
    const res = await h.verifyPayment('u1', { ...body, autoRenew: true });
    assert.equal(res.statusCode, 200);
    assert.equal(h.db.users.u1.autoRenew, false);
    assert.equal(h.razorpay.createdSubscriptions.length, 0, 'no Razorpay mandate for a one-time plan');
  });
});
