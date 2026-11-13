// Job fairs: cleaning admin input, public shape and the shareable poster card. No database here, so it is easy to test.
const { slugify, istDayStart } = require('./driveRules');

const str = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const list = (v, max, n) => (Array.isArray(v) ? v : String(v ?? '').split(/\r?\n|,/)).map((x) => str(x, max)).filter(Boolean).slice(0, n);
const httpsUrl = (v) => { const s = str(v, 500); return /^https:\/\/[^\s]+\.[^\s]+$/i.test(s) ? s : ''; };

// Returns { error } or { data }. A government fair must link to its official page, so nobody can list a fair without a source.
const cleanFairInput = (b = {}) => {
  const title = str(b.title, 140);
  if (title.length < 5) return { error: 'Give the fair a title (at least 5 letters).' };
  const date = new Date(b.date);
  if (Number.isNaN(date.getTime())) return { error: 'Choose the fair date.' };
  const endDate = b.endDate ? new Date(b.endDate) : null;
  if (endDate && (Number.isNaN(endDate.getTime()) || endDate < date)) return { error: 'The end date cannot be before the start date.' };
  const kind = b.kind === 'own' ? 'own' : 'government';
  const officialUrl = httpsUrl(b.officialUrl);
  if (str(b.officialUrl, 500) && !officialUrl) return { error: 'The official link must start with https://' };
  if (kind === 'government' && !officialUrl) return { error: 'A government fair needs the official notice or registration link.' };
  const organiserName = str(b.organiserName, 140);
  if (kind === 'government' && !organiserName) return { error: 'Name the organising department.' };
  return {
    data: {
      title, kind, organiserName, date, endDate, officialUrl,
      venue: { name: str(b.venue?.name, 140), address: str(b.venue?.address, 300), city: str(b.venue?.city, 60), district: str(b.venue?.district, 60), mapUrl: httpsUrl(b.venue?.mapUrl) },
      description: str(b.description, 3000), eligibility: str(b.eligibility, 500),
      documents: list(b.documents, 80, 12), companies: list(b.companies, 100, 60),
      supportedByUs: b.supportedByUs !== false,
    },
  };
};

const makeFairSlug = (title, rng) => slugify(title || 'job-fair', rng);

// What the public sees. The tag only shows when we really support the fair; the organiser is always named separately.
const publicFair = (f, { going = 0 } = {}) => ({
  slug: f.slug, title: f.title, kind: f.kind, organiserName: f.organiserName, date: f.date, endDate: f.endDate,
  venue: f.venue, description: f.description, eligibility: f.eligibility, documents: f.documents, companies: f.companies,
  officialUrl: f.officialUrl, supportedByUs: !!f.supportedByUs, going, closed: f.status === 'closed',
});

// Only fairs that are live and not already over (end date, or the fair day itself, in India time).
const isUpcoming = (f, now = new Date()) => f.status === 'published' && new Date(f.endDate || f.date) >= istDayStart(now);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const clip = (s, n) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));

// Poster card (SVG, 1080 x 1080) with our name. Says "Organised by" the department, never that the government endorses us.
const fairCardSvg = (f) => {
  const place = clip([f.venue?.name, f.venue?.city].filter(Boolean).join(', '), 56);
  const when = f.endDate && +new Date(f.endDate) !== +new Date(f.date) ? `${fmt(f.date)} to ${fmt(f.endDate)}` : fmt(f.date);
  const lines = (s, n) => { const w = String(s).split(' '); const out = []; let cur = ''; w.forEach((x) => { if ((cur + ' ' + x).trim().length > n) { out.push(cur.trim()); cur = x; } else cur += ' ' + x; }); if (cur.trim()) out.push(cur.trim()); return out.slice(0, 3); };
  const title = lines(f.title, 24).map((l, i) => `<text x="72" y="${330 + i * 84}" font-size="68" font-weight="800" fill="#0f172a">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" font-family="Arial, Helvetica, sans-serif">
<rect width="1080" height="1080" fill="#ecfdf5"/><rect x="0" y="0" width="1080" height="16" fill="#059669"/>
<text x="72" y="130" font-size="34" font-weight="700" fill="#059669">JOB FAIR · FREE FOR JOB SEEKERS</text>
${title}
<text x="72" y="640" font-size="44" font-weight="700" fill="#0f172a">${esc(when)}</text>
<text x="72" y="705" font-size="36" fill="#334155">${esc(place)}</text>
${f.organiserName ? `<text x="72" y="775" font-size="30" fill="#475569">Organised by ${esc(clip(f.organiserName, 52))}</text>` : ''}
${Array.isArray(f.documents) && f.documents.length ? `<text x="72" y="835" font-size="28" fill="#475569">Bring: ${esc(clip(f.documents.join(', '), 60))}</text>` : ''}
<rect x="0" y="930" width="1080" height="150" fill="#064e3b"/>
${f.supportedByUs ? '<text x="72" y="1000" font-size="40" font-weight="800" fill="#ffffff">Supported by Velaivaaipu</text>' : '<text x="72" y="1000" font-size="40" font-weight="800" fill="#ffffff">Velaivaaipu</text>'}
<text x="72" y="1050" font-size="28" fill="#a7f3d0">velaivaaipu.in/job-fairs · Get reminders and free resume help</text>
</svg>`;
};

module.exports = { cleanFairInput, makeFairSlug, publicFair, isUpcoming, fairCardSvg, httpsUrl };
