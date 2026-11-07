const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSpendSummary } = require('../utils/spendSummary');

const now = new Date('2026-11-10T06:00:00Z'); // 11:30 IST on 10 Nov

test('money in, spend and net per day; failed payments and voided entries are ignored', () => {
  const s = buildSpendSummary({
    now, days: 3,
    payments: [
      { status: 'completed', amount: 1180, baseAmount: 1000, createdAt: '2026-11-10T01:00:00Z' },
      { status: 'failed', amount: 5000, createdAt: '2026-11-10T01:00:00Z' }
    ],
    entries: [
      { date: '2026-11-10', line: 'ads', amount: 300 },
      { date: '2026-11-10', line: 'ads', amount: 999, voided: true }
    ]
  });
  const today = s.daily[0];
  assert.equal(today.date, '2026-11-10');
  assert.equal(today.moneyIn, 1000);
  assert.equal(today.spent, 300);
  assert.equal(today.razorpayFee, 27.85);
  assert.equal(today.net, 672.15);
  assert.equal(s.daily.length, 3);
});

test('without a base amount, money in is the paid amount less 18% GST', () => {
  const s = buildSpendSummary({ now, days: 1, payments: [{ status: 'completed', amount: 118, createdAt: '2026-11-10T01:00:00Z' }] });
  assert.equal(s.daily[0].moneyIn, 100);
});

test('only ads and other marketing count against the 35,000 cap, with burn rate and run-out date', () => {
  const s = buildSpendSummary({
    now, days: 1,
    entries: [
      { date: '2026-11-06', line: 'ads', amount: 5000 },
      { date: '2026-11-08', line: 'marketing_other', amount: 1000 },
      { date: '2026-11-08', line: 'ai', amount: 9000 }
    ]
  });
  assert.equal(s.budget.spent, 6000);
  assert.equal(s.budget.remaining, 29000);
  assert.equal(s.budget.burnPerDay, 1000); // 6 days elapsed from 5 Nov to 10 Nov
  assert.equal(s.budget.runsOutOn, '2026-12-09');
  assert.equal(s.budget.alert, false);
});

test('the alert turns on at 80 percent of the cap', () => {
  const s = buildSpendSummary({ now, days: 1, entries: [{ date: '2026-11-07', line: 'ads', amount: 28000 }] });
  assert.equal(s.budget.pct, 80);
  assert.equal(s.budget.alert, true);
});

test('no entries means no burn and no run-out date', () => {
  const s = buildSpendSummary({ now, days: 1 });
  assert.equal(s.budget.runsOutOn, null);
  assert.equal(s.budget.spent, 0);
});
