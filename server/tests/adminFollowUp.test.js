const test = require('node:test');
const assert = require('node:assert/strict');
const { planAutoAssign, planReminders, escalationBody, digestBody, paymentAlertBody } = require('../utils/adminFollowUp');

const item = (kind, id, level, owner = null, ageHours = 10) => ({ kind, id, level, owner, ageHours, label: kind, title: `${kind} ${id}` });

test('auto-assign gives unowned items to the person set for that type, and leaves the rest', () => {
  const out = planAutoAssign(
    [item('college', 'c1', 'ok'), item('college', 'c2', 'ok', { id: 'u9', name: 'Meena' }), item('ticket', 't1', 'ok')],
    [{ kind: 'college', ownerId: 'u1', ownerName: 'Priya' }]
  );
  assert.deepEqual(out, [{ kind: 'college', id: 'c1', ownerId: 'u1', ownerName: 'Priya' }]);
});

test('late items remind their owner once; overdue items go to the super admin once', () => {
  const items = [
    item('college', 'c1', 'late', { id: 'u1', name: 'P' }, 30),
    item('ticket', 't1', 'overdue', { id: 'u1', name: 'P' }, 60),
    item('message', 'm1', 'overdue', null, 70),
    item('review', 'r1', 'ok', { id: 'u1', name: 'P' })
  ];
  const first = planReminders(items, new Set());
  assert.deepEqual(first.ownerReminders.map((r) => r.key), ['late:college:c1', 'late:ticket:t1']);
  assert.deepEqual(first.escalations.map((r) => r.key), ['overdue:ticket:t1', 'overdue:message:m1']);
  const sent = new Set([...first.ownerReminders, ...first.escalations].map((r) => r.key));
  const again = planReminders(items, sent);
  assert.equal(again.ownerReminders.length + again.escalations.length, 0);
});

test('email bodies escape text and read clearly', () => {
  const html = escalationBody([{ ...item('message', 'm1', 'overdue', null, 52), title: '<b>x</b>' }]);
  assert.ok(html.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.ok(html.includes('2d 4h'));
  const digest = digestBody({ summary: { total: 0, overdue: 0, late: 0, unassigned: 0 }, items: [], failedPayments: 1, newUsers: 3, revenue: 1200 });
  assert.ok(digest.includes('Nothing is waiting.') && digest.includes('1</strong> failed payment'));
  const withBudget = digestBody({ summary: { total: 1, overdue: 0, late: 0, unassigned: 1 }, items: [], budget: { pct: 85, spent: 29750, cap: 35000, alert: true } });
  assert.ok(withBudget.includes('85%') && withBudget.includes('Over 80%'));
  assert.ok(paymentAlertBody([{ amount: 588.82, email: 'a@x.com', createdAt: '2026-11-07T07:00:00Z' }]).includes('588.82'));
});
