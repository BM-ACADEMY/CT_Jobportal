// Web push (browser and installed-app notifications). OFF until VAPID keys are set in the environment.
//
// How it fits in: every in-app notification goes through utils/inAppNotifications.notifyUsers, which
// calls sendPush() here after saving the Notification row. So anything that already shows in the bell
// (new applicant, status change, interview, refund, team invite, ...) can also arrive as a push, without
// each call site knowing about push. The person decides per device (subscribe/unsubscribe) and per
// category (mute list in user.pushPrefs). Rules:
//   - no push during quiet hours (21:00 to 08:00 IST) except interviews and messages; the in-app
//     notification and email still go out at once, only the push is dropped (not queued or replayed
//     at 08:00: the person already has the bell and the mail, a replay would be a stale duplicate);
//   - at most WEB_PUSH_MAX_PER_DAY pushes (default 2) per person per IST day across all categories,
//     reserved with an atomic counter so simultaneous notifications cannot both slip through;
//     interviews are exempt from the cap (mutes still apply);
//   - on top of that, at most one "jobs" push per person per day;
//   - a subscription the push service reports as gone (404/410) is deleted; other failures are counted
//     and the row is dropped after MAX_FAILURES in a row.
// Pure helpers (categoryOf, isQuietHour, pickDeliverable) are exported for tests.

const PushSubscription = require('../models/PushSubscription');
const PushDailyCounter = require('../models/PushDailyCounter');
const User = require('../models/User');

const MAX_FAILURES = 5;
const QUIET_START = 21; // 9 pm IST
const QUIET_END = 8;    // 8 am IST
const TIME_ZONE = 'Asia/Kolkata';

// Categories a person can mute in Settings. Keep labels in client/src/components/notifications/PushSettings.jsx in step.
const CATEGORIES = ['jobs', 'applications', 'interviews', 'messages', 'billing', 'team', 'general'];
// These are time-sensitive, so they are pushed even in quiet hours.
const URGENT_CATEGORIES = new Set(['interviews', 'messages']);
// Exempt from the per-day cap (a reminder for today's interview must never be the one that is dropped).
const CAP_EXEMPT_CATEGORIES = new Set(['interviews']);

const DEFAULT_MAX_PER_DAY = 2;
const maxPerDay = () => {
  const n = Number(process.env.WEB_PUSH_MAX_PER_DAY);
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_MAX_PER_DAY;
};

// The only hosts a browser subscription endpoint may point at. The server POSTs to the endpoint, so
// accepting any URL would let a signed-in person make the server call an address of their choosing.
// Exact hosts, plus the suffixes Windows (per-tenant hosts) and Apple use.
const PUSH_ENDPOINT_HOSTS = Object.freeze({
  exact: ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'],
  suffixes: ['.notify.windows.com', '.push.apple.com']
});

// true only for https URLs whose host is one of the known push services (no look-alikes:
// "fcm.googleapis.com.evil.com" is rejected because the match is on the whole host).
const isAllowedEndpoint = (endpoint) => {
  if (typeof endpoint !== 'string' || endpoint.length > 2048) return false;
  let url;
  try { url = new URL(endpoint); } catch { return false; }
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return PUSH_ENDPOINT_HOSTS.exact.includes(host) || PUSH_ENDPOINT_HOSTS.suffixes.some((s) => host.endsWith(s) && host.length > s.length);
};

const config = () => {
  const publicKey = (process.env.WEB_PUSH_VAPID_PUBLIC_KEY || '').trim();
  const privateKey = (process.env.WEB_PUSH_VAPID_PRIVATE_KEY || '').trim();
  const subject = (process.env.WEB_PUSH_SUBJECT || 'mailto:hello@velaivaaipu.in').trim();
  const enabled = process.env.WEB_PUSH_ENABLED !== 'false' && !!publicKey && !!privateKey;
  return { enabled, publicKey, privateKey, subject };
};

const isPushEnabled = () => config().enabled;
const publicKey = () => config().publicKey;

let webPushLib = null;
const lib = () => {
  if (webPushLib) return webPushLib;
  const { publicKey: pub, privateKey, subject } = config();
  // eslint-disable-next-line global-require
  webPushLib = require('web-push');
  webPushLib.setVapidDetails(subject, pub, privateKey);
  return webPushLib;
};

// Map a Notification.type (free text chosen by each caller) to a mutable category.
const categoryOf = (type = '') => {
  const t = String(type).toLowerCase();
  if (/interview|counselling|mock_/.test(t)) return 'interviews';
  if (/^message/.test(t)) return 'messages';
  if (/application|applicant|student_activated/.test(t)) return 'applications';
  if (/refund|payment|plan_|renewal|subscription|invoice|seat/.test(t)) return 'billing';
  if (/team|company_join|company_invite|invite/.test(t)) return 'team';
  if (/job/.test(t)) return 'jobs';
  return 'general';
};

const hourInIst = (now = new Date()) =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: 'numeric', hour12: false }).format(now)) % 24;

const isQuietHour = (now = new Date()) => {
  const h = hourInIst(now);
  return h >= QUIET_START || h < QUIET_END;
};

const dayKeyIst = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

// Decide, for one recipient, whether this notification may be pushed right now.
// prefs = { mutedCategories: [...], lastJobPushAt }
const pickDeliverable = ({ category, prefs = {}, now = new Date() }) => {
  if ((prefs.mutedCategories || []).includes(category)) return { ok: false, reason: 'muted' };
  if (isQuietHour(now) && !URGENT_CATEGORIES.has(category)) return { ok: false, reason: 'quiet_hours' };
  if (category === 'jobs' && prefs.lastJobPushAt && dayKeyIst(new Date(prefs.lastJobPushAt)) === dayKeyIst(now)) {
    return { ok: false, reason: 'daily_cap' };
  }
  return { ok: true };
};

// Atomically takes one of today's slots for this person. Returns false when the cap is reached.
// The filter only matches a row with count < max; when the row exists at the cap the upsert tries to
// insert a duplicate (user, day) and fails with 11000, which is the "no slot" answer. Two concurrent
// calls therefore cannot both succeed on the last slot.
const reserveDailySlot = async (userId, now = new Date(), max = maxPerDay()) => {
  const day = dayKeyIst(now);
  try {
    const row = await PushDailyCounter.findOneAndUpdate(
      { user: userId, day, count: { $lt: max } },
      { $inc: { count: 1 }, $setOnInsert: { user: userId, day, expiresAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000) } },
      { upsert: true, new: true }
    );
    return !!row;
  } catch (err) {
    if (err && err.code === 11000) return false;
    throw err;
  }
};
// Gives a slot back when nothing could be delivered (every device was dead), so a dead device does not eat the cap.
const releaseDailySlot = (userId, now = new Date()) =>
  PushDailyCounter.updateOne({ user: userId, day: dayKeyIst(now), count: { $gt: 0 } }, { $inc: { count: -1 } }).catch(() => {});

const clip = (s = '', n) => (String(s).length > n ? `${String(s).slice(0, n - 1).trim()}…` : String(s));

const buildPayload = ({ title, message, link, type, category }) => JSON.stringify({
  title: clip(title, 60),
  body: clip(message, 140),
  link: link || '/',
  type: type || 'general',
  category,
  // Same tag for the same type so a burst of identical alerts replaces rather than stacks.
  tag: `vv-${type || 'general'}`
});

// Send one payload to all of a user's devices. Returns the number of devices that accepted it.
const sendToUser = async (userId, payload, { urgent } = {}) => {
  const subs = await PushSubscription.find({ user: userId });
  if (!subs.length) return 0;
  let delivered = 0;
  await Promise.all(subs.map(async (sub) => {
    try {
      await lib().sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
        payload,
        { TTL: urgent ? 60 * 60 : 24 * 60 * 60, urgency: urgent ? 'high' : 'normal' }
      );
      delivered += 1;
      if (sub.failures || !sub.lastUsedAt || Date.now() - sub.lastUsedAt > 60 * 60 * 1000) {
        await PushSubscription.updateOne({ _id: sub._id }, { $set: { failures: 0, lastUsedAt: new Date() } });
      }
    } catch (err) {
      const code = err?.statusCode;
      if (code === 404 || code === 410 || (sub.failures || 0) + 1 >= MAX_FAILURES) {
        await PushSubscription.deleteOne({ _id: sub._id });
      } else {
        await PushSubscription.updateOne({ _id: sub._id }, { $inc: { failures: 1 } });
      }
    }
  }));
  return delivered;
};

// Called by notifyUsers. Never throws; never does anything when push is off.
const sendPush = async ({ recipientIds = [], title, message, link = '', type = 'general', now = new Date() }) => {
  if (!isPushEnabled()) return { sent: 0, skipped: recipientIds.length };
  const ids = [...new Set(recipientIds.filter(Boolean).map(String))];
  if (!ids.length) return { sent: 0, skipped: 0 };
  const category = categoryOf(type);
  const payload = buildPayload({ title, message, link, type, category });

  // Only people with at least one device get a preference lookup.
  const withDevices = await PushSubscription.distinct('user', { user: { $in: ids } });
  if (!withDevices.length) return { sent: 0, skipped: ids.length };
  const users = await User.find({ _id: { $in: withDevices } }).select('pushPrefs').lean();

  let sent = 0;
  for (const u of users) {
    const decision = pickDeliverable({ category, prefs: u.pushPrefs || {}, now });
    if (!decision.ok) continue;
    const capped = !CAP_EXEMPT_CATEGORIES.has(category);
    if (capped && !(await reserveDailySlot(u._id, now))) continue; // daily cap reached
    const delivered = await sendToUser(u._id, payload, { urgent: URGENT_CATEGORIES.has(category) });
    if (delivered > 0) {
      sent += 1;
      if (category === 'jobs') await User.updateOne({ _id: u._id }, { $set: { 'pushPrefs.lastJobPushAt': now } });
    } else if (capped) {
      await releaseDailySlot(u._id, now);
    }
  }
  return { sent, skipped: ids.length - sent };
};

module.exports = {
  CATEGORIES, URGENT_CATEGORIES, CAP_EXEMPT_CATEGORIES, MAX_FAILURES, QUIET_START, QUIET_END, DEFAULT_MAX_PER_DAY,
  isPushEnabled, publicKey, categoryOf, isQuietHour, pickDeliverable, buildPayload, sendToUser, sendPush,
  maxPerDay, reserveDailySlot, releaseDailySlot, PUSH_ENDPOINT_HOSTS, isAllowedEndpoint,
  _setLibForTests: (fake) => { webPushLib = fake; }
};
