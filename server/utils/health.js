// Real health check: is the database answering? No secrets, no counts.
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

const checkHealth = async (mongoose, { timeoutMs = 3000, now = () => new Date() } = {}) => {
  let db = 'down';
  try {
    if (mongoose.connection.readyState === 1) {
      await withTimeout(mongoose.connection.db.admin().ping(), timeoutMs);
      db = 'up';
    }
  } catch { db = 'down'; }
  return { ok: db === 'up', db, time: now().toISOString() };
};

// Same answer for a few seconds, so repeated calls cannot keep the database busy.
let cached = null;
const checkHealthCached = async (mongoose, { ttlMs = 5000, now = () => Date.now(), ...opts } = {}) => {
  if (cached && now() - cached.at < ttlMs) return cached.result;
  const result = await checkHealth(mongoose, opts);
  cached = { at: now(), result };
  return result;
};
const resetHealthCache = () => { cached = null; };

module.exports = { checkHealth, checkHealthCached, resetHealthCache };
