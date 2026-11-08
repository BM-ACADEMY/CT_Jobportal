const test = require('node:test');
const assert = require('node:assert/strict');
const { checkHealth } = require('../utils/health');

const conn = (readyState, ping) => ({ connection: { readyState, db: { admin: () => ({ ping }) } } });
const fixed = () => new Date('2026-11-09T00:00:00Z');

test('up when the database answers', async () => {
  const r = await checkHealth(conn(1, async () => ({ ok: 1 })), { now: fixed });
  assert.deepEqual(r, { ok: true, db: 'up', time: '2026-11-09T00:00:00.000Z' });
});

test('down when not connected, when the ping fails and when it hangs', async () => {
  assert.equal((await checkHealth(conn(0, async () => ({})), { now: fixed })).ok, false);
  assert.equal((await checkHealth(conn(1, async () => { throw new Error('x'); }), { now: fixed })).db, 'down');
  const hang = await checkHealth(conn(1, () => new Promise(() => {})), { timeoutMs: 20, now: fixed });
  assert.equal(hang.ok, false);
});

test('the answer carries no secrets or counts', async () => {
  const r = await checkHealth(conn(1, async () => ({})), { now: fixed });
  assert.deepEqual(Object.keys(r).sort(), ['db', 'ok', 'time']);
});
