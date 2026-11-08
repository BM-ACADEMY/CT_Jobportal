// Admin login code (second step). Six digits, random, stored only as a hash, five tries, ten minutes.
const crypto = require('crypto');
const { getJwtSecret } = require('../config/jwt');

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const newOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

const hashOtp = (otp) => crypto.createHmac('sha256', getJwtSecret()).update(String(otp)).digest('hex');

// Is a second step needed? Always when the switch is on (ADMIN_2FA_ENABLED=true), else only for admins who turned it on.
const twoFactorRequired = (admin, env = process.env) => env.ADMIN_2FA_ENABLED === 'true' || !!admin?.twoFactorAuth?.enabled;

// Returns 'ok', 'none' (no code asked for), 'expired', 'locked' (too many tries) or 'wrong'.
// `attempts` counts wrong tries on the current code; the caller stores what this returns in `nextAttempts`.
const checkOtp = ({ storedHash, expires, attempts = 0 }, entered, now = new Date()) => {
  if (!storedHash || !expires) return { status: 'none', nextAttempts: attempts };
  if (attempts >= MAX_ATTEMPTS) return { status: 'locked', nextAttempts: attempts };
  if (new Date(expires) < now) return { status: 'expired', nextAttempts: attempts };
  const a = Buffer.from(hashOtp(String(entered || '').trim()), 'hex');
  const b = Buffer.from(String(storedHash), 'hex');
  const same = a.length === b.length && crypto.timingSafeEqual(a, b);
  return same ? { status: 'ok', nextAttempts: 0 } : { status: 'wrong', nextAttempts: attempts + 1 };
};

module.exports = { newOtp, hashOtp, twoFactorRequired, checkOtp, OTP_TTL_MS, MAX_ATTEMPTS };
