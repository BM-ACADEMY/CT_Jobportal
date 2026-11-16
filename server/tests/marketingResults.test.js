const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { resultsBySource } = require('../utils/signupSource');

test('cost per signup and per paid customer are worked out per source', () => {
  const users = [
    { _id: 'a', signupSource: { source: 'meta' } }, { _id: 'b', signupSource: { source: 'meta' } },
    { _id: 'c', signupSource: { source: 'meta' } }, { _id: 'd', signupSource: { source: 'meta' } },
    { _id: 'e', signupSource: { source: 'google' } }, { _id: 'f' }
  ];
  const r = resultsBySource(users, { a: 4999 }, [{ source: 'Meta', amount: 2000 }, { source: 'meta', amount: 1000 }]);
  const meta = r.find((x) => x.source === 'meta');
  assert.deepStrictEqual([meta.signups, meta.paid, meta.revenue, meta.spend, meta.costPerSignup, meta.costPerPaid], [4, 1, 4999, 3000, 750, 3000]);
  assert.strictEqual(r.find((x) => x.source === 'google').costPerSignup, null);
  assert.strictEqual(r.length, 2, 'accounts with no source are not counted');
});

test('spend with no signups is flagged, and a quiet source is not', () => {
  const r = resultsBySource([{ _id: 'a', signupSource: { source: 'google' } }], {}, [{ source: 'whatsapp', amount: 500 }]);
  assert.strictEqual(r.find((x) => x.source === 'whatsapp').attention, 'Money spent, no signups yet');
  assert.strictEqual(r.find((x) => x.source === 'google').attention, '');
});

test('spend source is only kept for ad lines, voided entries are left out, and the route stays super-admin', () => {
  const sc = fs.readFileSync(path.join(__dirname, '../controllers/spendController.js'), 'utf8');
  assert.match(sc, /line === 'ads' \|\| line === 'marketing_other' \? part\(source\)/);
  const gc = fs.readFileSync(path.join(__dirname, '../controllers/growthController.js'), 'utf8');
  assert.match(gc, /voided: false/);
  assert.match(gc, /status: 'completed'/);
  const ar = fs.readFileSync(path.join(__dirname, '../routes/adminRoutes.js'), 'utf8');
  const i = ar.indexOf("authorizeRoles('admin')");
  assert.ok(i > -1 && ar.indexOf('growth/sources') > i, 'growth route sits below the admin-only line');
});
