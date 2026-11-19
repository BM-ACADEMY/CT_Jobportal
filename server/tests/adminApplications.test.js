const test = require('node:test');
const assert = require('node:assert');
const { dayStart, todayIst } = require('../controllers/adminApplicationsController');

test('an India day starts at 18:30 UTC the evening before', () => {
  assert.strictEqual(dayStart('2026-11-18').toISOString(), '2026-11-17T18:30:00.000Z');
});
test('bad dates are ignored', () => {
  assert.strictEqual(dayStart('18-11-2026'), null);
  assert.strictEqual(dayStart(''), null);
});
test('todayIst follows India time, not UTC', () => {
  assert.strictEqual(todayIst(new Date('2026-11-18T19:00:00Z')), '2026-11-19');
  assert.strictEqual(todayIst(new Date('2026-11-18T10:00:00Z')), '2026-11-18');
});
