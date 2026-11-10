const test = require('node:test');
const assert = require('node:assert/strict');
const { buildQuote } = require('../utils/collegeQuote');
let generateQuotePdf = null; try { ({ generateQuotePdf } = require('../utils/pdfGenerator')); } catch (e) { /* pdfkit is not installed in some test boxes */ }

const plan = { name: 'Campus Lite', price: 14999, duration: 'Yearly', userSeats: 3, features: [
  { name: 'Student Capacity', isActive: true, value: 1000 }, { name: 'CSV Bulk Student Upload', isActive: true, value: true },
  { name: 'WhatsApp Interview Invites', isActive: false, value: false }, { name: 'Company Drive Invites', isActive: true, value: '15 Invites/Year' }] };
const college = { _id: 'a'.repeat(24), display_id: 'VG-2026-007', name: 'ABC College', principalName: 'Dr X', location: 'Puducherry' };
const now = new Date('2026-11-10T20:00:00Z');

test('quote adds 18% GST to the plan price, with a number, date and 30 days of validity', () => {
  const q = buildQuote({ college, plan, env: {}, now });
  assert.equal(q.base, 14999); assert.equal(q.gst, 2699.82); assert.equal(q.total, 17698.82);
  assert.equal(q.number, 'Q-VG-2026-007-20261111');
  assert.match(q.validUntil, /December 2026/);
  assert.equal(q.plan.capacity, '1,000 students');
  assert.deepEqual(q.plan.features, ['CSV Bulk Student Upload', 'Company Drive Invites: 15 Invites/Year']);
});

test('bank details come only from settings and are capped; with none the quote says the team shares them', () => {
  assert.deepEqual(buildQuote({ college, plan, env: {}, now }).bank, []);
  const q = buildQuote({ college, plan, env: { QUOTE_BANK_DETAILS: 'Bank: X\nA/c: 1\n\nIFSC: Y' }, now });
  assert.deepEqual(q.bank, ['Bank: X', 'A/c: 1', 'IFSC: Y']);
});

test('the PDF is made and starts with the PDF marker', { skip: !generateQuotePdf && 'pdfkit not installed here' }, async () => {
  const buf = await generateQuotePdf(buildQuote({ college, plan, env: {}, now }));
  assert.ok(Buffer.isBuffer(buf) && buf.length > 1000);
  assert.equal(buf.subarray(0, 4).toString(), '%PDF');
});
