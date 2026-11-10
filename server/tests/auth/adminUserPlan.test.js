'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Admin = require('../../models/Admin');
const Subscription = require('../../models/Subscription');
const notifications = require('../../utils/inAppNotifications');

const sent = [];
notifications.notifyUser = async (n) => { sent.push(n); };
let records;
mongoose.connection.db = { collection: () => ({ insertOne: async (r) => { records.push(r); }, find: () => ({ sort() { return this; }, limit() { return this; }, toArray: async () => records }) }) };

const ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';
let user;
const q = (row) => { const x = { populate() { return x; }, select() { return x; }, then(r, j) { return Promise.resolve(row).then(r, j); } }; return x; };
const mkUser = (over = {}) => ({
  _id: ID, name: 'Sharmi', email: 'sharmi@example.com', role: { name: 'jobseeker' },
  subscriptionDetails: { name: 'Plus', price: 499, duration: 'Monthly', resumeBuilderCount: 3, hasResumeBuilder: true },
  subscriptionExpiry: new Date(Date.now() + 10 * 86400000), messagesUsed: 4, downloadsUsed: 0, saves: 0,
  markModified() {}, async save() { this.saves += 1; }, ...over,
});
User.findById = (id) => (String(id) === ID ? q(user) : q({ email: 'root@x.com' }));
Admin.findById = () => q({ email: 'kamar@x.com' });
Subscription.findOne = async () => ({ toObject: () => ({ name: 'Free', price: 0, duration: 'Lifetime', resumeBuilderCount: 1, hasResumeBuilder: true }) });

const { getUserPlan, updateUserPlan } = require('../../controllers/adminUserPlanController');
const call = async (fn, params, body) => {
  const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  await fn({ params, body, user: { id: 'adminId', role: 'admin' } }, res);
  return res;
};

describe('admin: change one person\'s plan', () => {
  beforeEach(() => { user = mkUser(); records = []; sent.length = 0; });

  it('shows what the person has now and what can be changed', async () => {
    const res = await call(getUserPlan, { id: ID });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.plan.name, 'Plus');
    assert.equal(res.body.hasOwnCopy, true);
    assert.equal(res.body.fields.find((f) => f.key === 'resumeBuilderCount').value, 3);
    assert.equal(res.body.usage.find((u) => u.key === 'messagesUsed').value, 4);
  });

  it('Sharmi\'s example: resume count 3 -> 5 for her alone, saved with who and why, and she is emailed', async () => {
    const res = await call(updateUserPlan, { id: ID }, { changes: { resumeBuilderCount: 5 }, note: 'Asked by support for a one-off extra resume' });
    assert.equal(res.statusCode, 200);
    assert.equal(user.subscriptionDetails.resumeBuilderCount, 5);
    assert.equal(user.subscriptionDetails.price, 499, 'the plan price is not touched');
    assert.equal(user.saves, 1);
    assert.equal(records.length, 1);
    assert.equal(records[0].by, 'kamar@x.com');
    assert.deepEqual(records[0].changes.map((c) => [c.label, c.before, c.after]), [['Resume count', '3', '5']]);
    assert.equal(sent.length, 1);
    assert.equal(String(sent[0].recipientId), ID);
    assert.match(sent[0].emailBody, /Resume count/);
    assert.match(sent[0].emailBody, /3 &rarr; 5/);
  });

  it('extends the end date by days, and resets a usage counter', async () => {
    const before = user.subscriptionExpiry.getTime();
    const res = await call(updateUserPlan, { id: ID }, { extendDays: 30, resetUsage: ['messagesUsed'], note: 'Goodwill extension' });
    assert.equal(res.statusCode, 200);
    assert.equal(Math.round((user.subscriptionExpiry.getTime() - before) / 86400000), 30);
    assert.equal(user.messagesUsed, 0);
    assert.deepEqual(res.body.reset, ['messagesUsed']);
    assert.match(sent[0].emailBody, /Valid until/);
  });

  it('a person with no plan copy gets one made from the Free plan; the Free plan itself is not changed', async () => {
    user = mkUser({ subscriptionDetails: null, subscriptionExpiry: null });
    const res = await call(updateUserPlan, { id: ID }, { changes: { resumeBuilderCount: 4 }, note: 'Extra resumes for a campaign' });
    assert.equal(res.statusCode, 200);
    assert.equal(user.subscriptionDetails.name, 'Free');
    assert.equal(user.subscriptionDetails.resumeBuilderCount, 4);
  });

  it('refuses a missing reason, a bad value, no change, admin accounts, and bad ids (and saves nothing)', async () => {
    assert.equal((await call(updateUserPlan, { id: ID }, { changes: { resumeBuilderCount: 5 }, note: '' })).statusCode, 400);
    assert.equal((await call(updateUserPlan, { id: ID }, { changes: { resumeBuilderCount: -3 }, note: 'reason' })).statusCode, 400);
    assert.equal((await call(updateUserPlan, { id: ID }, { changes: { price: 1 }, note: 'reason' })).statusCode, 400);
    assert.equal((await call(updateUserPlan, { id: ID }, { changes: { resumeBuilderCount: 3 }, note: 'same value' })).statusCode, 400);
    assert.equal((await call(updateUserPlan, { id: 'nope' }, { changes: {}, note: 'reason' })).statusCode, 400);
    user = mkUser({ role: { name: 'admin' } });
    assert.equal((await call(updateUserPlan, { id: ID }, { changes: { resumeBuilderCount: 9 }, note: 'reason' })).statusCode, 400);
    assert.equal(user.saves, 0);
    assert.equal(records.length, 0);
    assert.equal(sent.length, 0);
  });
});
