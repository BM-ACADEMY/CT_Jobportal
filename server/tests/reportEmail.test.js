const test = require('node:test');
const assert = require('node:assert/strict');
const { reportRecipients, sendReportAgain } = require('../utils/reportEmail');

const college = { name: 'ABC <College>', principalName: 'Dr X', principalEmail: 'Principal@abc.edu', additionalReportRecipients: ['dean@abc.edu', 'principal@abc.edu', 'bad-email', ''] };
const report = { frequency: 'monthly', periodLabel: 'Month of 1 Nov 2026', reportUrl: '/uploads/r.pdf', stats: { placed: 5, totalStudents: 20, successRate: 25 } };
const wrap = (t, b) => `${t}|${b}`;

test('recipients: principal first, no duplicates, bad addresses dropped', () => {
  assert.deepEqual(reportRecipients(college), ['principal@abc.edu', 'dean@abc.edu']);
  assert.deepEqual(reportRecipients({}), []);
});

test('sends to everyone, escapes the college name, and says who got it', async () => {
  const sent = [];
  const r = await sendReportAgain({ college, report: { ...report }, sendEmail: async (m) => { sent.push(m); return true; }, emailWrapper: wrap, frontendUrl: 'https://velaivaaipu.in' });
  assert.equal(r.ok, true); assert.deepEqual(r.sentTo, ['principal@abc.edu', 'dean@abc.edu']);
  assert.equal(sent.length, 2);
  assert.ok(!sent[0].html.includes('<College>') && sent[0].html.includes('&lt;College&gt;'));
  assert.ok(sent[0].html.includes('https://velaivaaipu.in/uploads/r.pdf'));
});

test('no email on file, sent a moment ago, and email failure each get a plain answer', async () => {
  const ok = async () => true;
  assert.equal((await sendReportAgain({ college: { name: 'X' }, report, sendEmail: ok, emailWrapper: wrap, frontendUrl: '' })).code, 400);
  const now = new Date('2026-11-10T10:00:00Z');
  assert.equal((await sendReportAgain({ college, report: { ...report, sentAt: new Date('2026-11-10T09:58:00Z') }, sendEmail: ok, emailWrapper: wrap, frontendUrl: '', now })).code, 429);
  assert.equal((await sendReportAgain({ college, report: { ...report, sentAt: new Date('2026-11-10T09:50:00Z') }, sendEmail: ok, emailWrapper: wrap, frontendUrl: '', now })).ok, true);
  assert.equal((await sendReportAgain({ college, report, sendEmail: async () => { throw new Error('x'); }, emailWrapper: wrap, frontendUrl: '' })).code, 502);
  assert.equal((await sendReportAgain({ college, report, sendEmail: async () => false, emailWrapper: wrap, frontendUrl: '' })).code, 502);
});
