// Step 4: turn an official notice page into a DRAFT fair. One page, fetched once by an admin click: no crawler, no schedule.
// Extraction is heuristic, so the result is always a draft for the admin to check; it is never published here.
const MAX_BYTES = 1000000;
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

const decode = (s) => String(s).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
const clean = (s, max) => decode(s).replace(/\s+/g, ' ').trim().slice(0, max);
const toText = (html) => decode(String(html).replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ').replace(/<\/(p|div|li|tr|h[1-6]|br)>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')).replace(/[ \t\f\v ]+/g, ' ').replace(/\n\s*/g, '\n');

// Only public https pages. Blocks local and private addresses so the button cannot be used to reach our own network.
const checkUrl = (raw) => {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch { return { error: 'Paste the full notice link starting with https://' }; }
  if (u.protocol !== 'https:') return { error: 'The notice link must start with https://' };
  const h = u.hostname.toLowerCase();
  const privateHost = h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || !h.includes('.') || h.startsWith('[')
    || /^(127|10|0)\./.test(h) || /^192\.168\./.test(h) || /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^\d+\.\d+\.\d+\.\d+$/.test(h);
  if (privateHost) return { error: 'That address cannot be used. Paste a public notice link.' };
  return { url: u.toString() };
};

const metaContent = (html, name) => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]*>`, 'i');
  const tag = (String(html).match(re) || [])[0];
  const c = tag && tag.match(/content=["']([^"']*)["']/i);
  return c ? clean(c[1], 200) : '';
};

const makeDate = (d, m, y) => {
  const year = y < 100 ? 2000 + y : y;
  if (m < 0 || m > 11 || d < 1 || d > 31 || year < 2000 || year > 2100) return null;
  const dt = new Date(Date.UTC(year, m, d));
  return dt.getUTCMonth() === m && dt.getUTCDate() === d ? dt : null;
};

// Finds dates written as 05/12/2026, 05-12-2026, 5 December 2026, 5th Dec 2026 or December 5, 2026 (Indian day-first order).
const findDates = (text) => {
  const found = [];
  const add = (idx, dt) => { if (dt) found.push({ idx, dt }); };
  for (const m of text.matchAll(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4}|\d{2})\b/g)) add(m.index, makeDate(+m[1], +m[2] - 1, +m[3]));
  for (const m of text.matchAll(/\b(\d{1,2})(?:st|nd|rd|th)?[\s,\-]+(?:of\s+)?([A-Za-z]{3,9})\.?,?[\s,\-]+(\d{4})\b/g)) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mon !== undefined) add(m.index, makeDate(+m[1], mon, +m[3]));
  }
  for (const m of text.matchAll(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/g)) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mon !== undefined) add(m.index, makeDate(+m[2], mon, +m[3]));
  }
  return found.sort((a, b) => a.idx - b.idx);
};

// Prefer the first date at or after today (a notice often also lists its own issue date, which is earlier); else the first date.
const pickDate = (text, now = new Date()) => {
  const all = findDates(text);
  if (!all.length) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const near = all.find((x) => +x.dt >= today);
  return (near || all[0]).dt;
};

const findVenue = (text) => {
  const m = text.match(/(?:venue|place|location)\s*[:\-–]\s*([^\n]{5,160})/i);
  return m ? clean(m[1].replace(/\s*(?:date|time|on)\s*[:\-–].*$/i, ''), 140) : '';
};

// html + the page address -> what we could read. Every field may be empty.
const extractFair = (html, pageUrl, now = new Date()) => {
  const h = String(html || '');
  const text = toText(h);
  const title = clean(metaContent(h, 'og:title') || ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, ' ') || ((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ''), 140);
  let host = '';
  try { host = new URL(pageUrl).hostname.replace(/^www\./, ''); } catch { /* keep empty */ }
  return { title, date: pickDate(text, now), venue: findVenue(text), organiserName: clean(metaContent(h, 'og:site_name'), 140) || host, officialUrl: pageUrl };
};

// Fetch with a short timeout and a size cap. Never throws; returns { html } or { error }.
const fetchNotice = async (raw, { fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) => {
  const c = checkUrl(raw);
  if (c.error) return { error: c.error };
  if (typeof fetchImpl !== 'function') return { error: 'Fetching is not available on this server.' };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(c.url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'VelaivaaipuNoticeReader/1.0', Accept: 'text/html,application/xhtml+xml' } });
    if (res.url && checkUrl(res.url).error) return { error: 'The notice redirected somewhere that cannot be used.' };
    if (!res.ok) return { error: `The notice page answered with an error (${res.status}).` };
    const type = String(res.headers?.get?.('content-type') || '');
    if (type && !/text\/html|application\/xhtml|text\/plain/i.test(type)) return { error: 'The link is not a web page (it may be a PDF). Add the fair by hand.' };
    const html = (await res.text()).slice(0, MAX_BYTES);
    return { html, url: res.url || c.url };
  } catch (err) {
    return { error: err?.name === 'AbortError' ? 'The notice page took too long to answer.' : 'Could not open the notice page.' };
  } finally { clearTimeout(timer); }
};

// The draft to store, or { error, partial }. Never published: status is always draft, and the Supported by tag stays off until an admin decides.
const draftFromNotice = async (raw, opts = {}) => {
  const got = await fetchNotice(raw, opts);
  if (got.error) return { error: got.error };
  const x = extractFair(got.html, got.url, opts.now);
  if (x.title.length < 5) return { error: 'Could not find a title on that page. Add the fair by hand.', partial: x };
  if (!x.date) return { error: 'Could not find a date on that page. Add the fair by hand.', partial: x };
  return {
    draft: {
      title: x.title, kind: 'government', organiserName: x.organiserName, date: x.date, officialUrl: x.officialUrl,
      venue: { name: x.venue, address: '', city: '', district: '', mapUrl: '' },
      supportedByUs: false, status: 'draft',
    },
  };
};

module.exports = { checkUrl, extractFair, findDates, pickDate, fetchNotice, draftFromNotice, MAX_BYTES };
