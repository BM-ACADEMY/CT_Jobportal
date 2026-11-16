const test = require('node:test');
const assert = require('node:assert/strict');
const { buildNeedsAction, levelFor } = require('../utils/needsAction');

const now = new Date('2026-11-10T12:00:00Z');
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();

test('levels: ok under 24 hours, late from 24, overdue from 48', () => {
  assert.equal(levelFor(23), 'ok');
  assert.equal(levelFor(24), 'late');
  assert.equal(levelFor(48), 'overdue');
});

test('one list from several sources, most overdue first, with owner and counts', () => {
  const { items, summary } = buildNeedsAction({
    colleges: [{ _id: 'c1', name: 'Christ College', code: 'CAMP-2049', createdAt: hoursAgo(50) }],
    tickets: [{ _id: 't1', category: 'payment_checkout', accountIdentity: 'a@x.com', createdAt: hoursAgo(5) }],
    messages: [{ _id: 'm1', name: 'Ravi', email: 'r@x.com', subject: 'Hello', createdAt: hoursAgo(30) }]
  }, [{ kind: 'message', refId: 'm1', ownerId: 'u1', ownerName: 'Priya' }], now);
  assert.deepEqual(items.map((i) => i.id), ['c1', 'm1', 't1']);
  assert.equal(items[0].level, 'overdue');
  assert.equal(items[1].owner.name, 'Priya');
  assert.equal(items[2].title, 'payment checkout');
  assert.deepEqual(summary, { total: 3, overdue: 1, late: 1, unassigned: 2 });
});

test('empty or missing input gives an empty list', () => {
  assert.deepEqual(buildNeedsAction().summary, { total: 0, overdue: 0, late: 0, unassigned: 0 });
});
