// Government jobs on autopilot: read a list of official pages once a day and pick out NEW recruitment notices.
// Nothing is posted from here. New notices wait in Admin > Government jobs; Kamar approves, then posts them as a job.
const crypto = require('node:crypto');
const { checkUrl } = require('./fairNotice');

const MAX_BYTES = 1500000;
const KEYWORDS = /(recruit|vacanc|notification|walk[\s-]?in|apply|application|examination|exam|post of|posts of|jobs?|career|employment|selection|admit|result|interview|appointment|engagement)/i;
const SKIP = /(javascript:|mailto:|tel:|#$)/i;

const decode = (s) => String(s).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = (s) => decode(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// The same notice must give the same fingerprint every day, so tracking bits and trailing slashes are dropped.
const normaliseUrl = (raw) => {
  try {
    const u = new URL(raw);
    u.hash = '';
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(k)) u.searchParams.delete(k);
    return u.toString().replace(/\/$/, '');
  } catch { return ''; }
};
const fingerprint = (url) => crypto.createHash('sha1').update(normaliseUrl(url)).digest('hex');

// [{ title, url }] from the links on one page. Only https links; only ones whose words look like a recruitment notice.
const extractNotices = (html, baseUrl, max = 60) => {
  const out = [];
  const seen = new Set();
  for (const m of String(html).matchAll(/<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = decode(m[1]).trim();
    if (!href || SKIP.test(href)) continue;
    let abs;
    try { abs = new URL(href, baseUrl); } catch { continue; }
    if (abs.protocol !== 'https:') continue;
    const title = text(m[2]).slice(0, 200);
    if (title.length < 12 || !KEYWORDS.test(`${title} ${abs.pathname}`)) continue;
    const key = fingerprint(abs.toString());
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title, url: normaliseUrl(abs.toString()) });
    if (out.length >= max) break;
  }
  return out;
};

const fetchPage = async (raw, { fetchImpl = globalThis.fetch, timeoutMs = 10000 } = {}) => {
  const c = checkUrl(raw);
  if (c.error) return { error: c.error };
  if (typeof fetchImpl !== 'function') return { error: 'Fetching is not available on this server.' };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(c.url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'VelaivaaipuNoticeWatcher/1.0', Accept: 'text/html,application/xhtml+xml' } });
    if (res.url && checkUrl(res.url).error) return { error: 'The page redirected somewhere that cannot be used.' };
    if (!res.ok) return { error: `The page answered ${res.status}.` };
    const html = (await res.text()).slice(0, MAX_BYTES);
    return { html, finalUrl: res.url || c.url };
  } catch (e) { return { error: e.name === 'AbortError' ? 'The page took too long.' : 'The page could not be read.' }; }
  finally { clearTimeout(t); }
};

// One source. `known` = fingerprints already stored for it. Returns { fresh, error }.
// A source's first successful scan only records what is already there (baseline), so nobody gets a flood of old notices.
const scanSource = async (source, known, opts) => {
  const page = await fetchPage(source.url, opts);
  if (page.error) return { error: page.error, fresh: [] };
  const found = extractNotices(page.html, page.finalUrl);
  const knownSet = new Set(known);
  const fresh = found.filter((n) => !knownSet.has(fingerprint(n.url))).map((n) => ({ ...n, fingerprint: fingerprint(n.url) }));
  return { fresh, baseline: !source.lastScanAt, found: found.length };
};

module.exports = { extractNotices, fingerprint, normaliseUrl, fetchPage, scanSource, KEYWORDS };
