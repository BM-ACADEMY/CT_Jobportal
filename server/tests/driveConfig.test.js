const test = require('node:test');
const assert = require('node:assert/strict');
const { PLANS, ADDONS, priceWithGst, effectiveLimits, quote, istMonthStart, costPerHire } = require('../config/driveConfig');

test('plan prices are locked: Free 0, Plus 999, Pro 2999', () => {
  assert.equal(PLANS.free.price, 0);
  assert.equal(PLANS.plus.price, 999);
  assert.equal(PLANS.pro.price, 2999);
  assert.deepEqual([PLANS.free, PLANS.plus, PLANS.pro].map((p) => p.maxRegistrations), [50, 300, 1000]);
});

test('GST is 18 percent, to the paisa', () => {
  assert.deepEqual(priceWithGst(999), { base: 999, gst: 179.82, total: 1178.82 });
  assert.deepEqual(priceWithGst(2999), { base: 2999, gst: 539.82, total: 3538.82 });
  assert.deepEqual(priceWithGst(0), { base: 0, gst: 0, total: 0 });
});

test('an add-on counts only once it is paid', () => {
  const unpaid = effectiveLimits({ plan: 'free', addons: [{ key: 'extra_registrations', qty: 2, paid: false }] });
  assert.equal(unpaid.maxRegistrations, 50);
  const paid = effectiveLimits({ plan: 'free', addons: [{ key: 'extra_registrations', qty: 2, paid: true }, { key: 'screening_pack', qty: 1, paid: true }] });
  assert.equal(paid.maxRegistrations, 250);
  assert.equal(paid.screeningMax, 3);
});

test('add-ons work on every plan, and flags switch on', () => {
  for (const plan of ['free', 'plus', 'pro']) {
    const l = effectiveLimits({ plan, addons: [{ key: 'full_report', qty: 1, paid: true }, { key: 'team_check', qty: 1, paid: true }] });
    assert.equal(l.fullReport, true);
    assert.equal(l.teamCheck, true);
  }
  assert.equal(effectiveLimits({ plan: 'free' }).whatsapp, false);
  assert.equal(effectiveLimits({ plan: 'plus' }).whatsapp, true);
});

test('unknown plans and add-ons are ignored, not trusted', () => {
  assert.equal(effectiveLimits({ plan: 'gold' }).maxRegistrations, 50);
  assert.equal(effectiveLimits({ plan: 'free', addons: [{ key: 'free_everything', qty: 99, paid: true }] }).maxRegistrations, 50);
});

test('the quote adds plan and add-ons, with GST and what is still due', () => {
  const q = quote({ plan: 'plus', paid: true, addons: [{ key: 'home_spot', qty: 1, paid: false }, { key: 'extra_invites', qty: 2, paid: true }] });
  assert.equal(q.base, 999 + 499 + 398);
  assert.equal(q.paidBase, 999 + 398);
  assert.equal(q.due.base, 499);
  assert.equal(q.due.total, 588.82);
  assert.equal(quote({ plan: 'free' }).total, 0);
});

test('the free drive month starts at the beginning of the India-time month', () => {
  assert.equal(istMonthStart(new Date('2026-11-09T10:00:00Z')).toISOString(), '2026-10-31T18:30:00.000Z');
  assert.equal(istMonthStart(new Date('2026-10-31T19:00:00Z')).toISOString(), '2026-10-31T18:30:00.000Z'); // 00:30 on 1 Nov in India
});

test('cost per hire is what was paid over the people selected', () => {
  assert.equal(costPerHire({ plan: 'pro', paid: true }, 10), 299.9);
  assert.equal(costPerHire({ plan: 'pro', paid: true }, 0), null);
});

test('every add-on has a price and something to add', () => {
  for (const a of Object.values(ADDONS)) { assert.ok(a.price > 0 && a.label && Object.keys(a.adds).length); }
});
