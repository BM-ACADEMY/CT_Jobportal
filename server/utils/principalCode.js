// The principal's executive-dashboard access code: checked in constant time, and locked after a few wrong tries
// (a 4-digit code has only 9,000 values, so unlimited guesses would find it in minutes).
const crypto = require('crypto');

const MAX_WRONG_TRIES = 5;

// Returns 'ok', 'none' (no code issued), 'expired', 'locked' (too many wrong tries) or 'wrong'.
const checkPrincipalCode = ({ code, expiry, attempts = 0 }, entered, now = new Date()) => {
  if (!code || !expiry) return 'expired';
  if (new Date(expiry) < now) return 'expired';
  if (attempts >= MAX_WRONG_TRIES) return 'locked';
  const a = Buffer.from(String(entered ?? ''));
  const b = Buffer.from(String(code));
  const same = a.length === b.length && crypto.timingSafeEqual(a, b);
  return same ? 'ok' : 'wrong';
};

module.exports = { checkPrincipalCode, MAX_WRONG_TRIES };
