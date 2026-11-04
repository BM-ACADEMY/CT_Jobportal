const test = require('node:test');
const assert = require('node:assert');
const { takeAiAction, limitFor, indiaDay, aiDailyCap } = require('../../middlewares/aiDailyCap');

// Minimal in-memory stand-in for the usage collection: one row per key, atomic increment under a limit.
const fakeUsage = () => {
  const rows = new Map();
  return {
    rows,
    async findOneAndUpdate(filter, update) {
      const row = rows.get(filter.key);
      if (row && !(row.count < filter.count.$lt)) { const e = new Error('dup'); e.code = 11000; throw e; }
      const next = row || { count: 0 };
      next.count += update.$inc.count;
      rows.set(filter.key, next);
      return next;
    },
  };
};

test('limits default and can be set from the environment', () => {
  assert.strictEqual(limitFor('match', {}), 40);
  assert.strictEqual(limitFor('other', {}), 15);
  assert.strictEqual(limitFor('other', { AI_DAILY_LIMIT_OTHER: '3' }), 3);
  assert.strictEqual(limitFor('other', { AI_DAILY_LIMIT_OTHER: 'abc' }), 15);
});

test('allows up to the limit, then refuses', async () => {
  const U = fakeUsage();
  const env = { AI_DAILY_LIMIT_OTHER: '2' };
  assert.strictEqual((await takeAiAction(U, 'u1', 'other', { env })).ok, true);
  assert.strictEqual((await takeAiAction(U, 'u1', 'other', { env })).remaining, 0);
  assert.strictEqual((await takeAiAction(U, 'u1', 'other', { env })).ok, false);
});

test('each person and each kind has its own allowance', async () => {
  const U = fakeUsage();
  const env = { AI_DAILY_LIMIT_OTHER: '1', AI_DAILY_LIMIT_MATCH: '1' };
  assert.strictEqual((await takeAiAction(U, 'u1', 'other', { env })).ok, true);
  assert.strictEqual((await takeAiAction(U, 'u2', 'other', { env })).ok, true);
  assert.strictEqual((await takeAiAction(U, 'u1', 'match', { env })).ok, true);
  assert.strictEqual((await takeAiAction(U, 'u1', 'other', { env })).ok, false);
});

test('a new India day starts a new allowance', async () => {
  const U = fakeUsage();
  const env = { AI_DAILY_LIMIT_OTHER: '1' };
  const d1 = new Date('2026-11-04T10:00:00Z');
  const d2 = new Date('2026-11-05T10:00:00Z');
  assert.strictEqual((await takeAiAction(U, 'u1', 'other', { now: d1, env })).ok, true);
  assert.strictEqual((await takeAiAction(U, 'u1', 'other', { now: d1, env })).ok, false);
  assert.strictEqual((await takeAiAction(U, 'u1', 'other', { now: d2, env })).ok, true);
  assert.strictEqual(indiaDay(new Date('2026-11-04T19:00:00Z')), '2026-11-05'); // past midnight in India
});

test('middleware answers 429 at the limit and lets other errors through', async () => {
  const U = fakeUsage();
  process.env.AI_DAILY_LIMIT_OTHER = '1';
  const mw = aiDailyCap('other', U);
  let nexted = 0; let status = null; let body = null;
  const res = { status(c) { status = c; return this; }, json(b) { body = b; return this; } };
  await mw({ user: { id: 'u9' } }, res, () => { nexted += 1; });
  await mw({ user: { id: 'u9' } }, res, () => { nexted += 1; });
  assert.strictEqual(nexted, 1);
  assert.strictEqual(status, 429);
  assert.match(body.msg, /today/);
  const broken = { async findOneAndUpdate() { throw new Error('db down'); } };
  let passed = false;
  await aiDailyCap('other', broken)({ user: { id: 'u9' } }, res, () => { passed = true; });
  assert.strictEqual(passed, true);
  delete process.env.AI_DAILY_LIMIT_OTHER;
});
