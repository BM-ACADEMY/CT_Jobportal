const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const created = [];
const updates = [];
const stub = (name, exports) => {
  const file = require.resolve(path.join(__dirname, '..', '..', 'models', name));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
stub('Payment', {});
stub('WalkInDrive', {});
stub('SponsorPayment', {});
stub('SpendEntry', {
  create: async (doc) => { created.push(doc); return { _id: 'e1', ...doc }; },
  findByIdAndUpdate: async (id, u) => { updates.push({ id, u }); return id === 'a'.repeat(24) ? { _id: id } : null; }
});
const { addSpend, voidSpend } = require('../../controllers/spendController');
const { istDate } = require('../../utils/spendSummary');

const run = async (fn, req) => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await fn({ user: { id: 'u1' }, params: {}, body: {}, ...req }, res);
  return res;
};
const today = istDate(new Date());

test('saves a valid spend entry and records who entered it', async () => {
  created.length = 0;
  const res = await run(addSpend, { body: { date: today, line: 'ads', amount: '350.50', note: 'Reel boost' } });
  assert.equal(res.code, 201);
  assert.equal(created[0].amount, 350.5);
  assert.equal(created[0].enteredBy, 'u1');
});

test('rejects a future date, an unknown type, and a bad amount without saving', async () => {
  created.length = 0;
  assert.equal((await run(addSpend, { body: { date: '2999-01-01', line: 'ads', amount: 10 } })).code, 400);
  assert.equal((await run(addSpend, { body: { date: today, line: 'gifts', amount: 10 } })).code, 400);
  assert.equal((await run(addSpend, { body: { date: today, line: 'ads', amount: 0 } })).code, 400);
  assert.equal((await run(addSpend, { body: { date: today, line: 'ads', amount: 'abc' } })).code, 400);
  assert.equal(created.length, 0);
});

test('a wrong entry is voided, not deleted, and the update only touches the void fields', async () => {
  updates.length = 0;
  const res = await run(voidSpend, { params: { id: 'a'.repeat(24) } });
  assert.equal(res.code, 200);
  assert.deepEqual(Object.keys(updates[0].u.$set).sort(), ['voided', 'voidedAt', 'voidedBy']);
  assert.equal((await run(voidSpend, { params: { id: 'zz' } })).code, 400);
  assert.equal((await run(voidSpend, { params: { id: 'b'.repeat(24) } })).code, 404);
});
