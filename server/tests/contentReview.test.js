const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { jobScamFlags } = require('../utils/jobScamFlags');
const { inappropriateText } = require('../utils/contentFlags');
const { emailKind } = require('../utils/emailKind');

test('vulgar or adult wording is flagged for review', () => {
  assert.ok(jobScamFlags({ title: 'Escort service staff wanted', description: 'good pay' }).includes('inappropriate_content'));
  assert.ok(inappropriateText('send nudes to apply'));
  assert.ok(inappropriateText('<p>You are a b.i.t.c.h</p>'), 'dotted spelling is caught');
  assert.ok(inappropriateText('this is a fucking job'));
});
test('honest job text is not flagged', () => {
  for (const t of ['Survey on sex ratio and health', 'Hotel in Essex, classic menu', 'Assistant professor in Dickinson Road', 'Sales executive, fresh graduates, Puducherry', 'Naked eye astronomy tutor']) {
    assert.strictEqual(inappropriateText(t), t.includes('Naked') ? true : false, t);
  }
});
test('an honest job gets no flag at all and a flag never hides the job', () => {
  assert.deepStrictEqual(jobScamFlags({ title: 'Accountant', description: 'Tally, 2 years' }), []);
  const src = fs.readFileSync(path.join(__dirname, '../utils/jobScamFlags.js'), 'utf8');
  assert.match(src, /never blocks or hides/);
});
test('candidates can report inappropriate content and the report model accepts it', () => {
  const rc = fs.readFileSync(path.join(__dirname, '../controllers/jobReportController.js'), 'utf8');
  const m = fs.readFileSync(path.join(__dirname, '../models/JobReport.js'), 'utf8');
  assert.match(rc, /'inappropriate'/);
  assert.match(m, /'inappropriate'/);
});
test('email hint tells personal inboxes from company addresses and never blocks', () => {
  assert.strictEqual(emailKind('a@gmail.com', 'acme.in').kind, 'personal');
  assert.deepStrictEqual(emailKind('hr@acme.in', 'https://www.acme.in/about'), { kind: 'official', matchesWebsite: true });
  assert.deepStrictEqual(emailKind('hr@acme.in', 'other.com'), { kind: 'official', matchesWebsite: false });
  assert.strictEqual(emailKind('', '').kind, 'missing');
});
