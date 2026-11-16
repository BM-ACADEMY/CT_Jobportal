const test = require('node:test');
const assert = require('node:assert');
const { shapeOverview } = require('../utils/servicesOverview');

test('empty input gives zeros', () => {
  const o = shapeOverview();
  assert.strictEqual(o.internships.live, 0);
  assert.deepStrictEqual(o.internships.topCompanies, []);
  assert.strictEqual(o.whatsapp.optIns, 0);
});
test('values pass through, bad values become zero, top list capped at 10', () => {
  const o = shapeOverview({ internshipsLive: 4, drivesPaid: NaN, internshipTop: Array.from({ length: 15 }, (_, i) => ({ company: 'c' + i, internships: 1 })) });
  assert.strictEqual(o.internships.live, 4);
  assert.strictEqual(o.drives.paid, 0);
  assert.strictEqual(o.internships.topCompanies.length, 10);
});
