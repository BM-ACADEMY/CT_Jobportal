'use strict';
// Cancelling a plan tells the admin, and confirms to the person that cancelling does not refund.
const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('../helpers/paymentHarness');
const paymentController = require('../../controllers/paymentController');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const College = require('../../models/College');

const setup = () => {
  h.reset();
  const user = h.makeUser('u1', { role: { name: 'jobseeker' }, name: 'Sharmi', subscription: 'planPro', subscriptionDetails: { name: 'Plus' } });
  User.findById = () => ({ populate: async () => user });
  Subscription.findOne = async () => h.plans.free;
  College.findOne = async () => null;
  Payment.updateMany = async () => {};
  return user;
};
const cancel = async () => {
  const res = h.mockRes();
  await paymentController.cancelSubscription({ user: { id: 'u1' }, io: null }, res);
  await new Promise((r) => setTimeout(r, 20)); // the mails are sent in the background
  return res;
};

test('the admin is told who cancelled which plan, and that no refund was given', async () => {
  setup();
  const res = await cancel();
  assert.equal(res.statusCode, 200);
  const note = h.db.adminNotes.find((n) => n.type === 'plan_cancelled');
  assert.ok(note, 'admin notification sent');
  assert.match(note.title, /Plan cancelled by user/);
  assert.match(note.message, /Sharmi/);
  assert.match(note.message, /Plus/);
  assert.match(note.message, /No refund was given/);
});

test('the person gets a confirmation that says cancelling does not refund and where to ask for a refund', async () => {
  setup();
  await cancel();
  const mail = h.db.inAppNotes.find((n) => n.title === 'Your plan was cancelled');
  assert.ok(mail, 'user notification sent');
  assert.equal(mail.recipientId, 'u1');
  assert.match(mail.emailBody, /does not refund/);
  assert.match(mail.emailBody, /Payment History/);
  assert.match(mail.emailBody, /10 days/);
});

