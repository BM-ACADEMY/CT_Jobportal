// Tiny dependency-free fixed-window rate limiter (per IP + route key).
// Fine for a single server process; switch to express-rate-limit + a shared store
// (e.g. Redis) if you run several instances.
const buckets = new Map();

const clientIp = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const rateLimit = ({ windowMs, max, message = 'Too many requests. Please try again later.' }) => (req, res, next) => {
  const key = `${req.baseUrl}${req.path}|${clientIp(req)}`;
  const now = Date.now();
  let entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > max) {
    res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    return res.status(429).json({ msg: message });
  }
  next();
};

// Periodically drop expired buckets so the map cannot grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) if (entry.resetAt <= now) buckets.delete(key);
}, 5 * 60 * 1000).unref();

// Same idea, but counted per person (the email or phone in the request body) instead of per IP.
// One victim cannot be flooded with OTPs from many IPs, and one address cannot be used to farm signups.
const limitedBy = new Map();

const rateLimitBy = ({ fields = ['email', 'phone'], windowMs, max, message = 'Too many requests for this account. Please try again later.' }) => (req, res, next) => {
  const raw = fields.map((f) => req.body?.[f]).find((v) => typeof v === 'string' && v.trim());
  if (!raw) return next();
  const key = `${req.baseUrl}${req.path}|${String(raw).trim().toLowerCase()}`;
  const now = Date.now();
  let entry = limitedBy.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    limitedBy.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > max) {
    res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
    return res.status(429).json({ msg: message });
  }
  next();
};

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limitedBy) if (entry.resetAt <= now) limitedBy.delete(key);
}, 5 * 60 * 1000).unref();

// Hidden form field that people never see and bots fill in. A filled field gets a normal-looking success and nothing is saved.
const honeypot = (field = 'company_website') => (req, res, next) => {
  const value = req.body?.[field];
  if (typeof value === 'string' && value.trim()) return res.status(200).json({ msg: 'Thank you. We will get back to you soon.' });
  next();
};

module.exports = { rateLimit, rateLimitBy, honeypot };
