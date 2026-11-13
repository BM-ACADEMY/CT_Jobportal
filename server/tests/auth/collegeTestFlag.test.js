const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const calls = [];
let found = { _id: 'a'.repeat(24), name: 'Demo Institute', code: 'DEMO-1', isTest: true };
const file = require.resolve(path.join(__dirname, '..', '..', 'models', 'College'));
require.cache[file] = {
  id: file, filename: file, loaded: true,
  exports: {
    findByIdAndUpdate: (id, update, opts) => { calls.push({ id, update, opts }); return { select: () => Promise.resolve(found) }; }
  }
};
const { setCollegeTestFlag } = require('../../controllers/collegeTestFlagController');

const run = async (params, body) => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await setCollegeTestFlag({ params, body }, res);
  return res;
};

test('marks a college as test and only touches the isTest field', async () => {
  calls.length = 0;
  const res = await run({ collegeId: 'a'.repeat(24) }, { isTest: true });
  assert.equal(res.code, 200);
  assert.deepEqual(calls[0].update, { $set: { isTest: true } });
  assert.equal(res.body.college.isTest, true);
});

test('rejects a bad id and a non-boolean value without touching the database', async () => {
  calls.length = 0;
  assert.equal((await run({ collegeId: 'nope' }, { isTest: true })).code, 400);
  assert.equal((await run({ collegeId: 'a'.repeat(24) }, { isTest: 'yes' })).code, 400);
  assert.equal(calls.length, 0);
});

test('unknown college returns 404', async () => {
  found = null;
  assert.equal((await run({ collegeId: 'b'.repeat(24) }, { isTest: false })).code, 404);
});
