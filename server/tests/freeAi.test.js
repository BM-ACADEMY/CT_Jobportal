const test = require('node:test');
const assert = require('node:assert/strict');
const { takeFree, allowanceFor, ceilingFrom, monthKey, resetsOn, isPaid, messages } = require('../utils/freeAi');

// A small stand-in for the counter collection, with the same "row at its limit -> duplicate key" behaviour.
const fakeUsage = () => {
  const m = new Map();
  return {
    m,
    async findOneAndUpdate(filter, update, opts = {}) {
      const row = m.get(filter.key);
      if (row) {
        if (filter.count && filter.count.$lt !== undefined && !(row.count < filter.count.$lt)) { const e = new Error('dup'); e.code = 11000; throw e; }
        const before = { ...row };
        if (update.$inc) row.count += update.$inc.count;
        return opts.new ? row : before;
      }
      if (!opts.upsert) return null;
      const fresh = { count: 0, ...(update.$setOnInsert || {}) };
      if (update.$inc) fresh.count += update.$inc.count;
      m.set(filter.key, fresh);
      return opts.new ? fresh : null;
    },
    async findOne(f) { const r = m.get(f.key); return { lean: async () => r || null, then: (a) => a(r || null) }; },
    async updateOne(f, u, o = {}) { let r = m.get(f.key); if (!r && o.upsert) { r = { count: 0 }; m.set(f.key, r); } if (r && u.$inc) r.count += u.$inc.count; },
    async deleteOne(f) { m.delete(f.key); },
  };
};
// findOne above must be awaitable and have .lean(); simplify with a helper object
const wrap = (u) => { const f = u.findOne; u.findOne = (q) => ({ lean: async () => u.m.get(q.key) || null }); return u; };
const NOW = new Date('2026-11-12T06:00:00Z');

test('defaults: 1 resume build, 2 resume checks, 10 job matches a month', () => {
  assert.equal(allowanceFor('resume_build', {}), 1); assert.equal(allowanceFor('resume_check', {}), 2); assert.equal(allowanceFor('job_match', {}), 10);
  assert.equal(allowanceFor('resume_build', { FREE_AI_RESUME_BUILD: '3' }), 3);
  assert.equal(allowanceFor('resume_build', { FREE_AI_RESUME_BUILD: '0' }), 0);
  assert.equal(allowanceFor('nope', {}), 0);
});
test('a person gets exactly their monthly number, then a clear stop', async () => {
  const u = wrap(fakeUsage());
  assert.equal((await takeFree(u, { userId: 'a', kind: 'resume_check', now: NOW, env: {} })).left, 1);
  assert.equal((await takeFree(u, { userId: 'a', kind: 'resume_check', now: NOW, env: {} })).left, 0);
  const r = await takeFree(u, { userId: 'a', kind: 'resume_check', now: NOW, env: {} });
  assert.deepEqual([r.ok, r.reason], [false, 'person']);
  assert.ok(messages.person('resume_check', 2).includes('1st'));
});
test('one person using up their uses does not touch another person', async () => {
  const u = wrap(fakeUsage());
  await takeFree(u, { userId: 'a', kind: 'resume_build', now: NOW, env: {} });
  assert.equal((await takeFree(u, { userId: 'a', kind: 'resume_build', now: NOW, env: {} })).ok, false);
  assert.equal((await takeFree(u, { userId: 'b', kind: 'resume_build', now: NOW, env: {} })).ok, true);
});
test('the whole-site ceiling pauses free AI and gives the person their use back', async () => {
  const u = wrap(fakeUsage()); const env = { FREE_AI_MONTHLY_CEILING: '2' };
  assert.equal((await takeFree(u, { userId: 'a', kind: 'job_match', now: NOW, env })).ok, true);
  assert.equal((await takeFree(u, { userId: 'b', kind: 'job_match', now: NOW, env })).ok, true);
  const r = await takeFree(u, { userId: 'c', kind: 'job_match', now: NOW, env });
  assert.deepEqual([r.ok, r.reason], [false, 'paused']);
  assert.equal(u.m.get('fa:u:job_match:c:2026-11').count, 0);
});
test('asking again about the same job in a month is charged once', async () => {
  const u = wrap(fakeUsage()); const env = { FREE_AI_JOB_MATCH: '2' };
  const a = await takeFree(u, { userId: 'a', kind: 'job_match', dedupe: 'job1', now: NOW, env });
  const b = await takeFree(u, { userId: 'a', kind: 'job_match', dedupe: 'job1', now: NOW, env });
  assert.equal(a.charged, true); assert.equal(b.charged, false); assert.equal(b.ok, true);
  assert.equal((await takeFree(u, { userId: 'a', kind: 'job_match', dedupe: 'job2', now: NOW, env })).left, 0);
  assert.equal((await takeFree(u, { userId: 'a', kind: 'job_match', dedupe: 'job3', now: NOW, env })).ok, false);
});
test('a new month starts fresh', async () => {
  const u = wrap(fakeUsage());
  await takeFree(u, { userId: 'a', kind: 'resume_build', now: NOW, env: {} });
  assert.equal((await takeFree(u, { userId: 'a', kind: 'resume_build', now: new Date('2026-12-02T06:00:00Z'), env: {} })).ok, true);
});
test('month and reset date follow Indian time', () => {
  assert.equal(monthKey(new Date('2026-11-30T19:00:00Z')), '2026-12');
  assert.equal(resetsOn(new Date('2026-11-12T06:00:00Z')).toISOString(), '2026-11-30T18:30:00.000Z');
});
test('paid means an active plan with a price; free, none and expired do not count', () => {
  const now = new Date('2026-11-12');
  assert.equal(isPaid({ price: 999 }, new Date('2027-01-01'), now), true);
  assert.equal(isPaid({ price: 999 }, null, now), true);
  assert.equal(isPaid({ price: 999 }, new Date('2026-10-01'), now), false);
  assert.equal(isPaid({ price: 0 }, null, now), false);
  assert.equal(isPaid(null, null, now), false);
});
test('ceiling setting: unset, zero or junk means no ceiling', () => {
  assert.equal(ceilingFrom({}), 0); assert.equal(ceilingFrom({ FREE_AI_MONTHLY_CEILING: 'x' }), 0); assert.equal(ceilingFrom({ FREE_AI_MONTHLY_CEILING: '500' }), 500);
});
