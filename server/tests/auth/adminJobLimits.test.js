'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Role = require('../../models/Role');
const Admin = require('../../models/Admin');
const Job = require('../../models/Job');
const Subscription = require('../../models/Subscription');

let users, records;
const q = (rows) => { const x = { populate() { return x; }, select() { return x; }, sort() { return x; }, skip() { return x; }, limit() { return x; }, then(r, j) { return Promise.resolve(rows).then(r, j); } }; return x; };
const mkUser = (id, role, extra = {}) => ({ _id: id, name: id, email: `${id}@x.com`, role: { name: role }, subscription: null, purchasedFeatures: [], saves: 0, async save() { this.saves += 1; }, ...extra });
Role.find = () => q([{ _id: 'r1' }]);
User.find = (f) => q(f._id ? users.filter((u) => f._id.$in.map(String).includes(String(u._id))) : users);
User.findById = () => q({ email: 'root@x.com' });
User.countDocuments = async () => users.length;
Admin.findById = () => q({ email: 'kamar@x.com' });
Job.countDocuments = async () => 3;
Subscription.findOne = async () => ({ activeJobPostings: 2 }); // the Free plan allows 2
mongoose.connection.db = { collection: () => ({ insertMany: async (r) => { records.push(...r); } }) };

const { listJobLimits, grantJobLimits } = require('../../controllers/adminJobLimitController');
const call = async (fn, body = {}, query = {}) => {
  const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  await fn({ body, query, user: { id: 'adminId', role: 'admin' } }, res);
  return res;
};
const valid = { limit: 150, days: 365, note: 'CoreTalents, about 150 openings' };

describe('admin job limits', () => {
  beforeEach(() => { records = []; users = [mkUser('aaaaaaaaaaaaaaaaaaaaaaaa', 'recruiter'), mkUser('bbbbbbbbbbbbbbbbbbbbbbbb', 'company'), mkUser('cccccccccccccccccccccccc', 'jobseeker')]; });

  it('raises the chosen accounts to the total, records who asked, and leaves the others alone', async () => {
    const res = await call(grantJobLimits, { userIds: ['aaaaaaaaaaaaaaaaaaaaaaaa'], ...valid });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.raised, 1);
    assert.equal(users[0].purchasedFeatures[0].usageLeft, 148, 'free plan 2 + 148 = 150');
    assert.equal(users[1].purchasedFeatures.length, 0);
    assert.equal(records.length, 1);
    assert.equal(records[0].requestedBy, 'kamar@x.com');
    assert.equal(records[0].note, valid.note);
  });

  it('is safe to repeat: an account that already allows that many is not raised again', async () => {
    await call(grantJobLimits, { userIds: ['aaaaaaaaaaaaaaaaaaaaaaaa'], ...valid });
    const again = await call(grantJobLimits, { userIds: ['aaaaaaaaaaaaaaaaaaaaaaaa'], ...valid });
    assert.equal(again.body.alreadyEnough, 1);
    assert.equal(users[0].purchasedFeatures.length, 1);
  });

  it('"all employers" needs the confirm word and skips job seekers', async () => {
    assert.equal((await call(grantJobLimits, { allEmployers: true, ...valid })).statusCode, 400);
    const res = await call(grantJobLimits, { allEmployers: true, confirm: 'ALL', ...valid });
    assert.equal(res.body.raised, 2);
    assert.equal(res.body.skipped, 1, 'the job seeker');
    assert.equal(users[2].purchasedFeatures.length, 0);
  });

  it('refuses a missing note, a silly limit, no accounts, and a bad id', async () => {
    assert.equal((await call(grantJobLimits, { userIds: ['aaaaaaaaaaaaaaaaaaaaaaaa'], limit: 150, note: '' })).statusCode, 400);
    assert.equal((await call(grantJobLimits, { userIds: ['aaaaaaaaaaaaaaaaaaaaaaaa'], ...valid, limit: 5000 })).statusCode, 400);
    assert.equal((await call(grantJobLimits, { userIds: [], ...valid })).statusCode, 400);
    assert.equal((await call(grantJobLimits, { userIds: ['not-an-id'], ...valid })).statusCode, 400);
    assert.equal(records.length, 0);
  });

  it('lists employer accounts with plan limit, extra and active jobs', async () => {
    const res = await call(listJobLimits);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.users.length, 3);
    assert.deepEqual([res.body.users[0].planLimit, res.body.users[0].extra, res.body.users[0].total, res.body.users[0].activeJobs], [2, 0, 2, 3]);
  });
});
