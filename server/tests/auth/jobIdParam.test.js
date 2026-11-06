'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Job = require('../../models/Job');
let lookups = 0;
Job.findById = () => { lookups += 1; return { populate() { return this; }, then(r) { r(null); } }; };
const { getJobById } = require('../../controllers/jobController');

const run = async (id) => {
  const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  await getJobById({ params: { id } }, res);
  return res;
};

test('a bad job id (for example "undefined") is a 404, not a server error, and never reaches the database', async () => {
  for (const id of ['undefined', 'null', '123', '', 'zzzzzzzzzzzzzzzzzzzzzzzz']) {
    const res = await run(id);
    assert.equal(res.statusCode, 404, id);
    assert.equal(res.body.msg, 'Job not found');
  }
  assert.equal(lookups, 0);
});

test('a well-formed id that matches no job is still a 404 (looked up once)', async () => {
  const res = await run('6ac87793a131f99567cb526f');
  assert.equal(res.statusCode, 404);
  assert.equal(lookups, 1);
});
