const test = require('node:test');
const assert = require('node:assert');
const { academyReason, coreReason, cleanLeadStatus, toCsv } = require('../utils/brandLeads');

test('academy: many applications, none shortlisted', () => {
  assert.match(academyReason({ applications: 6, shortlisted: 0 }), /6 jobs/);
  assert.strictEqual(academyReason({ applications: 6, shortlisted: 1 }), null);
  assert.strictEqual(academyReason({ applications: 2, shortlisted: 0 }), null);
});
test('academy: failed tests give a reason', () => {
  assert.match(academyReason({ failedTests: 2 }), /2 skill tests/);
});
test('coretalents: frequent, stale or large hiring', () => {
  assert.match(coreReason({ jobs: 3 }), /3 jobs/);
  assert.match(coreReason({ staleJobs: 1 }), /3\+ weeks/);
  assert.match(coreReason({ vacancies: 12 }), /12 vacancies/);
  assert.strictEqual(coreReason({ jobs: 1 }), null);
});
test('status only from the allowed list', () => {
  assert.strictEqual(cleanLeadStatus('called'), 'called');
  assert.strictEqual(cleanLeadStatus('hacked'), null);
});
test('csv escapes quotes and formula starts', () => {
  const out = toCsv([{ name: '=cmd', email: 'a"b@x.com', phone: '', city: '', reason: 'r', status: 'new', note: '' }]);
  assert.ok(out.includes(`"'=cmd"`));
  assert.ok(out.includes('"a""b@x.com"'));
});

const { academyLead, coreLead, isFinalYear, wantsAcademyProgram, cleanFollowUp } = require('../utils/brandLeads');

test('academy leads get more reasons and a priority score', () => {
  assert.strictEqual(academyLead({}), null);
  assert.strictEqual(academyLead({ applications: 0, daysSinceSignup: 1 }), null);
  const a = academyLead({ applications: 0, daysSinceSignup: 5 });
  assert.match(a.reason, /5 days ago, no application/); assert.strictEqual(a.score, 1);
  const b = academyLead({ programInterest: true, finalYear: true, failedTests: 2, applications: 6, shortlisted: 0 });
  assert.match(b.reason, /digital marketing or data analytics/); assert.match(b.reason, /Final-year/); assert.match(b.reason, /2 skill tests/);
  assert.ok(b.score > a.score);
  assert.strictEqual(academyReason({ applications: 6, shortlisted: 0 }), 'Applied to 6 jobs, never shortlisted');
});

test('core leads rank stale jobs above a plain job count', () => {
  assert.ok(coreLead({ staleJobs: 1 }).score > coreLead({ jobs: 3 }).score);
  assert.strictEqual(coreLead({ jobs: 1 }), null);
});

test('final year and program interest are read from the profile', () => {
  const y = new Date().getFullYear();
  assert.strictEqual(isFinalYear([{ currentlyPursuing: true, endYear: String(y) }]), true);
  assert.strictEqual(isFinalYear([{ currentlyPursuing: true, endYear: String(y + 3) }]), false);
  assert.strictEqual(isFinalYear([{ currentlyPursuing: false, endYear: String(y) }]), false);
  assert.strictEqual(isFinalYear(undefined), false);
  assert.strictEqual(wantsAcademyProgram({ headline: 'Aspiring Digital Marketing executive' }), true);
  assert.strictEqual(wantsAcademyProgram({ skills: ['Power BI'] }), true);
  assert.strictEqual(wantsAcademyProgram({ headline: 'Driver', skills: ['Driving'] }), false);
});

test('follow-up dates are strict: a real date, empty to clear, anything else refused', () => {
  assert.ok(cleanFollowUp('2026-11-20') instanceof Date);
  assert.strictEqual(cleanFollowUp(''), null);
  assert.strictEqual(cleanFollowUp(null), null);
  assert.strictEqual(cleanFollowUp('20-11-2026'), undefined);
  assert.strictEqual(cleanFollowUp({ $gt: '' }), undefined);
  assert.strictEqual(cleanFollowUp('2026-13-45'), undefined);
});

test('the csv adds priority, follow-up and last contacted', () => {
  const out = toCsv([{ name: 'A', email: 'a@x.com', phone: '', city: '', reason: 'r', status: 'new', note: '', score: 4, followUpAt: '2026-11-20T00:00:00Z', lastContactedAt: null }]);
  assert.ok(out.split('\n')[0].endsWith('Priority,Follow-up,Last contacted'));
  assert.ok(out.includes('"4","2026-11-20",""'));
});
