const test = require('node:test');
const assert = require('node:assert/strict');
const { manualPaymentRows, sumRows, asPayments } = require('../utils/manualIncome');
const { istDayStart } = require('../utils/istDay');
const { buildSpendSummary } = require('../utils/spendSummary');

const NOV6 = new Date('2026-11-06T10:00:00Z');
const drives = [
  { _id: 'a', plan: 'plus', paid: true, paidAt: NOV6, addons: [{ key: 'screening_pack', qty: 1, paid: true, paidAt: NOV6 }, { key: 'home_spot', qty: 1, paid: false }] },
  { _id: 'b', plan: 'free', paid: false, addons: [{ key: 'extra_registrations', qty: 2, paid: true, paidAt: NOV6 }] },
  { _id: 'c', plan: 'pro', paid: true, paidAt: new Date('2026-10-01T00:00:00Z'), addons: [] },
];

test('paid plan and paid add-ons count, with 18% GST; unpaid ones do not', () => {
  const rows = manualPaymentRows(drives);
  assert.equal(rows.length, 4);                       // plus plan, screening pack, 2 x extra registrations, pro plan
  const s = sumRows(manualPaymentRows([drives[0]]));
  assert.equal(s.base, 999 + 99);
  assert.equal(s.total, Math.round((999 + 99) * 1.18 * 100) / 100);
  assert.equal(sumRows(manualPaymentRows([drives[1]])).base, 199 * 2);  // quantity counted
});

test('a free plan is never money', () => {
  assert.equal(manualPaymentRows([{ plan: 'free', paid: true, paidAt: NOV6, addons: [] }]).length, 0);
});

test('only money from the launch day on, when a window is given', () => {
  const rows = manualPaymentRows(drives, { from: new Date('2026-11-04T18:30:00Z') });
  assert.equal(rows.length, 3);                       // the October payment is test-time
  assert.equal(manualPaymentRows([{ plan: 'plus', paid: true, addons: [] }], { from: new Date(0) }).length, 0); // no paid date: skipped when a window is used
  assert.equal(manualPaymentRows(drives, { from: new Date('2026-11-04T18:30:00Z'), to: new Date('2026-11-06T00:00:00Z') }).length, 0);
});

test('bad input never throws', () => {
  assert.deepEqual(manualPaymentRows(), []);
  assert.deepEqual(manualPaymentRows([null, {}, { plan: 'zzz', paid: true }, { addons: [{ key: 'nope', paid: true }] }]), []);
});

test('money page: paid by hand counts as money in, with no gateway fee', () => {
  const pays = asPayments(manualPaymentRows([drives[0]]));
  const out = buildSpendSummary({ entries: [], payments: pays, now: new Date('2026-11-06T12:00:00Z'), days: 3 });
  const day = out.daily.find((r) => r.date === '2026-11-06');
  assert.equal(day.moneyIn, 1098);
  assert.equal(day.razorpayFee, 0);
});

test('IST day start is midnight India time', () => {
  assert.equal(istDayStart(new Date('2026-11-09T20:00:00Z')).toISOString(), '2026-11-09T18:30:00.000Z'); // 01:30 IST on the 10th -> midnight of the 10th = 18:30 UTC on the 9th
  assert.equal(istDayStart(new Date('2026-11-09T10:00:00Z')).toISOString(), '2026-11-08T18:30:00.000Z');
});

// ── sponsored jobs ──
const { sponsorRows } = require('../utils/manualIncome');
const { checkSponsor } = require('../utils/jobPromotion');

test('a sponsored-job payment is counted with its GST taken out of the base', () => {
  const rows = sponsorRows([{ amount: 1180, receivedAt: new Date('2026-11-10T05:00:00Z') }]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].total, 1180);
  assert.equal(rows[0].base, 1000);
});

test('sponsor rows respect the date window and skip bad rows', () => {
  const entries = [
    { amount: 590, receivedAt: new Date('2026-11-05T00:00:00Z') },
    { amount: 590, receivedAt: new Date('2026-11-20T00:00:00Z') },
    { amount: 0, receivedAt: new Date('2026-11-10T00:00:00Z') },
    { amount: 'abc', receivedAt: new Date('2026-11-10T00:00:00Z') },
    { amount: 590 },
    null
  ];
  assert.equal(sponsorRows(entries, { from: new Date('2026-11-01'), to: new Date('2026-11-15') }).length, 1);
  assert.equal(sponsorRows(entries).length, 2);
  assert.deepEqual(sponsorRows(undefined), []);
});

test('sponsoring accepts an optional amount and refuses nonsense', () => {
  const job = { status: 'active', company: { is_verified: true } };
  const ok = checkSponsor({ job, days: 7, note: 'UPI 123', amount: '1,180', activeOthers: 0 });
  assert.equal(ok.amount, 1180);
  assert.equal(ok.days, 7);
  assert.equal(checkSponsor({ job, days: 7, note: 'UPI 123', activeOthers: 0 }).amount, null);
  assert.equal(checkSponsor({ job, days: 7, note: 'UPI 123', amount: '', activeOthers: 0 }).amount, null);
  assert.ok(checkSponsor({ job, days: 7, note: 'UPI 123', amount: 'abc', activeOthers: 0 }).error);
  assert.ok(checkSponsor({ job, days: 7, note: 'UPI 123', amount: -5, activeOthers: 0 }).error);
  assert.ok(checkSponsor({ job, days: 7, note: 'UPI 123', amount: 9999999, activeOthers: 0 }).error);
});
