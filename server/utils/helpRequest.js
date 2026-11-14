// Help button: turns what the person typed into a Needs-action request. Pure cleaning, so it can be tested.
const MAX_MESSAGE = 1000;
const MIN_MESSAGE = 5;
const MAX_PER_HOUR = 5;

const strip = (v) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();

// Keeps only the path of the page (and no query string, which can hold tokens). Accepts a full URL or a path.
const cleanPageUrl = (raw) => {
  const s = strip(raw).slice(0, 400);
  if (!s) return '';
  let path = s;
  const m = s.match(/^https?:\/\/[^/]+(\/.*)?$/i);
  if (m) path = m[1] || '/';
  path = path.split(/[?#]/)[0];
  return path.startsWith('/') ? path.slice(0, 300) : '';
};

const cleanHelpInput = (body = {}) => {
  const message = strip(body.message).slice(0, MAX_MESSAGE);
  if (message.length < MIN_MESSAGE) return { error: 'Please tell us a little about what you need help with.' };
  return { message, pageUrl: cleanPageUrl(body.pageUrl) };
};

module.exports = { cleanHelpInput, cleanPageUrl, MAX_PER_HOUR, MAX_MESSAGE };
