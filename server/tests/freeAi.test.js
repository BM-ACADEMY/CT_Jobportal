const test = require('node:test');
const assert = require('node:assert/strict');
const { takeFree, peek, allowanceFor, windowMs, ceilingFrom, limitsOn, isPaid, messages, dayKey, tomorrow, when } = require('../utils/freeAi');

// A small stand-in for the counter collection (keys, regex find, create, upsert, "at its limit" -> duplicate key).
const fakeUsage = () => {
  const m = new Map();
  return {
    m,
    find(q) { const re = new RegExp(q.key.$regex); const rows = [...m.keys()].filter((k) => re.test(k)).map((key) => ({ key })); return { select: () => ({ lean: async () => rows }) }; },
    async create(d) { m.set(d.key, { count: d.count }); },
    async findOneAndUpdate(f, u, o = {}) {
      const row = m.get(f.key);
      if (row) { if (f.count && f.count.$lt !== undefined && !(row.count < f.count.$lt)) { const e = new Error('dup'); e.code = 11000; throw e; } row.count += u.$inc.count; return row; }
      m.set(f.key, { count: u.$inc.count }); return m.get(f.key);
    },
    async updateOne(f, u) { const r = m.get(f.key) || { count: 0 }; r.count += u.$inc.count; m.set(f.key, r); },
  };
};
const T0 = new Date('2026-11-12T06:00:00Z');
const at = (h) => new Date(T0.getTime() + h * 3600000);
const DAYS = (n) => n * 86400000;

test('defaults: 5 resume builds and 10 resume checks per 7 days, no ceiling, limits on', () => {
  assert.equal(allowanceFor('resume_build', {}), 5); assert.equal(allowanceFor('resume_check', {}), 10);
  assert.equal(windowMs({}), DAYS(7)); assert.equal(ceilingFrom({}), 0); assert.equal(limitsOn({}), true);
  assert.equal(limitsOn({ FREE_AI_LIMITS: 'off' }), false);
  assert.equal(allowanceFor('job_match', {}), 0); // job match is not limited here at all
});
test('a person can use their free uses, then is told exactly when the first one comes back', async () => {
  const u = fakeUsage(); const env = { FREE_AI_RESUME_BUILD: '2' };
  assert.equal((await takeFree(u, { userId: 'a', kind: 'resume_build', now: T0, env })).left, 1);
  assert.equal((await takeFree(u, { userId: 'a', kind: 'resume_build', now: at(2), env })).left, 0);
  const r = await takeFree(u, { userId: 'a', kind: 'resume_build', now: at(5), env });
  assert.deepEqual([r.ok, r.reason], [false, 'person']);
  assert.equal(r.nextAt.getTime(), T0.getTime() + DAYS(7)); // the oldest use frees up first
  assert.ok(messages.person('resume_build', r.nextAt).includes('again on'));
});
test('a used one comes back after the window, one at a time', async () => {
  const u = fakeUsage(); const env = { FREE_AI_RESUME_BUILD: '2' };
  await takeFree(u, { userId: 'a', kind: 'resume_build', now: T0, env });
  await takeFree(u, { userId: 'a', kind: 'resume_build', now: at(48), env });
  assert.equal((await takeFree(u, { userId: 'a', kind: 'resume_build', now: at(24 * 6), env })).ok, false);
  const day8 = new Date(T0.getTime() + DAYS(7) + 1000);
  assert.equal((await takeFree(u, { userId: 'a', kind: 'resume_build', now: day8, env })).ok, true);
  assert.equal((await takeFree(u, { userId: 'a', kind: 'resume_build', now: day8, env })).ok, false);
});
test('the two tools and two people are counted separately', async () => {
  const u = fakeUsage(); const env = { FREE_AI_RESUME_BUILD: '1', FREE_AI_RESUME_CHECK: '1' };
  await takeFree(u, { userId: 'a', kind: 'resume_build', now: T0, env });
  assert.equal((await takeFree(u, { userId: 'a', kind: 'resume_build', now: T0, env })).ok, false);
  assert.equal((await takeFree(u, { userId: 'a', kind: 'resume_check', now: T0, env })).ok, true);
  assert.equal((await takeFree(u, { userId: 'b', kind: 'resume_build', now: T0, env })).ok, true);
});
test('the daily site ceiling pauses free AI until tomorrow and does not use up the person', async () => {
  const u = fakeUsage(); const env = { FREE_AI_DAILY_CEILING: '2' };
  await takeFree(u, { userId: 'a', kind: 'resume_check', now: T0, env });
  await takeFree(u, { userId: 'b', kind: 'resume_check', now: T0, env });
  const r = await takeFree(u, { userId: 'c', kind: 'resume_check', now: T0, env });
  assert.deepEqual([r.ok, r.reason], [false, 'paused']);
  assert.equal(r.nextAt.toISOString(), '2026-11-12T18:30:00.000Z');
  assert.equal((await peek(u, { userId: 'c', kind: 'resume_check', now: T0, env })).used, 0);
  assert.ok(messages.paused(r.nextAt).includes('opens again'));
  const tomorrowOk = await takeFree(u, { userId: 'c', kind: 'resume_check', now: new Date('2026-11-12T19:00:00Z'), env });
  assert.equal(tomorrowOk.ok, true);
});
test('day and reopening time follow Indian time', () => {
  assert.equal(dayKey(new Date('2026-11-12T19:00:00Z')), '2026-11-13');
  assert.equal(tomorrow(new Date('2026-11-12T06:00:00Z')).toISOString(), '2026-11-12T18:30:00.000Z');
  assert.match(when(new Date('2026-11-19T10:10:00Z')), /Thu.*19 Nov.*3:40/i);
});
test('paid means an active plan with a price; free, none and expired do not count', () => {
  const now = new Date('2026-11-12');
  assert.equal(isPaid({ price: 999 }, new Date('2027-01-01'), now), true);
  assert.equal(isPaid({ price: 999 }, null, now), true);
  assert.equal(isPaid({ price: 999 }, new Date('2026-10-01'), now), false);
  assert.equal(isPaid({ price: 0 }, null, now), false);
  assert.equal(isPaid(null, null, now), false);
});
