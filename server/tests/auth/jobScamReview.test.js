const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const calls = [];
let found = { _id: 'a'.repeat(24), title: 'Typist', scamFlags: ['asks_for_money'], scamReviewed: true };
const file = require.resolve(path.join(__dirname, '..', '..', 'models', 'Job'));
require.cache[file] = {
  id: file, filename: file, loaded: true,
  exports: { findByIdAndUpdate: (id, update) => { calls.push({ id, update }); return { select: () => Promise.resolve(found) }; } }
};
const { setJobScamReviewed } = require('../../controllers/jobScamReviewController');

const run = async (params, body) => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await setJobScamReviewed({ params, body }, res);
  return res;
};

test('admin can mark a flagged job as checked, touching only that field', async () => {
  calls.length = 0;
  const res = await run({ id: 'a'.repeat(24) }, { reviewed: true });
  assert.equal(res.code, 200);
  assert.deepEqual(calls[0].update, { $set: { scamReviewed: true } });
});

test('bad id or non-boolean value is rejected before any database call', async () => {
  calls.length = 0;
  assert.equal((await run({ id: 'x' }, { reviewed: true })).code, 400);
  assert.equal((await run({ id: 'a'.repeat(24) }, { reviewed: 'yes' })).code, 400);
  assert.equal(calls.length, 0);
});

test('unknown job returns 404', async () => {
  found = null;
  assert.equal((await run({ id: 'b'.repeat(24) }, { reviewed: true })).code, 404);
});
