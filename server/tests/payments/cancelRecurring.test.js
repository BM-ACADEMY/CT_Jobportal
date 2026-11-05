'use strict';
// Cancelling a recurring college or company plan must also cancel the Razorpay mandate.
const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');
const { isAlreadyStopped } = require('../../utils/cancelRecurring');
const paymentController = require('../../controllers/paymentController');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const College = require('../../models/College');
const Company = require('../../models/Company');

let paymentUpdates;
let college;
let company;
const setup = ({ withCollege = true, withCompany = false } = {}) => {
  h.reset();
  paymentUpdates = 0;
  const user = h.makeUser('tpo', { role: { name: 'college' }, company: withCompany ? 'comp1' : undefined, subscription: 'planCampus', subscriptionDetails: { name: 'Campus Pro' } });
  college = withCollege ? {
    _id: 'college1', tpoUser: 'tpo', razorpaySubscriptionId: 'sub_RZP1', autoRenewEnabled: true, nextRenewalDate: new Date(), async save() { h.db.saves += 1; },
  } : null;
  company = withCompany ? { _id: 'comp1', razorpaySubscriptionId: 'sub_RZP2', autoRenewEnabled: true, nextRenewalDate: new Date(), async save() { h.db.saves += 1; } } : null;
  User.findById = () => ({ populate: async () => user });
  Subscription.findOne = async () => h.plans.free;
  College.findOne = async () => college;
  Company.findById = async () => company;
  Payment.updateMany = async () => { paymentUpdates += 1; };
  return user;
};
const cancel = async () => {
  const res = h.mockRes();
  await paymentController.cancelSubscription({ user: { id: 'tpo' } }, res);
  return res;
};

test('cancelling a college plan cancels the Razorpay mandate and clears it on the college', async () => {
  setup();
  const res = await cancel();
  assert.equal(res.statusCode, 200);
  assert.deepEqual(h.razorpay.cancelledSubscriptions, [{ id: 'sub_RZP1', atCycleEnd: false }]);
  assert.equal(college.razorpaySubscriptionId, '');
  assert.equal(college.autoRenewEnabled, false);
  assert.equal(college.nextRenewalDate, null);
  assert.equal(paymentUpdates, 1, 'the plan is downgraded as before');
});

test('cancelling a company plan cancels its mandate too', async () => {
  setup({ withCollege: false, withCompany: true });
  const res = await cancel();
  assert.equal(res.statusCode, 200);
  assert.deepEqual(h.razorpay.cancelledSubscriptions.map(c => c.id), ['sub_RZP2']);
  assert.equal(company.razorpaySubscriptionId, '');
  assert.equal(company.autoRenewEnabled, false);
});

test('if Razorpay refuses, nothing changes and the user is told (no plan change, mandate kept on our side)', async () => {
  setup();
  h.razorpay.cancelError = { error: { description: 'The subscription cannot be cancelled right now' } };
  const res = await cancel();
  assert.equal(res.statusCode, 502);
  assert.match(res.body.msg, /could not cancel the automatic payment/i);
  assert.match(res.body.msg, /plan was not changed/i);
  assert.equal(college.razorpaySubscriptionId, 'sub_RZP1');
  assert.equal(college.autoRenewEnabled, true);
  assert.equal(paymentUpdates, 0, 'payments are not marked cancelled');
});

test('a mandate Razorpay already cancelled does not block cancelling the plan', async () => {
  setup();
  h.razorpay.cancelError = { error: { description: 'Subscription is already cancelled' } };
  const res = await cancel();
  assert.equal(res.statusCode, 200);
  assert.equal(college.razorpaySubscriptionId, '');
});

test('a one-time plan (no mandate) never calls Razorpay', async () => {
  setup({ withCollege: false });
  const res = await cancel();
  assert.equal(res.statusCode, 200);
  assert.equal(h.razorpay.cancelledSubscriptions.length, 0);
});

test('isAlreadyStopped recognises Razorpay wording but not other errors', () => {
  assert.ok(isAlreadyStopped({ error: { description: 'Subscription is already cancelled' } }));
  assert.ok(isAlreadyStopped({ error: { description: 'Subscription cannot be cancelled in completed status' } }));
  assert.ok(!isAlreadyStopped({ error: { description: 'Authentication failed' } }));
  assert.ok(!isAlreadyStopped({ statusCode: 500 }));
});
