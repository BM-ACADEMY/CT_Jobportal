const test = require('node:test');
const assert = require('node:assert');

const load = () => import('../../client/src/utils/popularSearches.js');
const NOW = new Date('2026-11-06T00:00:00Z');
const job = (title, extra = {}) => ({ title, status: 'active', createdAt: '2026-11-01T00:00:00Z', ...extra });

test('cleanTitle keeps the role and drops the location or shift', async () => {
  const { cleanTitle } = await load();
  assert.strictEqual(cleanTitle('Telecaller - Puducherry'), 'Telecaller');
  assert.strictEqual(cleanTitle('Sales Executive (Night Shift)'), 'Sales Executive');
  assert.strictEqual(cleanTitle('Accountant, Chennai'), 'Accountant');
  assert.strictEqual(cleanTitle('X'), '');
  assert.strictEqual(cleanTitle('A very long job title that would break the chip layout badly'), '');
});

test('most common title comes first and duplicates are merged', async () => {
  const { popularTerms } = await load();
  const out = popularTerms([
    job('Telecaller - Puducherry'), job('telecaller'), job('Telecaller (Day)'),
    job('Accountant'), job('Sales Executive'),
  ], { now: NOW });
  assert.strictEqual(out[0], 'Telecaller');
  assert.strictEqual(out.length, 3);
});

test('ties go to the newest job', async () => {
  const { popularTerms } = await load();
  const out = popularTerms([
    job('Accountant', { createdAt: '2026-10-01T00:00:00Z' }),
    job('Cashier', { createdAt: '2026-11-04T00:00:00Z' }),
  ], { now: NOW });
  assert.deepStrictEqual(out, ['Cashier', 'Accountant']);
});

test('closed, draft and expired jobs never make a chip', async () => {
  const { popularTerms } = await load();
  const out = popularTerms([
    job('Closed Role', { status: 'closed' }),
    job('Draft Role', { status: 'draft' }),
    job('Old Role', { validThrough: '2026-10-01T00:00:00Z' }),
    job('Open Role', { validThrough: '2026-12-01T00:00:00Z' }),
  ], { now: NOW });
  assert.deepStrictEqual(out, ['Open Role']);
});

test('no jobs or bad input gives an empty list, and the limit is respected', async () => {
  const { popularTerms } = await load();
  assert.deepStrictEqual(popularTerms([], { now: NOW }), []);
  assert.deepStrictEqual(popularTerms(null, { now: NOW }), []);
  assert.deepStrictEqual(popularTerms({ not: 'a list' }, { now: NOW }), []);
  const many = Array.from({ length: 20 }, (_, i) => job(`Role number ${i}`));
  assert.strictEqual(popularTerms(many, { now: NOW, limit: 5 }).length, 5);
});
