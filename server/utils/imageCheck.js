// Optional image moderation hook for uploaded logos and photos.
// Only when BOTH IMAGE_CHECK_ENDPOINT and IMAGE_CHECK_KEY are set in the environment is anything sent anywhere; otherwise
// every image is ok. These two values are read in this file only and are never logged or returned.
// The call is best effort: a timeout, a network error or an unexpected answer is "ok", so an outage never blocks an upload.
//
// The service contract is deliberately small: POST the raw image bytes with Authorization: Bearer <key> and the file's
// content type; answer is JSON. The image is refused only when the answer says so: { ok: false } or { flagged: true }.
const fs = require('fs');
const path = require('path');

const TIMEOUT_MS = 5000;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

const configured = (env = process.env) => Boolean(env.IMAGE_CHECK_ENDPOINT && env.IMAGE_CHECK_KEY);

// Pure: does the service answer mean "refuse this image"?
const isRefusal = (answer) => Boolean(answer) && typeof answer === 'object' && (answer.ok === false || answer.flagged === true);

/**
 * @param {string} filePath  a file on disk (png, jpg, webp or gif)
 * @param {{env?:object, fetchImpl?:Function}} deps  injected for tests
 * @returns {Promise<{ok:boolean, checked:boolean}>}  checked is true only when the service really answered
 */
const checkImage = async (filePath, { env = process.env, fetchImpl } = {}) => {
  if (!configured(env)) return { ok: true, checked: false };
  try {
    const type = TYPES[path.extname(String(filePath || '')).toLowerCase()];
    if (!type) return { ok: true, checked: false };
    const bytes = await fs.promises.readFile(filePath);
    if (bytes.length > MAX_BYTES) return { ok: true, checked: false };
    const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null);
    if (!doFetch) return { ok: true, checked: false };
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), TIMEOUT_MS) : null;
    try {
      const res = await doFetch(env.IMAGE_CHECK_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.IMAGE_CHECK_KEY}`, 'Content-Type': type },
        body: bytes,
        ...(ctl ? { signal: ctl.signal } : {}),
      });
      if (!res || !res.ok) return { ok: true, checked: false };
      const answer = await res.json();
      return { ok: !isRefusal(answer), checked: true };
    } finally { if (timer) clearTimeout(timer); }
  } catch {
    return { ok: true, checked: false }; // never log the error: it could echo the endpoint
  }
};

module.exports = { checkImage, isRefusal, configured };
