const test = require('node:test');
const assert = require('node:assert/strict');
const { activeExtra, effectiveStudentLimit, planPack, UNLIMITED } = require('../utils/collegePack');
const { packRows } = require('../utils/manualIncome');

const NOW = new Date('2026-11-20T06:00:00Z');
const FUTURE = new Date('2027-06-01'); const PAST = new Date('2026-10-01');

test('extra students count only until their end date', () => {
  assert.equal(effectiveStudentLimit({ studentLimit: 1000, extraStudents: 250, extraUntil: FUTURE }, NOW), 1250);
  assert.equal(effectiveStudentLimit({ studentLimit: 1000, extraStudents: 250, extraUntil: PAST }, NOW), 1000);
  assert.equal(effectiveStudentLimit({ studentLimit: 1000 }, NOW), 1000);
  assert.equal(effectiveStudentLimit({}, NOW), 100);
  assert.equal(effectiveStudentLimit({ studentLimit: UNLIMITED, extraStudents: 250, extraUntil: FUTURE }, NOW), UNLIMITED);
  assert.equal(activeExtra({ extraStudents: 250 }, NOW), 0);
});
test('one pack costs 4,999 plus 18% GST and adds 250 students for a year', () => {
  const p = planPack({ studentLimit: 100 }, 1, NOW);
  assert.deepEqual([p.students, p.base, p.total, p.extraStudents], [250, 4999, 5898.82, 250]);
  assert.equal(p.extraUntil.toISOString().slice(0, 10), '2027-11-20');
});
test('packs add up to 2 and no more; a lapsed pack no longer counts', () => {
  const have1 = { studentLimit: 1000, extraStudents: 250, extraUntil: FUTURE };
  assert.equal(planPack(have1, 1, NOW).extraStudents, 500);
  assert.match(planPack(have1, 2, NOW).error, /at most 2/);
  assert.match(planPack({ studentLimit: 100 }, 3, NOW).error, /at most 2/);
  assert.equal(planPack({ studentLimit: 1000, extraStudents: 500, extraUntil: PAST }, 2, NOW).extraStudents, 500);
});
test('bad quantities and unlimited colleges are refused', () => {
  for (const q of [0, -1, 1.5, 'x', undefined, null]) assert.ok(planPack({ studentLimit: 100 }, q, NOW).error, String(q));
  assert.match(planPack({ studentLimit: UNLIMITED }, 1, NOW).error, /unlimited/);
});
test('a new pack never shortens the time the earlier ones had left', () => {
  const far = new Date('2028-01-01');
  assert.equal(planPack({ studentLimit: 1000, extraStudents: 250, extraUntil: far }, 1, NOW).extraUntil.toISOString(), far.toISOString());
});
test('pack payments count as money with GST taken out, like other by-hand income', () => {
  const rows = packRows([{ amount: 5898.82, receivedAt: NOW }, { amount: 0, receivedAt: NOW }, { amount: 100 }]);
  assert.equal(rows.length, 1); assert.equal(rows[0].base, 4999); assert.equal(rows[0].label, 'College student pack');
});

const { checkRequest } = require('../utils/collegePack');
const { receivedMessage, askForReviewOnce } = require('../utils/serviceRequestMessages');
test('a college can ask for packs within its allowance, one request at a time', () => {
  const c = { studentLimit: 100 };
  assert.deepEqual(checkRequest(c, 2, false, NOW), { packs: 2, students: 500, total: 11797.64 });
  assert.match(checkRequest(c, 1, true, NOW).error, /already have a pack request/);
  assert.match(checkRequest({ studentLimit: 1000, extraStudents: 250, extraUntil: FUTURE }, 2, false, NOW).error, /at most 2/);
  assert.ok(checkRequest(c, 0, false, NOW).error);
});
test('the college gets a receipt in its own words and no review ask', async () => {
  assert.match(receivedMessage('student_pack', 'Asha').message, /payment details/);
  assert.equal(receivedMessage('student_pack', 'Asha').link, '/college/dashboard');
  assert.equal(await askForReviewOnce({ request: { type: 'student_pack', status: 'completed' }, notify: async () => assert.fail('no ask'), io: null }), false);
});
