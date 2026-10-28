const crypto = require('crypto');
const path = require('path');
const { getJwtSecret } = require('../config/jwt');

// Short-lived signed links for documents under /uploads (resumes, MoUs, reports, KYC proofs). A link is
// /uploads/<file>?exp=<unix seconds>&sig=<hmac>. It is valid for one file for a few minutes, so it can be opened in a
// new tab or pasted into an <a href> without the session token ever appearing in a URL.
const DEFAULT_TTL_SEC = 10 * 60;
const PUBLIC_IMAGE_EXT = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif']);
// Skill certificates are meant to be shared by their code; the file name carries random bytes.
const PUBLIC_NAME_PREFIXES = ['certificate-'];

const keyFor = () => crypto.createHmac('sha256', getJwtSecret()).update('uploads-signing-v1').digest();
const mac = (filePath, exp) => crypto.createHmac('sha256', keyFor()).update(`${filePath}|${exp}`).digest('hex');

// Reduces "https://api.x/uploads/a.pdf?x=1" or "/uploads/a.pdf" to "/uploads/a.pdf", or null when it is not an upload path.
const toUploadPath = (value) => {
  if (typeof value !== 'string') return null;
  let p = value.trim();
  try { if (/^https?:\/\//i.test(p)) p = new URL(p).pathname; } catch { return null; }
  p = p.split(/[?#]/)[0];
  try { p = decodeURIComponent(p); } catch { return null; }
  const normalized = path.posix.normalize(p);
  if (!normalized.startsWith('/uploads/') || normalized.includes('..')) return null;
  return normalized;
};

const isPublicUpload = (filePath) => {
  if (PUBLIC_IMAGE_EXT.has(path.posix.extname(filePath).toLowerCase())) return true;
  const base = path.posix.basename(filePath);
  return PUBLIC_NAME_PREFIXES.some((prefix) => base.startsWith(prefix));
};

const signUploadPath = (filePath, ttlSec = DEFAULT_TTL_SEC, now = Date.now()) => {
  const exp = Math.floor(now / 1000) + ttlSec;
  return `${filePath}?exp=${exp}&sig=${mac(filePath, exp)}`;
};

const verifyUploadSignature = (filePath, exp, sig, now = Date.now()) => {
  const expNum = Number(exp);
  if (!filePath || !Number.isFinite(expNum) || typeof sig !== 'string') return false;
  if (expNum * 1000 < now) return false;
  const expected = Buffer.from(mac(filePath, expNum));
  const given = Buffer.from(sig);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
};

module.exports = { toUploadPath, isPublicUpload, signUploadPath, verifyUploadSignature, DEFAULT_TTL_SEC };
