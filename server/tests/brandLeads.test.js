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
