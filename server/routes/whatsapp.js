const express = require('express');
const router = express.Router();

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

router.post('/webhook', express.json(), (req, res) => {
  console.log('[WhatsApp] Inbound event:', JSON.stringify(req.body));
  res.sendStatus(200);
});

module.exports = router;
