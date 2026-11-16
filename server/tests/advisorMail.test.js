const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAdvisorMail, emailAdvisorNote } = require('../utils/advisorMail');
const runWeekly = require('../cron/advisorWeekly');

const report = { metrics: [{ key: 'a', label: 'New job seekers', value: 40, previous: 50, status: 'amber' }], summary: 'Signups <fell>.', good: ['x'], bad: ['y'] };

test('advisor mail escapes text and shows numbers', () => {
  const m = buildAdvisorMail(report, { frontendUrl: 'https://x.in/' });
  assert.match(m.html, /Signups &lt;fell&gt;/);
  assert.match(m.html, /New job seekers/);
  assert.match(m.html, /https:\/\/x\.in\/admin\/advisor/);
});

test('emailAdvisorNote sends only when ADVISOR_ENABLED=true and never crashes with no recipients', async () => {
  const sent = [];
  const send = async (o) => { sent.push(o.email); return true; };
  assert.deepEqual(await emailAdvisorNote(report, { env: {}, recipients: ['a@b.in'], send }), { sent: 0, skipped: true });
  assert.equal((await emailAdvisorNote(report, { env: { ADVISOR_ENABLED: 'true' }, recipients: [], send })).noRecipients, true);
  assert.equal((await emailAdvisorNote(report, { env: { ADVISOR_ENABLED: 'true' }, recipients: ['a@b.in', 'c@d.in'], send })).sent, 2);
  assert.deepEqual(sent, ['a@b.in', 'c@d.in']);
});

test('weekly run: a failing mailer never fails the run and the flag still gates it', async () => {
  assert.deepEqual(await runWeekly({ env: {}, deps: {}, callAI: async () => '', mailer: async () => { throw new Error('x'); } }), { skipped: true });
});
