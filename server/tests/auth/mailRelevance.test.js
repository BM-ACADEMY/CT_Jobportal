const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'z'.repeat(40);
process.env.FRONTEND_URL = 'https://velaivaaipu.in';
process.env.API_PUBLIC_URL = 'https://api.velaivaaipu.in';
const { rankForMail, rankJobsForUser } = require('../../utils/lifecycle/jobMatch');
const { rankJobsForSeeker } = require('../../utils/relevance');
const mails = require('../../utils/lifecycle/mails');

const NOW = new Date('2026-11-01T10:00:00Z');
const daysAgo = (d) => new Date(NOW.getTime() - d * 86400000);
const user = {
  _id: 'u1', name: 'Priya Raman',
  profile: { skills: ['MS Excel', 'Tally'], preferredRole: 'Accounts Assistant', location: 'Pondicherry', profileCompletion: 80, qualification: [{ degree: 'B.Com' }], experience: [], jobPreferences: { locationTypes: ['On-site'], onSiteLocations: [{ city: 'Pondicherry' }] } },
};
const job = (over = {}) => ({ _id: 'j1', title: 'Accounts Assistant', status: 'active', skillsRequired: ['Excel', 'Tally'], location: 'Pondicherry', workMode: 'On-site', experience: { min: 0, max: 2 }, createdAt: daysAgo(1), validThrough: daysAgo(-20), company: { name: 'Acme' }, ...over });
const ON = { RELEVANCE_ENGINE_ENABLED: 'true' };

test('switch off: the original ranker is used and no why-line is attached', () => {
  const jobs = [job({ _id: 'a' }), job({ _id: 'b', skillsRequired: ['Welding'], title: 'Welder', location: 'Delhi' })];
  const out = rankForMail(user, jobs, 5, { env: {}, now: NOW });
  assert.deepEqual(out.map((j) => j._id), rankJobsForUser(user, jobs, 5).map((j) => j._id));
  assert.ok(out.every((j) => j.why === undefined));
});

test('switch on: same order as the website feed, with a why-line on each job', () => {
  const jobs = [job({ _id: 'old', createdAt: daysAgo(20) }), job({ _id: 'new' }), job({ _id: 'welder', title: 'Welder', skillsRequired: ['Welding'], location: 'Delhi' })];
  const mail = rankForMail(user, jobs, 5, { env: ON, now: NOW });
  const site = rankJobsForSeeker(user, jobs, { minScore: 15, now: NOW }).map((r) => r.job._id);
  assert.deepEqual(mail.map((j) => j._id), site);
  assert.ok(!mail.some((j) => j._id === 'welder'));
  assert.ok(mail.every((j) => Array.isArray(j.why) && j.why.length > 0));
});

test('switch on: jobs already applied to are not mailed, and a thin profile gets no mail', () => {
  const jobs = [job({ _id: 'applied' }), job({ _id: 'fresh' })];
  assert.deepEqual(rankForMail(user, jobs, 5, { env: ON, now: NOW, appliedJobIds: ['applied'] }).map((j) => j._id), ['fresh']);
  const thin = { _id: 'u2', profile: { location: 'Pondicherry', profileCompletion: 5, skills: [], jobPreferences: {} } };
  assert.deepEqual(rankForMail(thin, jobs, 5, { env: ON, now: NOW }), []);
});

test('the limit is honoured', () => {
  const jobs = Array.from({ length: 8 }, (_, i) => job({ _id: `j${i}`, createdAt: daysAgo(i) }));
  assert.equal(rankForMail(user, jobs, 3, { env: ON, now: NOW }).length, 3);
});

test('the mail shows "Why this job" only when reasons exist, and escapes them', () => {
  const withWhy = mails.jobsForYou(user, [{ _id: 'j1', title: 'Accounts Assistant', company: { name: 'Acme' }, location: 'Pondicherry', why: ['Matches Excel, Tally', 'In <b>Pondicherry</b>'] }], { paid: true, frequency: 'Daily' });
  assert.match(withWhy.html, /Why this job: Matches Excel, Tally &middot; In &lt;b&gt;Pondicherry&lt;\/b&gt;/);
  const without = mails.jobsForYou(user, [{ _id: 'j1', title: 'Accounts Assistant', company: { name: 'Acme' }, location: 'Pondicherry' }], { paid: false });
  assert.ok(!/Why this job/.test(without.html));
});
