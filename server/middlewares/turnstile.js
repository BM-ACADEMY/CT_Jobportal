// Cloudflare Turnstile bot check. Add it to a route after the rate limiter.
//  - No TURNSTILE_SECRET_KEY in the environment: the check is skipped, nothing changes.
//  - A missing or bad token: the request is refused with a plain message.
//  - Cloudflare unreachable, slow or broken: the request is let through (and logged), so a Cloudflare problem never locks people out.
// The token comes in req.body.turnstileToken.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const turnstile = ({ fetchFn = (...a) => fetch(...a), env = process.env, timeoutMs = 5000 } = {}) => async (req, res, next) => {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return next();

  const token = String(req.body?.turnstileToken || '').trim();
  if (!token || token.length > 4096) return res.status(400).json({ msg: 'Please complete the "I am human" check and try again.' });

  let verdict;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (req.ip) body.set('remoteip', req.ip);
    const r = await fetchFn(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    verdict = await r.json();
  } catch (err) {
    console.error('[turnstile] could not reach Cloudflare, letting the request through:', err.message);
    return next();
  }
  if (verdict && verdict.success === true) return next();
  return res.status(400).json({ msg: 'The "I am human" check failed. Please refresh and try again.' });
};

module.exports = { turnstile };
