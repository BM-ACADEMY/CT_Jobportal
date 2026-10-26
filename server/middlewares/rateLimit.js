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

module.exports = { rateLimit };
