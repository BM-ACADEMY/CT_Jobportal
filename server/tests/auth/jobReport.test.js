const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

const jobs = { good: { _id: 'good', recruiter: 'owner', status: 'active' }, closed: { _id: 'closed', recruiter: 'owner', status: 'closed' } };
const reports = [];
const updates = [];
const jobStub = { findById: (id) => ({ select: async () => jobs[id] || null }), updateOne: async (...a) => { updates.push(a); } };
const reportStub = { create: async (d) => { if (reports.some((r) => r.job === d.job && r.reporter === d.reporter)) { const e = new Error('dup'); e.code = 11000; throw e; } reports.push(d); } };
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === '../models/Job') return jobStub;
  if (request === '../models/JobReport') return reportStub;
  return realLoad.call(this, request, ...rest);
};
const { reportJob } = require('../../controllers/jobReportController');
const res = () => { const r = { code: 200 }; r.status = (n) => { r.code = n; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const call = async (id, body, userId = 'u1') => { const r = res(); await reportJob({ params: { id }, body, user: { id: userId } }, r); return r; };
const hex = (c) => c.repeat(24);

test('rejects a bad id and an unknown reason', async () => {
  assert.equal((await call('x', { reason: 'other' })).code, 400);
  assert.equal((await call(hex('a'), { reason: 'spam!' })).code, 400);
});

test('only active jobs can be reported, and not your own', async () => {
  jobs[hex('b')] = jobs.good; jobs[hex('c')] = jobs.closed;
  assert.equal((await call(hex('c'), { reason: 'other' })).code, 404);
  assert.equal((await call(hex('d'), { reason: 'other' })).code, 404);
  assert.equal((await call(hex('b'), { reason: 'other' }, 'owner')).code, 400);
});

test('a report flags the job for review and a second one from the same person is not counted', async () => {
  jobs[hex('e')] = jobs.good;
  const first = await call(hex('e'), { reason: 'asks_for_money', note: 'x'.repeat(900) });
  assert.equal(first.code, 201);
  assert.equal(reports.at(-1).note.length, 300);
  const [filter, change] = updates.at(-1);
  assert.deepEqual(change.$inc, { reportCount: 1 });
  assert.deepEqual(change.$addToSet, { scamFlags: 'reported_by_users' });
  assert.equal(change.$set.scamReviewed, false);
  const n = updates.length;
  const again = await call(hex('e'), { reason: 'asks_for_money' });
  assert.equal(again.code, 200);
  assert.equal(updates.length, n); // nothing counted twice
});
