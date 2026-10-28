const crypto = require('crypto');

// One-time codes that replace the session token in the Google/LinkedIn redirect URL. The browser swaps the code
// for the real token with POST /api/auth/social-exchange, so the token never appears in a URL, history or log.
// Held in memory: a code lives 60 seconds and works once. (With several server processes behind a load balancer,
// move this to the database or Redis.)
const TTL_MS = 60 * 1000;
const codes = new Map();

const sweep = (now) => { for (const [code, v] of codes) if (v.exp <= now) codes.delete(code); };

const issueSocialLoginCode = (userId, now = Date.now()) => {
  sweep(now);
  const code = crypto.randomBytes(32).toString('hex');
  codes.set(code, { userId: String(userId), exp: now + TTL_MS });
  return code;
};

// Returns the user id once, or null when the code is unknown, used or expired.
const consumeSocialLoginCode = (code, now = Date.now()) => {
  const entry = codes.get(String(code || ''));
  if (!entry) return null;
  codes.delete(String(code));
  return entry.exp > now ? entry.userId : null;
};

module.exports = { issueSocialLoginCode, consumeSocialLoginCode, TTL_MS };
