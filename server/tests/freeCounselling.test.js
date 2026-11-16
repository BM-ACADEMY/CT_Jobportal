const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const path = require('path');

const inert = () => new Proxy(function () {}, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : inert()),
  apply: () => inert(), construct: () => inert(),
});
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  try { return realLoad.call(this, request, ...rest); }
  catch (err) { if (err.code === 'MODULE_NOT_FOUND' && !request.startsWith('.')) return inert(); throw err; }
};
const stubAt = (rel, exports) => {
  const file = require.resolve(path.join(__dirname, '..', rel));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};

const { allowedFree, freeLeft } = require('../utils/freeCounselling');

test('one free session by default; the setting changes it; junk falls back to one; capped at five', () => {
  assert.equal(allowedFree({}), 1);
  assert.equal(allowedFree({ COUNSELLING_FREE_SESSIONS: '0' }), 0);
  assert.equal(allowedFree({ COUNSELLING_FREE_SESSIONS: '2' }), 2);
  assert.equal(allowedFree({ COUNSELLING_FREE_SESSIONS: 'abc' }), 1);
  assert.equal(allowedFree({ COUNSELLING_FREE_SESSIONS: '99' }), 5);
  assert.equal(allowedFree({ COUNSELLING_FREE_SESSIONS: '-3' }), 0);
});

test('free sessions left drop as requests are booked', () => {
  assert.equal(freeLeft(0, {}), 1);
  assert.equal(freeLeft(1, {}), 0);
  assert.equal(freeLeft(7, {}), 0);
  assert.equal(freeLeft(1, { COUNSELLING_FREE_SESSIONS: '2' }), 1);
  assert.equal(freeLeft(undefined, {}), 1);
});

// ── booking through the controller ──
let user; let priorCount = 0; const saved = [];
stubAt('models/User', { findById: () => ({ populate: async () => user }) });
class FakeRequest { constructor(d) { Object.assign(this, d); this._id = 'r1'; } async save() { saved.push(this); } }
FakeRequest.countDocuments = async () => priorCount;
stubAt('models/AdminRequest', FakeRequest);
stubAt('models/Role', {});
stubAt('middlewares/staffPermission', { staffMayTouchRequestType: () => true, staffRequestTypeFilter: () => ({}) });
stubAt('utils/inAppNotifications', { notifyUser: async () => {}, notifyRoles: async () => {}, notifyUsers: async () => {} });
const { submitCounsellingRequest } = require('../controllers/requestController');

const body = { bookingName: 'Asha', bookingEmail: 'a@x.in', bookingDate: '2026-11-20', bookingTime: '10:00', qualification: 'BE', major: 'CSE', workExperience: 'Fresher' };
const run = async () => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await submitCounsellingRequest({ user: { id: 'u1' }, body, io: null }, res);
  return res;
};
const freshUser = () => ({ _id: 'u1', name: 'Asha', subscription: null, purchasedFeatures: [], counsellingSessionsUsed: 0, markModified() {}, async save() {} });

test('a free-plan job seeker with no earlier request can book their first session', async () => {
  saved.length = 0; priorCount = 0; user = freshUser();
  const res = await run();
  assert.equal(res.code, 201);
  assert.equal(saved.length, 1);
  assert.equal(user.counsellingSessionsUsed, 0, 'the free session does not touch plan counters');
});

test('the second request on a free plan is refused', async () => {
  saved.length = 0; priorCount = 1; user = freshUser();
  const res = await run();
  assert.equal(res.code, 403);
  assert.equal(saved.length, 0);
});

test('a purchased pay-per session is used before the free one, and still deducted', async () => {
  saved.length = 0; priorCount = 0;
  user = freshUser();
  user.purchasedFeatures = [{ isActive: true, featureKey: 'hasCareerCounselling', usageLeft: 2 }];
  const res = await run();
  assert.equal(res.code, 201);
  assert.equal(user.purchasedFeatures[0].usageLeft, 1);
});

test('with the setting at 0 nobody gets a free session', async () => {
  saved.length = 0; priorCount = 0; user = freshUser();
  process.env.COUNSELLING_FREE_SESSIONS = '0';
  const res = await run();
  delete process.env.COUNSELLING_FREE_SESSIONS;
  assert.equal(res.code, 403);
});
