const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const created = [];
const updates = [];
const stub = (name, exports) => {
  const file = require.resolve(path.join(__dirname, '..', '..', 'models', name));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
stub('User', {});
stub('Feedback', {
  create: async (d) => { created.push(d); return d; },
  findByIdAndUpdate: (id, u) => { updates.push({ id, u }); return { select: async () => (id === 'a'.repeat(24) ? { status: u.$set.status } : null) }; }
});
const { submitFeedback, setFeedbackStatus } = require('../../controllers/feedbackController');

const run = async (fn, req) => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await fn({ user: { id: 'u1', role: 'jobseeker' }, params: {}, body: {}, query: {}, ...req }, res);
  return res;
};

test('saves a rating with an optional line, trimmed and capped, with the user and role', async () => {
  created.length = 0;
  const res = await run(submitFeedback, { body: { rating: 4, text: `  ${'x'.repeat(600)}  `, page: '/jobs' } });
  assert.equal(res.code, 201);
  assert.equal(created[0].text.length, 500);
  assert.equal(created[0].user, 'u1');
  assert.equal(created[0].role, 'jobseeker');
});

test('a rating outside 1 to 5 is rejected and nothing is saved', async () => {
  created.length = 0;
  for (const rating of [0, 6, 2.5, 'five', undefined]) assert.equal((await run(submitFeedback, { body: { rating } })).code, 400);
  assert.equal(created.length, 0);
});

test('admin can set a status; unknown status or id is rejected', async () => {
  updates.length = 0;
  assert.equal((await run(setFeedbackStatus, { params: { id: 'a'.repeat(24) }, body: { status: 'replied' } })).code, 200);
  assert.equal((await run(setFeedbackStatus, { params: { id: 'a'.repeat(24) }, body: { status: 'deleted' } })).code, 400);
  assert.equal((await run(setFeedbackStatus, { params: { id: 'zz' }, body: { status: 'read' } })).code, 400);
  assert.equal((await run(setFeedbackStatus, { params: { id: 'b'.repeat(24) }, body: { status: 'read' } })).code, 404);
  assert.deepEqual(Object.keys(updates[0].u.$set), ['status']);
});
