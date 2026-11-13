const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../utils/jobPromotion');

const NOW = new Date('2026-11-10T00:00:00Z');
const live = { status: 'active', company: { is_verified: true } };

test('sponsorship: live job, verified company, 1 to 30 days, a payment note, room for it', () => {
  const ok = P.checkSponsor({ job: live, days: 7, note: ' UPI 123 ', activeOthers: 0, now: NOW });
  assert.equal(ok.until.toISOString(), '2026-11-17T00:00:00.000Z'); assert.equal(ok.note, 'UPI 123');
  assert.match(P.checkSponsor({ job: { ...live, status: 'closed' }, days: 7, note: 'x', activeOthers: 0 }).error, /live/);
  assert.match(P.checkSponsor({ job: { status: 'active', company: { is_verified: false } }, days: 7, note: 'x', activeOthers: 0 }).error, /verified/);
  assert.match(P.checkSponsor({ job: { status: 'active' }, days: 7, note: 'x', activeOthers: 0 }).error, /verified/);
  for (const d of [0, 31, 1.5, 'a', undefined]) assert.match(P.checkSponsor({ job: live, days: d, note: 'x', activeOthers: 0 }).error, /days/);
  assert.match(P.checkSponsor({ job: live, days: 7, note: '  ', activeOthers: 0 }).error, /paid/);
  assert.match(P.checkSponsor({ job: live, days: 7, note: 'x', activeOthers: 5 }).error, /already sponsored/);
});

test('urgent tag: live job, 1 to 14 days', () => {
  assert.equal(P.checkUrgent({ job: live, days: 3, now: NOW }).until.toISOString(), '2026-11-13T00:00:00.000Z');
  assert.ok(P.checkUrgent({ job: live, days: 15 }).error); assert.ok(P.checkUrgent({ job: { status: 'draft' }, days: 3 }).error);
});

test('state ends on its date', () => {
  const job = { sponsoredUntil: new Date('2026-11-11'), urgentUntil: new Date('2026-11-09') };
  assert.deepEqual(P.promoState(job, NOW), { isSponsored: true, isUrgent: false });
  assert.deepEqual(P.promoState({}, NOW), { isSponsored: false, isUrgent: false });
});

test('sponsored jobs go first, at most five, the rest keep their order', () => {
  const jobs = [{ id: 'a' }, ...Array.from({ length: 7 }, (_, i) => ({ id: `s${i}`, sponsoredUntil: new Date(Date.UTC(2026, 10, 12 + i)) })), { id: 'z' }];
  const out = P.withPromotion(jobs, NOW);
  assert.equal(out.length, 9);
  assert.deepEqual(out.slice(0, 5).map((j) => j.id), ['s6', 's5', 's4', 's3', 's2']);
  assert.ok(out.slice(0, 5).every((j) => j.isSponsored));
  assert.deepEqual(out.slice(5).map((j) => j.id), ['a', 's0', 's1', 'z']);
  assert.ok(out.slice(5).every((j) => j.isSponsored === false));
});
