const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const fm = require('../utils/fairMails');
const fs3 = require('../utils/fairStalls');
const fn = require('../utils/fairNotice');
const { buildSitemap, STATIC_PAGES } = require('../utils/seoPages');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const client = (p) => fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'src', p), 'utf8');
const future = new Date(Date.now() + 10 * 86400000);
const fair = { _id: 'f1', slug: 'mega-job-camp-abc123', title: 'Mega Job Camp', kind: 'own', status: 'published', date: future, organiserName: 'Afra', supportedByUs: true, venue: { name: 'Hall', city: 'Puducherry' } };
const ENV = { FAIR_MAILS_ENABLED: 'true', FRONTEND_URL: 'https://x.test', API_PUBLIC_URL: 'https://api.x.test' };

// ---- 1. links and sitemap
test('menu, footer and sitemap link to /job-fairs and each published fair', () => {
  assert.match(client('components/common/PublicHeader.jsx'), /to: '\/job-fairs', label: 'Job Fairs'/);
  assert.match(client('components/home/Footer.jsx'), /to: '\/job-fairs', label: 'Job Fairs'/);
  assert.ok(STATIC_PAGES.includes('/job-fairs'));
  const xml = buildSitemap({ fairs: [{ slug: 'camp-1', updatedAt: new Date('2026-11-01') }] });
  assert.match(xml, /\/job-fairs<\/loc>/);
  assert.match(xml, /\/job-fairs\/camp-1<\/loc>/);
  assert.doesNotThrow(() => buildSitemap({}));
});

// ---- 2. fair mails
test('fair mails are off unless FAIR_MAILS_ENABLED=true and the links are configured', () => {
  assert.equal(fm.enabled({}), false);
  assert.equal(fm.enabled({ FAIR_MAILS_ENABLED: 'true' }), false);
  assert.equal(fm.enabled(ENV), true);
  assert.equal(fm.enabled({ ...ENV, FAIR_MAILS_ENABLED: 'yes' }), false);
});
test('only a live fair can be mailed; the fair day itself still counts', () => {
  assert.equal(fm.mailable(fair), true);
  assert.equal(fm.mailable({ ...fair, status: 'draft' }), false);
  assert.equal(fm.mailable({ ...fair, status: 'closed' }), false);
  assert.equal(fm.mailable({ ...fair, date: new Date(Date.now() - 3 * 86400000) }), false);
});
test('mail copy per audience is honest and escapes the fair name', () => {
  const evil = { ...fair, title: '<script>x</script> Fair' };
  for (const a of ['seeker', 'company', 'college']) {
    const m = fm.buildMail({ name: 'Anu Kumar' }, evil, a, { frontend: 'https://x.test' });
    assert.ok(m.subject && m.title && !/<script>/.test(m.html));
    assert.match(m.html, /https:\/\/x\.test\/job-fairs\/mega-job-camp-abc123/);
  }
  assert.match(fm.buildMail({ name: 'A' }, fair, 'company').html, /stall/);
  assert.doesNotMatch(fm.buildMail({ name: 'A' }, { ...fair, kind: 'government' }, 'company').html, /stall/);
  assert.match(fm.buildMail({ name: 'A' }, fair, 'seeker').html, /Supported by Velaivaaipu/);
  assert.doesNotMatch(fm.buildMail({ name: 'A' }, { ...fair, supportedByUs: false }, 'seeker').html, /Supported by/);
});
test('seeker mails are narrowed to the fair town; companies and colleges are not', () => {
  assert.ok(fm.buildUserFilter('seeker', [1], fair)['profile.location'].test('Puducherry'));
  assert.equal(fm.buildUserFilter('company', [1], fair)['profile.location'], undefined);
  const f = fm.buildUserFilter('college', [1], fair);
  assert.equal(f['emailPrefs.marketingOptOut'].$ne, true);
  assert.equal(f.isVerified, true);
});

const fakeDeps = (users, logs = []) => {
  const sent = [];
  return {
    sent, logs,
    User: { find: () => ({ select: () => ({ limit: () => ({ lean: async () => users }) }) }) },
    Role: { find: () => ({ select: () => ({ lean: async () => [{ _id: 'r' }] }) }) },
    EmailLog: {
      find: (q) => ({ select: () => ({ lean: async () => logs.filter((l) => l.key === q.key) }) }),
      exists: async (q) => logs.some((l) => String(l.user) === String(q.user) && l.sentAt >= q.sentAt.$gte),
      countDocuments: async (q) => logs.filter((l) => String(l.user) === String(q.user) && l.sentAt >= q.sentAt.$gte).length,
      create: async (d) => { if (logs.some((l) => l.user === d.user && l.key === d.key)) { const e = new Error('dup'); e.code = 11000; throw e; } logs.push({ ...d, sentAt: new Date() }); },
      deleteOne: async (d) => { const i = logs.findIndex((l) => l.user === d.user && l.key === d.key); if (i >= 0) logs.splice(i, 1); },
    },
    sendEmail: async (m) => { sent.push(m); return true; },
    policy: require('../utils/lifecycle/emailPolicy'),
    wrap: (m) => ({ subject: m.subject, html: m.html, headers: { 'List-Unsubscribe': '<x>' } }),
    sleep: async () => {},
  };
};

test('sendFairMails refuses when off, for a draft fair and for an unknown audience', async () => {
  const deps = fakeDeps([{ _id: 'u1', email: 'a@b.com' }]);
  assert.ok((await fm.sendFairMails({ fair, audience: 'seeker', deps, env: {} })).error);
  assert.ok((await fm.sendFairMails({ fair: { ...fair, status: 'draft' }, audience: 'seeker', deps, env: ENV })).error);
  assert.ok((await fm.sendFairMails({ fair, audience: 'everyone', deps, env: ENV })).error);
  assert.equal(deps.sent.length, 0);
});
test('sendFairMails sends once per person per fair, skips opted-out and placeholder emails, and records the key', async () => {
  const users = [{ _id: 'u1', name: 'A', email: 'a@b.com' }, { _id: 'u2', name: 'B', email: '9999@college.portal' }, { _id: 'u3', name: 'C', email: 'c@b.com', emailPrefs: { marketingOptOut: true } }];
  const deps = fakeDeps(users);
  const r1 = await fm.sendFairMails({ fair, audience: 'seeker', deps, env: ENV });
  assert.equal(r1.sent, 1);
  assert.equal(deps.sent[0].email, 'a@b.com');
  assert.ok(deps.sent[0].headers['List-Unsubscribe']);
  assert.ok(deps.logs.some((l) => l.key === fm.keyFor('seeker', 'f1')));
  const r2 = await fm.sendFairMails({ fair, audience: 'seeker', deps, env: ENV });
  assert.equal(r2.sent, 0);
  assert.equal(deps.sent.length, 1);
});
test('sendFairMails respects the one-a-day rule, the weekly cap and the per-click limit', async () => {
  const recent = fakeDeps([{ _id: 'u1', email: 'a@b.com' }], [{ user: 'u1', key: 'js_weekly-1', sentAt: new Date(Date.now() - 3600000) }]);
  assert.equal((await fm.sendFairMails({ fair, audience: 'seeker', deps: recent, env: ENV })).skipped, 1);
  const day = (n) => new Date(Date.now() - n * 86400000);
  const capped = fakeDeps([{ _id: 'u1', email: 'a@b.com' }], [1, 2, 3].map((n) => ({ user: 'u1', key: `k${n}`, sentAt: day(n + 0.5) })));
  assert.equal((await fm.sendFairMails({ fair, audience: 'seeker', deps: capped, env: ENV })).sent, 0);
  const many = fakeDeps([1, 2, 3].map((n) => ({ _id: `u${n}`, email: `u${n}@b.com` })));
  const r = await fm.sendFairMails({ fair, audience: 'company', deps: many, env: { ...ENV, FAIR_MAILS_MAX: '2' } });
  assert.deepEqual([r.sent, r.left], [2, 1]);
});
test('a failed send frees the key so the next click can retry', async () => {
  const deps = fakeDeps([{ _id: 'u1', email: 'a@b.com' }]);
  deps.sendEmail = async () => false;
  const r = await fm.sendFairMails({ fair, audience: 'college', deps, env: ENV });
  assert.equal(r.failed, 1);
  assert.equal(deps.logs.length, 0);
});
test('preview counts without sending', async () => {
  const deps = fakeDeps([{ _id: 'u1', email: 'a@b.com' }]);
  const r = await fm.sendFairMails({ fair, audience: 'seeker', preview: true, deps, env: ENV });
  assert.equal(r.eligible, 1);
  assert.equal(deps.sent.length, 0);
});

// ---- 3. stalls and check-in
test('stall requests need name, contact, a real phone and the need; only on open own fairs', () => {
  const ok = { name: 'Acme Foods', contactName: 'Ravi', phone: '98765 43210', need: 'One table, 3 roles' };
  assert.equal(fs3.cleanStallInput(ok).data.phone, '+919876543210');
  for (const bad of [{ name: '' }, { contactName: '' }, { phone: '123' }, { need: '' }, { email: 'nope' }]) assert.ok(fs3.cleanStallInput({ ...ok, ...bad }).error);
  assert.equal(fs3.stallsOpen(fair), true);
  assert.equal(fs3.stallsOpen({ ...fair, kind: 'government' }), false);
  assert.equal(fs3.stallsOpen({ ...fair, status: 'closed' }), false);
});
test('the stall price is blank unless the owner sets it, and no price is written in code', () => {
  assert.equal(fs3.stallPriceLabel(null), null);
  assert.equal(fs3.stallPriceLabel(''), null);
  assert.equal(fs3.stallPriceLabel(undefined), null);
  assert.equal(fs3.stallPriceLabel(2500), 'Rs 2,500');
  assert.match(read('models/Settings.js'), /fairStallPrice: \{ type: Number, default: null/);
  for (const f of ['models/FairStall.js', 'utils/fairStalls.js', 'controllers/fairOpsController.js', 'utils/fairMails.js']) {
    assert.doesNotMatch(read(f), /razorpay/i);
    assert.doesNotMatch(read(f), /price\s*[:=]\s*\d/i);
  }
});
test('check-in search takes a phone or a name', () => {
  assert.deepEqual(fs3.parseSearch('98765 43210'), { phoneDigits: '9876543210' });
  assert.deepEqual(fs3.parseSearch('+91 98765 43210'), { phoneDigits: '9876543210' });
  assert.deepEqual(fs3.parseSearch('Anu'), { name: 'Anu' });
  assert.deepEqual(fs3.parseSearch('a'), {});
});

test('every new fair route is Super Admin only or limited to company accounts, and staff are not let in', () => {
  const routes = read('routes/jobFairs.js');
  const lines = routes.split('\n').filter((l) => /router\.(get|post|patch)\('\/admin/.test(l));
  assert.ok(lines.length >= 11);
  lines.forEach((l) => { assert.match(l, /authorizeRoles\('admin'\)/); assert.doesNotMatch(l, /subadmin/); });
  const stall = routes.split('\n').filter((l) => /'\/:slug\/stall'/.test(l));
  assert.equal(stall.length, 2);
  stall.forEach((l) => assert.match(l, /authorizeRoles\('company', 'recruiter'\)/));
});
test('the controller loads without a database driver (lazy requires)', () => {
  assert.doesNotThrow(() => require('../controllers/fairOpsController'));
  assert.doesNotMatch(read('controllers/fairOpsController.js').split('\n').filter((l) => /^const .*require\(/.test(l)).join('\n'), /models|mongoose/);
});

// ---- 4. draft from notice
const NOTICE = `<html><head><title>Mega Private Sector Job Camp 2026 - District Employment Office</title><meta property="og:site_name" content="TN Employment"></head>
<body><h1>Mega Private Sector Job Camp</h1><p>Issued on 01/11/2026</p><p>Venue: Government Arts College, Villupuram</p><p>Date: 05 December 2026, 9 AM</p></body></html>`;
const resp = (body, o = {}) => ({ ok: true, status: 200, url: o.url, headers: { get: () => 'text/html; charset=utf-8' }, text: async () => body, ...o });

test('extraction finds title, the upcoming date and the venue', () => {
  const x = fn.extractFair(NOTICE, 'https://tnvelaivaaippu.gov.in/camp', new Date('2026-11-10'));
  assert.equal(x.title, 'Mega Private Sector Job Camp');
  assert.equal(x.date.toISOString().slice(0, 10), '2026-12-05');
  assert.equal(x.venue, 'Government Arts College, Villupuram');
  assert.equal(x.organiserName, 'TN Employment');
  assert.equal(fn.findDates('on 5th Dec 2026 and Dec 7, 2026 and 31/02/2026').length, 2);
});
test('only public https links are fetched', () => {
  for (const bad of ['http://a.gov.in/x', 'https://localhost/x', 'https://127.0.0.1/x', 'https://10.0.0.5/x', 'https://192.168.1.1/', 'https://169.254.169.254/', 'https://intranet/x', 'javascript:alert(1)', '']) assert.ok(fn.checkUrl(bad).error, bad);
  assert.ok(fn.checkUrl('https://tn.gov.in/notice').url);
});
test('a notice becomes a draft that is never published and has no Supported-by tag yet', async () => {
  const r = await fn.draftFromNotice('https://tn.gov.in/notice', { fetchImpl: async () => resp(NOTICE, { url: 'https://tn.gov.in/notice' }), now: new Date('2026-11-10') });
  assert.equal(r.draft.status, 'draft');
  assert.equal(r.draft.supportedByUs, false);
  assert.equal(r.draft.officialUrl, 'https://tn.gov.in/notice');
  assert.equal(r.draft.kind, 'government');
});
test('fetch failure, timeout, non-html and a page without a date all fail gracefully', async () => {
  const run = (fetchImpl, html) => fn.draftFromNotice('https://tn.gov.in/n', { fetchImpl, timeoutMs: 30 });
  assert.match((await run(async () => { throw new Error('boom'); })).error, /Could not open/);
  assert.match((await run(async () => resp('', { ok: false, status: 404, url: 'https://tn.gov.in/n' }))).error, /404/);
  assert.match((await run(async () => resp('', { url: 'https://tn.gov.in/n', headers: { get: () => 'application/pdf' } }))).error, /not a web page/);
  assert.match((await run(async () => resp('<title>Some Job Camp Notice</title><p>no date</p>', { url: 'https://tn.gov.in/n' }))).error, /date/);
  assert.match((await run(async () => resp('x', { url: 'https://127.0.0.1/n' }))).error, /redirected/);
  const slow = await run((u, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => { const e = new Error('a'); e.name = 'AbortError'; rej(e); })));
  assert.match(slow.error, /too long/);
});
test('the notice route is admin only, drafts only, with no crawler or schedule', () => {
  const c = read('controllers/fairOpsController.js');
  assert.match(c, /status: 'draft'/);
  assert.doesNotMatch(read('utils/fairNotice.js'), /node-cron|setInterval|cron\.schedule/i);
  assert.match(read('routes/jobFairs.js'), /post\('\/admin\/from-notice', verifyToken, authorizeRoles\('admin'\)/);
});
