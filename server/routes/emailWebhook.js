const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Mail-service webhook (Brevo transactional events). A hard bounce, invalid address or spam complaint switches
// off marketing / lifecycle mail for that address. OTP, receipts and security mail are not suppressed, because a
// fixed mailbox may start working again. Configure in Brevo: Transactional > Settings > Webhook, URL
//   https://<api-domain>/api/webhooks/email/brevo?secret=<BREVO_WEBHOOK_SECRET>
// with the events: hard bounce, invalid email, spam (complaint) and unsubscribe.
const BOUNCE_EVENTS = new Set(['hard_bounce', 'hardbounce', 'invalid_email', 'invalid']);
const COMPLAINT_EVENTS = new Set(['spam', 'complaint']);
const UNSUB_EVENTS = new Set(['unsubscribed', 'unsubscribe']);

const secretOk = (req) => {
  const expected = process.env.BREVO_WEBHOOK_SECRET;
  if (!expected) return false; // never open when unset
  const given = String(req.query.secret || req.get('x-webhook-secret') || '');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// Returns the update to apply for one event, or null when the event needs no action.
const updateFor = (event, now = new Date()) => {
  const e = String(event || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (BOUNCE_EVENTS.has(e)) return { 'emailPrefs.marketingOptOut': true, 'emailPrefs.optOutAt': now, 'emailPrefs.bounced': true, 'emailPrefs.bouncedAt': now, 'emailPrefs.bounceReason': 'hard_bounce' };
  if (COMPLAINT_EVENTS.has(e)) return { 'emailPrefs.marketingOptOut': true, 'emailPrefs.optOutAt': now, 'emailPrefs.bounceReason': 'complaint' };
  if (UNSUB_EVENTS.has(e)) return { 'emailPrefs.marketingOptOut': true, 'emailPrefs.optOutAt': now };
  return null;
};

router.post('/brevo', async (req, res) => {
  if (!secretOk(req)) return res.sendStatus(401);
  res.sendStatus(200); // answer fast; Brevo retries on errors
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body || {}];
    for (const ev of events) {
      const email = typeof ev.email === 'string' ? ev.email.trim().toLowerCase() : '';
      const update = updateFor(ev.event);
      if (!email || !update) continue;
      await User.updateMany({ email }, { $set: update });
    }
  } catch (err) {
    console.error('[EmailWebhook] error:', err.message);
  }
});

module.exports = router;
module.exports.updateFor = updateFor;
