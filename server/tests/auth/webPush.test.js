'use strict';
// Web push: category mapping, quiet hours, per-day cap, mute list, delivery and cleanup of dead devices.
// No database: the two models are stubbed before utils/webPush loads.
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const SRV = path.join(__dirname, '..', '..');
const stub = (rel, exports) => {
  const file = require.resolve(path.join(SRV, rel));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};

// --- fake models -----------------------------------------------------------------------------------
const db = { subs: [], users: {}, deleted: [], updates: [], counters: {} };
const PushSubscription = {
  find: async (q) => db.subs.filter(s => String(s.user) === String(q.user)),
  distinct: async (field, q) => [...new Set(db.subs.filter(s => q.user.$in.map(String).includes(String(s.user))).map(s => String(s.user)))],
  updateOne: async (q, u) => { db.updates.push({ q, u }); const s = db.subs.find(x => x._id === q._id); if (s && u.$inc) s.failures = (s.failures || 0) + u.$inc.failures; if (s && u.$set) Object.assign(s, u.$set); },
  deleteOne: async (q) => { db.deleted.push(q._id); db.subs = db.subs.filter(s => s._id !== q._id); },
};
const User = {
  find: (q) => ({ select: () => ({ lean: async () => q._id.$in.map(id => db.users[String(id)]).filter(Boolean) }) }),
  updateOne: async (q, u) => { const usr = db.users[String(q._id)]; if (usr) { usr.pushPrefs = usr.pushPrefs || {}; usr.pushPrefs.lastJobPushAt = u.$set['pushPrefs.lastJobPushAt']; } },
};
// Atomic counter stand-in with the same semantics as the Mongo upsert in reserveDailySlot:
// the filter matches only count < max; at the cap the upsert becomes a duplicate-key error.
const PushDailyCounter = {
  findOneAndUpdate: async (q, u) => {
    const key = `${q.user}|${q.day}`;
    const row = db.counters[key];
    if (row && !(row.count < q.count.$lt)) { const e = new Error('dup'); e.code = 11000; throw e; }
    db.counters[key] = { count: (row?.count || 0) + 1 };
    return db.counters[key];
  },
  updateOne: async (q, u) => { const row = db.counters[`${q.user}|${q.day}`]; if (row && row.count > 0) row.count += u.$inc.count; },
};
stub('models/PushSubscription', PushSubscription);
stub('models/PushDailyCounter', PushDailyCounter);
stub('models/User', User);

const webPush = require(path.join(SRV, 'utils/webPush'));

// fake web-push library
const sentTo = [];
let failWith = null; // { endpointMatch, statusCode }
webPush._setLibForTests({
  sendNotification: async (sub, payload, opts) => {
    if (failWith && sub.endpoint.includes(failWith.endpointMatch)) { const e = new Error('push failed'); e.statusCode = failWith.statusCode; throw e; }
    sentTo.push({ endpoint: sub.endpoint, payload: JSON.parse(payload), opts });
  }
});

// 11:00 IST on a weekday; 23:30 IST for quiet hours.
const DAY = new Date('2026-11-05T05:30:00Z');   // 11:00 IST
const NIGHT = new Date('2026-11-05T18:00:00Z'); // 23:30 IST
const NEXT_DAY = new Date('2026-11-06T05:30:00Z');

const reset = () => {
  db.subs = [
    { _id: 's1', user: 'u1', endpoint: 'https://push.example/u1-phone', keys: { p256dh: 'p', auth: 'a' }, failures: 0 },
    { _id: 's2', user: 'u1', endpoint: 'https://push.example/u1-laptop', keys: { p256dh: 'p', auth: 'a' }, failures: 0 },
    { _id: 's3', user: 'u2', endpoint: 'https://push.example/u2-phone', keys: { p256dh: 'p', auth: 'a' }, failures: 4 },
  ];
  db.users = { u1: { _id: 'u1', pushPrefs: { mutedCategories: [] } }, u2: { _id: 'u2', pushPrefs: { mutedCategories: ['applications'] } } };
  db.deleted = []; db.updates = []; db.counters = {}; sentTo.length = 0; failWith = null;
  delete process.env.WEB_PUSH_MAX_PER_DAY;
  process.env.WEB_PUSH_VAPID_PUBLIC_KEY = 'pub';
  process.env.WEB_PUSH_VAPID_PRIVATE_KEY = 'priv';
  delete process.env.WEB_PUSH_ENABLED;
};

describe('web push: rules', () => {
  it('maps notification types to the categories a person can mute', () => {
    const c = webPush.categoryOf;
    assert.equal(c('application_received'), 'applications');
    assert.equal(c('application_status_changed'), 'applications');
    assert.equal(c('interview_scheduled'), 'interviews');
    assert.equal(c('mock_interview'), 'interviews');
    assert.equal(c('counselling'), 'interviews');
    assert.equal(c('message'), 'messages');
    assert.equal(c('refund_status'), 'billing');
    assert.equal(c('plan_purchased'), 'billing');
    assert.equal(c('team_removed'), 'team');
    assert.equal(c('company_join_request'), 'team');
    assert.equal(c('job_match'), 'jobs');
    assert.equal(c('job_closed'), 'jobs');
    assert.equal(c('ticket_status'), 'general');
    assert.equal(c(''), 'general');
  });

  it('quiet hours are 21:00 to 08:00 IST', () => {
    assert.equal(webPush.isQuietHour(DAY), false);
    assert.equal(webPush.isQuietHour(NIGHT), true);
    assert.equal(webPush.isQuietHour(new Date('2026-11-05T02:00:00Z')), true);  // 07:30 IST
    assert.equal(webPush.isQuietHour(new Date('2026-11-05T02:30:00Z')), false); // 08:00 IST
    assert.equal(webPush.isQuietHour(new Date('2026-11-05T15:30:00Z')), true);  // 21:00 IST
  });

  it('muted categories, quiet hours (except urgent) and the daily job cap block a push', () => {
    const p = webPush.pickDeliverable;
    assert.equal(p({ category: 'applications', prefs: { mutedCategories: ['applications'] }, now: DAY }).reason, 'muted');
    assert.equal(p({ category: 'applications', prefs: {}, now: NIGHT }).reason, 'quiet_hours');
    assert.equal(p({ category: 'interviews', prefs: {}, now: NIGHT }).ok, true, 'interviews go out at night');
    assert.equal(p({ category: 'messages', prefs: {}, now: NIGHT }).ok, true, 'messages go out at night');
    assert.equal(p({ category: 'jobs', prefs: { lastJobPushAt: DAY }, now: new Date(DAY.getTime() + 3600e3) }).reason, 'daily_cap');
    assert.equal(p({ category: 'jobs', prefs: { lastJobPushAt: DAY }, now: NEXT_DAY }).ok, true);
    assert.equal(p({ category: 'general', prefs: {}, now: DAY }).ok, true);
  });

  it('payload is short, carries the link and a per-type tag', () => {
    const payload = JSON.parse(webPush.buildPayload({ title: 'T'.repeat(100), message: 'M'.repeat(300), link: '/company/applicants/1', type: 'application_received', category: 'applications' }));
    assert.equal(payload.title.length, 60);
    assert.equal(payload.body.length, 140);
    assert.equal(payload.link, '/company/applicants/1');
    assert.equal(payload.tag, 'vv-application_received');
  });
});

describe('web push: sending', () => {
  beforeEach(reset);

  it('is off (and touches nothing) without VAPID keys or when WEB_PUSH_ENABLED=false', async () => {
    delete process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
    assert.equal(webPush.isPushEnabled(), false);
    const r = await webPush.sendPush({ recipientIds: ['u1'], title: 'T', message: 'm', type: 'message', now: DAY });
    assert.deepEqual(r, { sent: 0, skipped: 1 });
    assert.equal(sentTo.length, 0);
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = 'priv';
    process.env.WEB_PUSH_ENABLED = 'false';
    assert.equal(webPush.isPushEnabled(), false);
  });

  it('sends to every device of each recipient and honours the mute list per person', async () => {
    const r = await webPush.sendPush({ recipientIds: ['u1', 'u2', 'u3'], title: 'New application', message: 'Mano applied', link: '/x', type: 'application_received', now: DAY });
    assert.equal(r.sent, 1, 'u2 muted applications, u3 has no device');
    assert.deepEqual(sentTo.map(s => s.endpoint).sort(), ['https://push.example/u1-laptop', 'https://push.example/u1-phone']);
    assert.equal(sentTo[0].payload.title, 'New application');
    assert.equal(sentTo[0].opts.urgency, 'normal');
  });

  it('skips non-urgent pushes at night but still sends interview alerts, marked high urgency', async () => {
    const quiet = await webPush.sendPush({ recipientIds: ['u1'], title: 'T', message: 'm', type: 'job_match', now: NIGHT });
    assert.equal(quiet.sent, 0);
    const urgent = await webPush.sendPush({ recipientIds: ['u1'], title: 'Interview tomorrow', message: 'm', type: 'interview_scheduled', now: NIGHT });
    assert.equal(urgent.sent, 1);
    assert.equal(sentTo[0].opts.urgency, 'high');
  });

  it('sends at most one jobs push per person per day', async () => {
    assert.equal((await webPush.sendPush({ recipientIds: ['u1'], title: 'Jobs', message: 'm', type: 'job_match', now: DAY })).sent, 1);
    assert.equal((await webPush.sendPush({ recipientIds: ['u1'], title: 'Jobs', message: 'm', type: 'job_match', now: new Date(DAY.getTime() + 2 * 3600e3) })).sent, 0);
    assert.equal((await webPush.sendPush({ recipientIds: ['u1'], title: 'Jobs', message: 'm', type: 'job_match', now: NEXT_DAY })).sent, 1);
    // the cap is for jobs only
    assert.equal((await webPush.sendPush({ recipientIds: ['u1'], title: 'Status', message: 'm', type: 'application_status_changed', now: DAY })).sent, 1);
  });

  it('deletes a device the push service reports as gone (410) and counts other failures', async () => {
    failWith = { endpointMatch: 'u1-phone', statusCode: 410 };
    await webPush.sendPush({ recipientIds: ['u1'], title: 'T', message: 'm', type: 'message', now: DAY });
    assert.deepEqual(db.deleted, ['s1']);
    assert.equal(sentTo.length, 1, 'the laptop still got it');

    reset();
    failWith = { endpointMatch: 'u1-phone', statusCode: 500 };
    await webPush.sendPush({ recipientIds: ['u1'], title: 'T', message: 'm', type: 'message', now: DAY });
    assert.deepEqual(db.deleted, []);
    assert.equal(db.subs.find(s => s._id === 's1').failures, 1);

    // the 5th failure in a row removes the row
    reset();
    failWith = { endpointMatch: 'u2-phone', statusCode: 500 };
    await webPush.sendPush({ recipientIds: ['u2'], title: 'T', message: 'm', type: 'message', now: DAY });
    assert.deepEqual(db.deleted, ['s3']);
  });
});

describe('web push: daily cap across all categories', () => {
  beforeEach(reset);
  const send = (type, now = DAY) => webPush.sendPush({ recipientIds: ['u1'], title: 'T', message: 'm', type, now });

  it('defaults to 2 a day and reads WEB_PUSH_MAX_PER_DAY', () => {
    assert.equal(webPush.maxPerDay(), 2);
    process.env.WEB_PUSH_MAX_PER_DAY = '5'; assert.equal(webPush.maxPerDay(), 5);
    process.env.WEB_PUSH_MAX_PER_DAY = '0'; assert.equal(webPush.maxPerDay(), 2);
    process.env.WEB_PUSH_MAX_PER_DAY = 'lots'; assert.equal(webPush.maxPerDay(), 2);
  });

  it('skips the third push of the day, whatever the categories', async () => {
    assert.equal((await send('application_received')).sent, 1);
    assert.equal((await send('refund_status')).sent, 1);
    assert.equal((await send('message')).sent, 0, 'third push skipped');
    assert.equal((await send('team_removed')).sent, 0);
    assert.equal(sentTo.length, 4, 'two pushes to two devices');
  });

  it('the counter starts again at midnight IST, not UTC', async () => {
    await send('application_received'); await send('refund_status');          // 5 Nov: 2 used
    assert.equal((await send('message')).sent, 0);
    assert.equal((await send('message', new Date('2026-11-05T18:29:00Z'))).sent, 0, '23:59 IST is still 5 Nov');
    assert.equal((await send('message', new Date('2026-11-05T19:00:00Z'))).sent, 1, '00:30 IST is 6 Nov: fresh counter');
    assert.equal((await send('message', NEXT_DAY)).sent, 1);                    // 6 Nov: 2 used
    assert.equal((await send('message', NEXT_DAY)).sent, 0);
    assert.equal(db.counters['u1|2026-11-05'].count, 2);
    assert.equal(db.counters['u1|2026-11-06'].count, 2);
  });

  it('concurrent sends cannot exceed the cap', async () => {
    const results = await Promise.all(['application_received', 'refund_status', 'message', 'team_removed', 'ticket_status'].map(t => send(t)));
    assert.equal(results.reduce((n, r) => n + r.sent, 0), 2);
    assert.equal(db.counters['u1|2026-11-05'].count, 2);
  });

  it('interviews bypass the cap but not a mute', async () => {
    await send('application_received'); await send('refund_status');
    assert.equal((await send('interview_scheduled')).sent, 1);
    assert.equal((await send('mock_interview')).sent, 1);
    db.users.u1.pushPrefs.mutedCategories = ['interviews'];
    assert.equal((await send('interview_scheduled')).sent, 0);
  });

  it('gives the slot back when no device accepted the push', async () => {
    failWith = { endpointMatch: 'u1', statusCode: 500 };
    assert.equal((await send('application_received')).sent, 0);
    assert.equal(db.counters['u1|2026-11-05'].count, 0);
    failWith = null;
    assert.equal((await send('refund_status')).sent, 1);
    assert.equal((await send('message')).sent, 1);
  });

  it('a higher WEB_PUSH_MAX_PER_DAY allows more', async () => {
    process.env.WEB_PUSH_MAX_PER_DAY = '3';
    await send('application_received'); await send('refund_status');
    assert.equal((await send('message')).sent, 1);
    assert.equal((await send('team_removed')).sent, 0);
  });
});
