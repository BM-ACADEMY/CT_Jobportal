const WEBHOOK_PATH_PREFIX = '/api/payments/razorpay/';

// `verify` hook for express.json(). Razorpay signs the exact bytes it sends, but express.json() parses
// the body before the payment routes run, leaving only the parsed object. This keeps the original
// bytes on req.rawBody for the webhook paths so the signature can be checked against them.
const captureWebhookRawBody = (req, res, buf) => {
  if (req.originalUrl.startsWith(WEBHOOK_PATH_PREFIX)) req.rawBody = buf;
};

module.exports = { captureWebhookRawBody, WEBHOOK_PATH_PREFIX };
