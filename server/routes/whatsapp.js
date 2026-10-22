const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const CollegeStudent = require('../models/CollegeStudent');

// Meta webhook verification handshake — register this URL in the App Dashboard.
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WA_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

const validSignature = (raw, header) => {
  const secret = process.env.WA_APP_SECRET;
  if (!secret || !raw || typeof header !== 'string') return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const STOP_WORDS = new Set(['stop', 'unsubscribe', 'cancel', 'optout', 'opt out']);

// Inbound messages: a "STOP" reply switches off promotional messages for that number.
// Requires WA_APP_SECRET so only Meta can trigger it. Payloads are not logged (personal data).
router.post('/webhook', express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }), async (req, res) => {
  res.sendStatus(200);
  try {
    if (!validSignature(req.rawBody, req.get('x-hub-signature-256'))) return;
    const messages = (req.body?.entry || [])
      .flatMap((e) => e.changes || [])
      .flatMap((c) => c.value?.messages || []);
    for (const m of messages) {
      const text = String(m.text?.body || '').trim().toLowerCase();
      const digits = String(m.from || '').replace(/\D/g, '').slice(-10);
      if (STOP_WORDS.has(text) && digits.length === 10) {
        await CollegeStudent.updateMany({ whatsappNumber: new RegExp(`${digits}$`) }, { $set: { whatsappOptOut: true } });
      }
    }
  } catch (err) {
    console.error('[WhatsApp] Webhook error:', err.message);
  }
});

module.exports = router;
