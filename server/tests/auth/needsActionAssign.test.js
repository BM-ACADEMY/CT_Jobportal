const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const stubModel = (name, exports = {}) => {
  const file = require.resolve(path.join(__dirname, '..', '..', 'models', name));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
const calls = [];
['User', 'Role', 'College', 'Ticket', 'ContactMessage', 'Review', 'AdminRequest', 'Job', 'AdminRoutingRule', 'Feedback'].forEach((n) => stubModel(n));
stubModel('AdminAssignment', {
  deleteOne: async (q) => { calls.push({ op: 'delete', q }); },
  findOneAndUpdate: async (q, u) => { calls.push({ op: 'upsert', q, u }); return { kind: q.kind, refId: q.refId, ownerId: u.$set.ownerId, ownerName: u.$set.ownerName }; }
});
const { assignItem } = require('../../controllers/needsActionController');

const run = async (body) => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await assignItem({ body, user: { id: 'f'.repeat(24) } }, res);
  return res;
};
const ID = 'a'.repeat(24);
const OWNER = 'b'.repeat(24);

test('saves an owner for an item and records who assigned it', async () => {
  calls.length = 0;
  const res = await run({ kind: 'college', id: ID, ownerId: OWNER, ownerName: 'Priya' });
  assert.equal(res.code, 200);
  assert.equal(calls[0].u.$set.assignedBy, 'f'.repeat(24));
  assert.equal(res.body.assignment.owner.name, 'Priya');
});

test('an empty owner removes the assignment', async () => {
  calls.length = 0;
  const res = await run({ kind: 'ticket', id: ID, ownerId: null });
  assert.equal(res.code, 200);
  assert.equal(calls[0].op, 'delete');
});

test('unknown type, bad ids, or a missing name are rejected before any database call', async () => {
  calls.length = 0;
  assert.equal((await run({ kind: 'payment', id: ID, ownerId: OWNER, ownerName: 'X' })).code, 400);
  assert.equal((await run({ kind: 'college', id: 'zz', ownerId: OWNER, ownerName: 'X' })).code, 400);
  assert.equal((await run({ kind: 'college', id: ID, ownerId: 'zz', ownerName: 'X' })).code, 400);
  assert.equal((await run({ kind: 'college', id: ID, ownerId: OWNER, ownerName: '  ' })).code, 400);
  assert.equal(calls.length, 0);
});
