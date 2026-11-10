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

// Counts the try in one atomic step (so parallel guesses cannot slip past the limit), then checks the code.
// Returns the college when the code is right, otherwise null. The caller gives one answer for every failure.
const tryPrincipalAccess = async (College, passkey, code, now = new Date()) => {
  const college = await College.findOneAndUpdate(
    { principalPasskey: String(passkey || ''), principalAccessAttempts: { $lt: MAX_WRONG_TRIES } },
    { $inc: { principalAccessAttempts: 1 } },
    { new: false }
  );
  if (!college) return null;
  const verdict = checkPrincipalCode({ code: college.principalAccessCode, expiry: college.principalAccessCodeExpiry, attempts: college.principalAccessAttempts || 0 }, code, now);
  if (verdict !== 'ok') return null;
  await College.updateOne({ _id: college._id }, { $set: { principalAccessAttempts: 0 } });
  return college;
};

module.exports = { checkPrincipalCode, tryPrincipalAccess, MAX_WRONG_TRIES };
