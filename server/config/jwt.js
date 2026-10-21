// Single source of truth for JWT settings. There is deliberately NO fallback secret:
// a missing/weak JWT_SECRET must stop the server, not silently allow forged tokens.
const MIN_SECRET_LENGTH = 32;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters`);
  }
  return secret;
};

// Call once at startup so a bad config fails immediately instead of on the first login.
const assertJwtConfig = () => { getJwtSecret(); };

const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '30d';

module.exports = { getJwtSecret, assertJwtConfig, TOKEN_TTL };
