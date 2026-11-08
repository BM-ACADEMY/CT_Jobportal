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

module.exports = { checkHealth };
