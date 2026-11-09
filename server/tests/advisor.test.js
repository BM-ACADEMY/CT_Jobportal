const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../utils/advisorMetrics');
const { runAdvisor } = require('../utils/advisorService');
const runWeekly = require('../cron/advisorWeekly');

const def = (k) => M.METRICS.find((m) => m.key === k);

test('growth numbers are judged against last week', () => {
  assert.equal(M.rate(def('applications'), 100, 100), 'green');
  assert.equal(M.rate(def('applications'), 85, 100), 'amber');
  assert.equal(M.rate(def('applications'), 60, 100), 'red');
  assert.equal(M.rate(def('applications'), 0, 0), 'amber');
  assert.equal(M.rate(def('applications'), 5, 0), 'green');
});

test('ceiling numbers use fixed limits', () => {
  assert.equal(M.rate(def('failedPayments'), 0), 'green');
  assert.equal(M.rate(def('failedPayments'), 1), 'amber');
  assert.equal(M.rate(def('failedPayments'), 4), 'red');
  assert.equal(M.rate(def('ticketsWaiting'), 7), 'green');
});

test('the prompt carries totals only and forbids changing prices', () => {
  const p = M.buildPrompt(M.buildMetrics({ newJobSeekers: 40 }, { newJobSeekers: 50 }));
  assert.match(p, /New job seekers: 40 \(last week 50/);
  assert.match(p, /never suggest changing prices, plans, payments or settings/);
  assert.doesNotMatch(p, /@/);
  assert.match(M.buildPrompt([], 'why fewer signups?'), /why fewer signups\?/);
});

test('AI reply: ideas without a number are dropped, lists are capped, junk is refused', () => {
  const ok = M.parseAdvice('```json\n' + JSON.stringify({ summary: 'Signups fell 20%.', good: ['a', 'b', 'c', 'd'], bad: [], ideas: [
    { title: 'Find 5 hospitals', reason: 'Few jobs', numbers: '40 candidates, 2 jobs' }, { title: 'Be better', reason: 'x', numbers: 'a lot' },
    { title: 'i3', numbers: '1' }, { title: 'i4', numbers: '2' }, { title: 'i5', numbers: '3' }] }) + '\n```');
  assert.equal(ok.good.length, 3); assert.equal(ok.ideas.length, 3); assert.equal(ok.ideas[0].title, 'Find 5 hospitals');
  assert.equal(M.parseAdvice('not json'), null);
  assert.equal(M.parseAdvice('{"summary":""}'), null);
});

test('monthly cap', () => {
  assert.equal(M.monthlyCap({}), 20); assert.equal(M.monthlyCap({ ADVISOR_MONTHLY_AI_CAP: '3' }), 3); assert.equal(M.monthlyCap({ ADVISOR_MONTHLY_AI_CAP: 'x' }), 20);
  assert.equal(M.capReached(3, 3), true); assert.equal(M.capReached(2, 3), false);
});

const makeDeps = (aiUsedCount = 0) => {
  const reports = []; const ideas = [];
  const count = async () => 7;
  return { reports, ideas, deps: {
    Role: { findOne: async () => ({ _id: 's' }), find: async () => [{ _id: 'r' }] },
    User: { countDocuments: count }, Job: { countDocuments: count }, Application: { countDocuments: count },
    Payment: { countDocuments: count, aggregate: async () => [{ total: 1998 }] },
    Ticket: { countDocuments: count }, College: { countDocuments: count },
    AdvisorReport: { countDocuments: async () => aiUsedCount, create: async (d) => { const r = { _id: `r${reports.length}`, ...d }; reports.push(r); return r; } },
    AdvisorIdea: { create: async (d) => { const i = { _id: `i${ideas.length}`, ...d }; ideas.push(i); return i; } },
  } };
};
const good = async () => JSON.stringify({ summary: 'Fine.', good: ['x'], bad: [], ideas: [{ title: 'Call 5 hospitals', reason: 'few jobs', numbers: '7 jobs' }] });

test('a weekly run saves numbers from code, the AI wording and its ideas', async () => {
  const { reports, ideas, deps } = makeDeps();
  const r = await runAdvisor({ deps, callAI: good });
  assert.equal(r.capped, false); assert.equal(reports[0].aiUsed, true); assert.equal(ideas.length, 1);
  assert.equal(reports[0].metrics.find((m) => m.key === 'revenue').value, 1998);
  assert.equal(ideas[0].report, reports[0]._id);
});

test('an AI failure still saves the numbers and says why', async () => {
  const { reports, ideas, deps } = makeDeps();
  await runAdvisor({ deps, callAI: async () => { throw new Error('boom'); } });
  assert.equal(reports[0].aiUsed, false); assert.match(reports[0].aiError, /AI unavailable: boom/); assert.equal(reports[0].metrics.length, 10); assert.equal(ideas.length, 0);
});

test('the monthly cap stops AI calls but still saves the numbers', async () => {
  const { reports, deps } = makeDeps(20); let called = false;
  const r = await runAdvisor({ deps, callAI: async () => { called = true; return '{}'; } });
  assert.equal(r.capped, true); assert.equal(called, false); assert.match(reports[0].aiError, /limit/i);
});

test('a question is saved as an answer', async () => {
  const { reports, deps } = makeDeps();
  await runAdvisor({ deps, callAI: async () => '{"summary":"Because 7 fewer."}', question: 'why fewer signups?' });
  assert.equal(reports[0].kind, 'question'); assert.equal(reports[0].summary, 'Because 7 fewer.');
});

test('the weekly job is off by default', async () => {
  assert.deepEqual(await runWeekly({ env: {}, deps: {}, callAI: async () => '' }), { skipped: true });
  const { deps } = makeDeps();
  assert.ok((await runWeekly({ env: { ADVISOR_ENABLED: 'true' }, deps, callAI: good })).id);
});
