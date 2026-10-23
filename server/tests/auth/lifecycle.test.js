const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const crypto = require('crypto');

process.env.JWT_SECRET = 'y'.repeat(40);
process.env.FRONTEND_URL = 'https://velaivaaipu.in';
process.env.API_PUBLIC_URL = 'https://api.velaivaaipu.in';

// No SMTP and no real jsonwebtoken needed here.
const realLoad = Module._load;
let jwtImpl;
try { jwtImpl = require('jsonwebtoken'); } catch {
  const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const mac = (d, s) => crypto.createHmac('sha256', s).update(d).digest('base64url');
  jwtImpl = {
    sign: (p, s) => { const body = `${b64({ alg: 'HS256' })}.${b64(p)}`; return `${body}.${mac(body, s)}`; },
    verify: (t, s) => { const [h, p, sig] = String(t).split('.'); if (!sig || mac(`${h}.${p}`, s) !== sig) throw new Error('bad'); return JSON.parse(Buffer.from(p, 'base64url').toString()); },
  };
}
Module._load = function (request, ...rest) {
  if (request === 'jsonwebtoken') return jwtImpl;
  if (/utils\/sendEmail$|^\.\/sendEmail$/.test(request)) return async () => true;
  if (request === 'nodemailer') return { createTransport: () => ({ sendMail: async () => ({}) }) };
  return realLoad.call(this, request, ...rest);
};

const mails = require('../../utils/lifecycle/mails');
const { rankJobsForUser, alertFrequency } = require('../../utils/lifecycle/jobMatch');
const { computeBatchStats, periodId } = require('../../utils/lifecycle/stats');
const { verifyAlertToken, signAlertToken, sendWelcomeEmail } = require('../../utils/lifecycleEmails');

const user = { _id: '64b000000000000000000001', name: 'Priya Raman', email: 'priya@example.com' };
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').split(/\s+/).filter(Boolean);
const job = (over) => ({ _id: '64b0000000000000000000aa', title: 'Sales Executive', location: 'Pondicherry', skillsRequired: [], createdAt: new Date(), company: { name: 'Acme' }, ...over });

const all = () => [
  mails.profileIncomplete(user, 40),
  mails.skillTestInvite(user),
  mails.profileIncomplete(user, 55, 'second'),
  mails.profileIncomplete(user, 55, 'monthly'),
  mails.companyProfileIncomplete(user),
  mails.collegeVerify(user, { name: 'ABC College' }),
  mails.collegeFirstDrive(user, { name: 'ABC College' }),
  mails.collegeFirstStudents(user, { name: 'ABC College' }),
  mails.skillGap(user, { label: 'MS Excel', percent: 40, course: 'Data Analytics with Power BI', courseUrl: 'https://learnwithkamar.ai' }),
  mails.jobsForYou(user, [job({}), job({ title: 'Accountant' })], { paid: true, frequency: 'Weekly' }),
  mails.jobsForYou(user, [job({})], { paid: false }),
  mails.firstJobTips(user),
  mails.postJobTemplates(user),
  mails.batchReadiness(user, { name: 'ABC College' }, { registered: 120, tested: 80, passRate: 55, avgPercent: 58, best: 'MS Excel', weakest: 'Communication / English' }),
];

test('every lifecycle mail is under 120 words and has exactly one button', () => {
  for (const m of all()) {
    assert.ok(text(m.html).length < 120, `${m.subject}: ${text(m.html).length} words`);
    assert.equal((m.html.match(/background:#059669/g) || []).length, 1, `${m.subject}: one button`);
  }
});

test('mails are personalised and carry no false urgency or job guarantee', () => {
  for (const m of all()) {
    assert.match(m.html, /Priya/);
    assert.doesNotMatch(`${m.subject} ${m.html}`, /guarantee|100%|seats? left|last chance|only \d+ left/i);
  }
});

test('wrapped mail has the unsubscribe link and the company footer', () => {
  const w = mails.wrap(all()[0], user._id);
  assert.match(w.html, /\/api\/public\/unsubscribe\?token=/);
  assert.match(w.html, /Afra Ventures Private Limited/);
});

test('lifecycle mail carries the one-click List-Unsubscribe headers', () => {
  const w = mails.wrap(all()[0], user._id);
  assert.match(w.headers['List-Unsubscribe'], /^<https:\/\/api\.velaivaaipu\.in\/api\/public\/unsubscribe\?token=.+>$/);
  assert.equal(w.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
});

test('unsubscribe tokens are signed, purpose-bound and cannot be reused as other tokens', () => {
  const token = signAlertToken(user._id, 'off');
  assert.equal(verifyAlertToken(token).uid, user._id);
  assert.equal(verifyAlertToken(token + 'x'), null);
  assert.equal(verifyAlertToken('nonsense'), null);
  const login = jwtImpl.sign({ id: user._id, role: 'admin' }, process.env.JWT_SECRET);
  assert.equal(verifyAlertToken(login), null, 'a login token must not work as an unsubscribe token');
});

test('job matching ranks by skills, title and city and drops non-matches', () => {
  const u = { profile: { skills: ['Excel', 'Tally'], location: 'Pondicherry', preferredRole: 'Accountant', jobPreferences: {} } };
  const jobs = [
    job({ _id: 'a', title: 'Delivery Boy', location: 'Chennai' }),
    job({ _id: 'b', title: 'Accountant', location: 'Pondicherry', skillsRequired: ['Tally', 'Excel'] }),
    job({ _id: 'c', title: 'Sales Executive', location: 'Pondicherry' }),
  ];
  const ranked = rankJobsForUser(u, jobs, 5).map((j) => j._id);
  assert.deepEqual(ranked, ['b', 'c']);
});

test('alert frequency follows the plan or an active pay-per feature, and respects expiry', () => {
  const now = new Date('2026-10-22T00:00:00Z');
  assert.equal(alertFrequency({ subscriptionDetails: { jobAlerts: 'Weekly' }, subscriptionExpiry: new Date('2027-01-01') }, now), 'Weekly');
  assert.equal(alertFrequency({ subscriptionDetails: { jobAlerts: 'Weekly' }, subscriptionExpiry: new Date('2026-01-01') }, now), null);
  assert.equal(alertFrequency({ subscriptionDetails: { jobAlerts: 'None' } }, now), null);
  assert.equal(alertFrequency({ purchasedFeatures: [{ isActive: true, featureKey: 'jobAlerts', expiresAt: new Date('2026-11-01') }] }, now), 'Daily');
  assert.equal(alertFrequency({ purchasedFeatures: [{ isActive: true, featureKey: 'jobAlerts', expiresAt: new Date('2026-10-01') }] }, now), null);
});

test('batch readiness stats', () => {
  const s = (rows) => ({ assessmentScores: rows.map(([category, score, total]) => ({ category, score, total, skill: category })) });
  const stats = computeBatchStats([s([['ms-excel', 8, 10]]), s([['ms-excel', 4, 10]]), s([['communication', 3, 10]]), s([])]);
  assert.equal(stats.registered, 4);
  assert.equal(stats.tested, 3);
  assert.equal(stats.passRate, 33);
  assert.equal(stats.best, 'MS Excel');
  assert.equal(stats.weakest, 'Communication / English');
});

test('period id changes only at the period boundary', () => {
  assert.equal(periodId(7, new Date('2026-10-22T05:00:00Z')), periodId(7, new Date('2026-10-22T20:00:00Z')));
  assert.notEqual(periodId(1, new Date('2026-10-22T05:00:00Z')), periodId(1, new Date('2026-10-23T05:00:00Z')));
});

test('placeholder campus emails never get a welcome mail', async () => {
  assert.equal(await sendWelcomeEmail({ _id: 'x', name: 'A', email: '9876543210@abc.portal' }, 'jobseeker'), false);
});
