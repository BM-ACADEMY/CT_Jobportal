const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const Module = require('node:module');
const realLoad = Module._load;
Module._load = function (req, ...a) { return req === 'jsonwebtoken' ? { sign: () => 't', verify: () => ({}) } : req === 'nodemailer' ? { createTransport: () => ({}) } : realLoad.call(this, req, ...a); };
process.env.JWT_SECRET = 'test-only-'.repeat(5);
process.env.FRONTEND_URL = 'https://velaivaaipu.in';
process.env.API_PUBLIC_URL = 'https://api.velaivaaipu.in';
const p = require('../utils/lifecycle/emailPolicy');
const mails = require('../utils/lifecycle/mails');

test('job seekers get the highest weekly allowance', () => {
  assert.ok(p.WEEKLY_CAP.seeker > p.WEEKLY_CAP.company);
  assert.ok(p.WEEKLY_CAP.seeker > p.WEEKLY_CAP.college);
  assert.strictEqual(p.underWeeklyCap('seeker', 2), true);
  assert.strictEqual(p.underWeeklyCap('seeker', 3), false);
});
test('money mails are never held back by the cap', () => {
  assert.ok(p.isTransactional('plan_exp_d1-2026-11-20'));
  assert.ok(p.isTransactional('pay_retry-2026-11-20'));
  assert.ok(p.isTransactional('paid_welcome-abc'));
  assert.ok(!p.isTransactional('weekly-2915'));
  assert.ok(!p.isTransactional('js_profile_incomplete'));
});
test('weekly jobs mail only goes out Tuesday to Thursday IST', () => {
  const day = (d) => new Date(Date.UTC(2026, 10, d, 4)); // 9 Nov 2026 is a Monday
  assert.strictEqual(p.isDigestDay(day(9)), false);
  assert.strictEqual(p.isDigestDay(day(10)), true);
  assert.strictEqual(p.isDigestDay(day(12)), true);
  assert.strictEqual(p.isDigestDay(day(13)), false);
  assert.strictEqual(p.isDigestDay(day(15)), false);
});
test('people who just applied are left alone', () => {
  const now = Date.now();
  assert.strictEqual(p.recentlyApplied(new Date(now - 3600000), now), true);
  assert.strictEqual(p.recentlyApplied(new Date(now - 3 * 86400000), now), false);
  assert.strictEqual(p.recentlyApplied(null, now), false);
});
test('a payment is linked to the newest non-money mail in the 7 days before it', () => {
  const t = (d) => new Date(Date.UTC(2026, 10, d));
  const logs = [
    { user: 'a', key: 'js_profile_incomplete', sentAt: t(1) },
    { user: 'a', key: 'weekly-2915', sentAt: t(8) },
    { user: 'a', key: 'plan_exp_d1-x', sentAt: t(9) },
    { user: 'b', key: 'weekly-2915', sentAt: t(8) },
  ];
  assert.strictEqual(p.attribute({ user: 'a', createdAt: t(10) }, logs), 'weekly-2915');
  assert.strictEqual(p.attribute({ user: 'a', createdAt: t(20) }, logs), null);
  assert.strictEqual(p.attribute({ user: 'c', createdAt: t(10) }, logs), null);
});
test('report counts mails and payments per mail type', () => {
  const t = (d) => new Date(Date.UTC(2026, 10, d));
  const logs = [
    { user: 'a', key: 'weekly-2915', sentAt: t(8) }, { user: 'b', key: 'weekly-2915', sentAt: t(8) },
    { user: 'a', key: 'paid_welcome-1', sentAt: t(11) },
  ];
  const rows = p.conversionReport(logs, [{ user: 'a', createdAt: t(10), amount: 590, baseAmount: 500 }]);
  const w = rows.find((r) => r.kind === 'weekly');
  assert.strictEqual(w.sent, 2);
  assert.strictEqual(w.paymentsFollowed, 1);
  assert.strictEqual(w.amount, 500);
  assert.ok(!rows.find((r) => r.kind.startsWith('paid_welcome')));
});
test('new mails: one button, unsubscribe in the footer, honest copy', () => {
  const user = { _id: '507f1f77bcf86cd799439011', name: 'Priya S' };
  const jobs = [{ _id: '1', title: 'Accountant', location: 'Puducherry', company: { name: 'ABC' }, why: ['Skills match'] }];
  const w = mails.wrap(mails.weeklyJobs(user, jobs), user._id);
  assert.match(w.html, /unsubscribe/i);
  assert.match(w.html, /utm_campaign=weekly_jobs/);
  assert.strictEqual((w.html.match(/Accountant/g) || []).length >= 1, true);
  const pw = mails.wrap(mails.paidWelcome(user, { audience: 'seeker', itemName: 'Premium' }), user._id);
  assert.match(pw.subject, /Premium/);
  assert.match(pw.html, /unsubscribe/i);
  assert.ok(!/(hurry|last chance|only today|act now)/i.test(w.html + pw.html));
});
test('cron wiring: cap applied, new rules registered, job seekers first, engine still behind its flag', () => {
  const src = fs.readFileSync(require.resolve('../cron/lifecycleMails.js'), 'utf8');
  assert.match(src, /underWeeklyCap/);
  assert.match(src, /for \(const rule of \[paidWelcome, profileIncomplete/);
  assert.match(src, /weeklyJobs/);
  assert.match(src, /LIFECYCLE_EMAILS_ENABLED === 'true'/);
  assert.match(src, /marketingOptOut/);
});
test('email report is admin only and does not touch plans or prices', () => {
  const routes = fs.readFileSync(require.resolve('../routes/adminRoutes.js'), 'utf8');
  const i = routes.indexOf("router.use(authorizeRoles('admin'))");
  assert.ok(i > 0 && routes.indexOf('/email-report') > i);
  const code = fs.readFileSync(require.resolve('../controllers/emailReportController.js'), 'utf8').replace(/\/\/.*$/gm, '');
  assert.ok(!/razorpay|\.save\(|updateOne|create\(/i.test(code));
});

test('recruiter and drive mails: honest, one button, unsubscribe, cap applies', () => {
  const u = { _id: '507f1f77bcf86cd799439011', name: 'Ravi K' };
  const job = { title: 'Sales Executive', validThrough: new Date(Date.now() + 2 * 86400000) };
  const drive = { title: 'Walk-in Hiring' };
  const all = [
    mails.wrap(mails.applicantsWeekly(u, { total: 4, pending: 3, topJob: 'Sales Executive' }), u._id),
    mails.wrap(mails.jobClosing(u, job, { shortLife: true }), u._id),
    mails.wrap(mails.jobClosing(u, job, { shortLife: false }), u._id),
    mails.wrap(mails.drivePre(u, drive, { registered: 12 }), u._id),
    mails.wrap(mails.drivePost(u, drive, { registered: 12, checkedIn: 9 }), u._id),
  ];
  for (const m of all) {
    assert.match(m.html, /unsubscribe/i);
    assert.ok(!/(hurry|last chance|act now|only today)/i.test(m.html));
  }
  assert.match(all[1].html, /14 days/);
  assert.ok(!/14 days/.test(all[2].html));
  const src = fs.readFileSync(require.resolve('../cron/lifecycleMails.js'), 'utf8');
  assert.match(src, /driveOrganiser, applicantsWeekly, jobClosing/);
});
