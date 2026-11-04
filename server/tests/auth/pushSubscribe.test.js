'use strict';
// POST /api/push/subscribe only stores endpoints on known push services (the server POSTs to them).
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const SRV = path.join(__dirname, '..', '..');
const stub = (rel, exports) => {
  const file = require.resolve(path.join(SRV, rel));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};

const saved = [];
class FakeSub { constructor(d) { Object.assign(this, d); } async save() { saved.push(this); } }
const PushSubscription = Object.assign(FakeSub, {
  findOne: async () => null,
  find: () => ({ sort: () => ({ select: async () => [] }) }),
  deleteMany: async () => {},
});
stub('models/PushSubscription', PushSubscription);
stub('models/PushDailyCounter', {});
stub('models/User', {});

const webPush = require(path.join(SRV, 'utils/webPush'));
const controller = require(path.join(SRV, 'controllers/pushController'));

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};
const subscribe = async (endpoint) => {
  const res = makeRes();
  await controller.subscribe({ user: { id: 'u1' }, body: { subscription: { endpoint, keys: { p256dh: 'p', auth: 'a' } } }, get: () => 'UA' }, res);
  return res;
};

describe('push endpoint allowlist', () => {
  beforeEach(() => {
    saved.length = 0;
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY = 'pub';
    process.env.WEB_PUSH_VAPID_PRIVATE_KEY = 'priv';
  });

  it('accepts the known push services', () => {
    for (const ok of [
      'https://fcm.googleapis.com/fcm/send/abc:def',
      'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
      'https://web.push.apple.com/QGxyz',
      'https://db5p.notify.windows.com/w/?token=abc',
      'https://wns2-par02p.notify.windows.com/w/?token=abc',
      'https://api.push.apple.com/3/device/abc',
      'https://FCM.googleapis.com/x',
    ]) assert.equal(webPush.isAllowedEndpoint(ok), true, ok);
  });

  it('rejects any other host, http, look-alikes and junk', () => {
    for (const bad of [
      'https://example.com/hook',
      'https://evil.com/fcm.googleapis.com/',
      'https://fcm.googleapis.com.evil.com/x',
      'https://notify.windows.com/x',            // bare suffix host, not a tenant host
      'https://xpush.apple.com/x',               // not a dotted subdomain
      'http://fcm.googleapis.com/fcm/send/abc',
      'https://user:pw@fcm.googleapis.com/x',
      'ftp://fcm.googleapis.com/x',
      'fcm.googleapis.com/x',
      '', null, undefined, 42, {},
      `https://fcm.googleapis.com/${'a'.repeat(2100)}`,
    ]) assert.equal(webPush.isAllowedEndpoint(bad), false, String(bad));
  });

  it('the subscribe endpoint stores an allowed endpoint and answers 400 for a random https host', async () => {
    assert.equal((await subscribe('https://fcm.googleapis.com/fcm/send/abc')).statusCode, 200);
    assert.equal(saved.length, 1);
    const bad = await subscribe('https://attacker.example/collect');
    assert.equal(bad.statusCode, 400);
    assert.match(bad.body.msg, /known browser push service/);
    assert.equal((await subscribe('http://fcm.googleapis.com/fcm/send/abc')).statusCode, 400);
    assert.equal((await subscribe('https://fcm.googleapis.com.evil.com/x')).statusCode, 400);
    assert.equal(saved.length, 1, 'nothing else stored');
  });

  it('still needs both keys', async () => {
    const res = makeRes();
    await controller.subscribe({ user: { id: 'u1' }, body: { subscription: { endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: '' } } }, get: () => '' }, res);
    assert.equal(res.statusCode, 400);
  });
});
