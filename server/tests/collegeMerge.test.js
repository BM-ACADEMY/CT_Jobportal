const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { normaliseName, emailDomain, findDuplicateGroups, mergeColleges } = require('../utils/collegeMerge');
const { listDuplicates, merge } = require('../controllers/collegeMergeController');
const { getBalanceBoard } = require('../controllers/balanceBoardController');
const { buildBalance } = require('../utils/balanceBoard');

const A = 'a'.repeat(24); const B = 'b'.repeat(24);
const res = () => { const r = { code: 200 }; r.status = (c) => { r.code = c; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const explode = new Proxy({}, { get() { throw new Error('models must not be touched'); } });

test('names are compared without case, punctuation, "the" and "of"', () => {
  assert.equal(normaliseName("The St. Joseph's College of Arts"), normaliseName('st josephs college arts'));
  assert.equal(emailDomain('hod@abc.edu.in'), 'abc.edu.in');
  assert.equal(emailDomain('someone@gmail.com'), '');
});

test('duplicates: same name and city, or same institutional email domain; free mail never matches; merged colleges are ignored', () => {
  const g = findDuplicateGroups([
    { _id: 'a', name: 'ABC College', location: 'Pondy' }, { _id: 'b', name: 'abc college', location: 'PONDY' }, { _id: 'c', name: 'ABC College', location: 'Chennai' },
    { _id: 'd', name: 'D', collegeEmail: 'x@d.edu.in' }, { _id: 'e', name: 'E', principalEmail: 'y@d.edu.in' },
    { _id: 'f', name: 'F', collegeEmail: 'f@gmail.com' }, { _id: 'g', name: 'G', collegeEmail: 'g@gmail.com' },
    { _id: 'h', name: 'ABC College', location: 'Pondy', mergedInto: 'a' },
  ]);
  assert.deepEqual(g.map((x) => x.colleges.map((c) => c._id).sort()), [['a', 'b'], ['d', 'e']]);
});

test('every non-admin is refused before any model is touched', async () => {
  for (const user of [undefined, { id: 'u', role: 'subadmin' }, { id: 'u', role: 'jobseeker' }, { id: 'u', role: 'recruiter' }, { id: 'u', role: 'college' }, { id: 'u', role: 'company' }]) {
    for (const fn of [listDuplicates, merge, getBalanceBoard]) {
      const r = res();
      await fn({ user, body: { sourceId: A, targetId: B } }, r, { models: explode, Job: explode, User: explode, Role: explode });
      assert.equal(r.code, 403, `${user && user.role} on ${fn.name}`);
    }
  }
});

test('the routes sit behind the admin-only gate', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'routes', 'adminRoutes.js'), 'utf8');
  const gate = src.indexOf("router.use(authorizeRoles('admin'))");
  assert.ok(gate > 0);
  for (const p of ["'/college-duplicates'", "'/colleges/merge'", "'/balance-board'"]) assert.ok(src.indexOf(p) > gate, `${p} is after the gate`);
  assert.ok(!/requireAdminOr[^\n]*(college-duplicates|colleges\/merge|balance-board)/.test(src));
});

const fakeModel = (rows = [], log) => ({
  updateMany: async (f, u) => { log.push(['updateMany', f, u]); return { modifiedCount: 2 }; },
  find: (f) => ({ select: () => ({ lean: async () => rows.filter((r) => String(r.college) === String(f.college)) }) }),
  insertMany: async (d) => { log.push(['audit', d]); },
});
const college = (id, extra = {}) => ({ _id: id, name: `College ${id[0]}`, teamMembers: [], saves: 0, async save() { this.saves += 1; }, ...extra });

test('merge moves references, keeps the target, marks the source merged and writes an audit log', async () => {
  const src = college(A); const tgt = college(B);
  const log = []; const stu = [{ _id: 's1', college: A, user: 'u1' }, { _id: 's2', college: A, user: 'u2' }, { _id: 's3', college: B, user: 'u2' }];
  const models = { College: { findById: async (id) => (id === A ? src : tgt) }, CollegeStudent: fakeModel(stu, log), CampusDrive: fakeModel([], log), CollegeActivityLog: fakeModel([], log), AdminRequest: fakeModel([], log), User: fakeModel([], log) };
  const r = await mergeColleges({ sourceId: A, targetId: B, actor: { id: 'adm', name: 'Kamar' }, models });
  assert.equal(r.ok, true);
  assert.equal(src.mergedInto, B); assert.equal(src.isActive, false); assert.equal(src.mergedBy, 'adm');
  assert.equal(tgt.mergedInto, undefined); assert.equal(tgt.isActive, undefined);
  assert.equal(r.moved.students, 1); assert.equal(r.moved.studentsLeft, 1, 'a student already on the target stays put');
  const audit = log.find((l) => l[0] === 'audit')[1];
  assert.deepEqual(audit.map((a) => a.action), ['college_merged_in', 'college_merged_out']);
  assert.ok(log.some((l) => l[0] === 'updateMany' && l[1]['collegeProfile.college'] === A));
});

test('merge refuses itself, bad ids, missing and already-merged colleges', async () => {
  const models = { College: { findById: async (id) => (id === A ? college(A, { mergedInto: 'x' }) : id === B ? college(B) : null) } };
  assert.equal((await mergeColleges({ sourceId: A, targetId: A, models })).status, 400);
  assert.equal((await mergeColleges({ sourceId: 'x', targetId: B, models })).status, 400);
  assert.equal((await mergeColleges({ sourceId: 'c'.repeat(24), targetId: B, models })).status, 404);
  assert.equal((await mergeColleges({ sourceId: A, targetId: B, models })).status, 409);
});

test('balance board: counts by field, seekers per job, unknown field shown as Not set', () => {
  const b = buildBalance([{ _id: 'healthcare', n: 4 }, { _id: '', n: 1 }], [{ _id: 'healthcare', n: 10 }, { _id: 'engineering', n: 3 }, { _id: '', n: 2 }]);
  const h = b.rows.find((r) => r.key === 'healthcare');
  assert.deepEqual([h.label, h.liveJobs, h.jobSeekers, h.seekersPerJob], ['Healthcare', 4, 10, 2.5]);
  assert.equal(b.rows.find((r) => r.key === 'engineering').seekersPerJob, null);
  assert.equal(b.rows.find((r) => r.key === '').label, 'Not set');
  assert.deepEqual(b.totals, { liveJobs: 5, jobSeekers: 15 });
});
