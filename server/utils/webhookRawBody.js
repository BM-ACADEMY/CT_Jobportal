const WEBHOOK_PATH_PREFIX = '/api/payments/razorpay/';
// Meta also signs the exact bytes it sends (X-Hub-Signature-256), so the WhatsApp webhook needs them too.
const RAW_BODY_PREFIXES = [WEBHOOK_PATH_PREFIX, '/api/whatsapp/'];

// `verify` hook for express.json(). Razorpay signs the exact bytes it sends, but express.json() parses
// the body before the payment routes run, leaving only the parsed object. This keeps the original
// bytes on req.rawBody for the webhook paths so the signature can be checked against them.
const captureWebhookRawBody = (req, res, buf) => {
  if (RAW_BODY_PREFIXES.some((p) => req.originalUrl.startsWith(p))) req.rawBody = buf;
};

module.exports = { captureWebhookRawBody, WEBHOOK_PATH_PREFIX, RAW_BODY_PREFIXES };
