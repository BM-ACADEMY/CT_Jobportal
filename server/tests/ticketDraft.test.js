const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMessages, cleanDraft } = require('../utils/ticketDraft');

test('the AI prompt carries the problem but no email, name or phone', () => {
  const m = buildMessages({ category: 'payment_checkout', severity: 'major', userRole: 'jobseeker', accountIdentity: 'secret@x.com', user: { name: 'Ravi', email: 'r@x.com' }, diagnostics: { paymentMode: 'UPI', detailedDescription: 'Paid but plan not active' } });
  const all = JSON.stringify(m);
  assert.ok(all.includes('Paid but plan not active'));
  assert.ok(!all.includes('secret@x.com') && !all.includes('Ravi') && !all.includes('r@x.com'));
});
test('long free text is clipped and an empty ticket still works', () => {
  const m = buildMessages({ diagnostics: { detailedDescription: 'x'.repeat(5000) } });
  assert.ok(m[1].content.length < 700);
  assert.ok(buildMessages({})[1].content.includes('No details given'));
});
test('draft text is trimmed and capped', () => {
  assert.equal(cleanDraft('  hi \r\n'), 'hi');
  assert.equal(cleanDraft(null), '');
  assert.equal(cleanDraft('a'.repeat(3000)).length, 1500);
});
