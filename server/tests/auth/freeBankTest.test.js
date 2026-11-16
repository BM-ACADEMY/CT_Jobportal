const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const crypto = require('crypto');

process.env.JWT_SECRET = 'z'.repeat(40);

// Stand-ins for packages/models that are not needed to test the endpoint logic.
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const mac = (d, s) => crypto.createHmac('sha256', s).update(d).digest('base64url');
let backdate = 0; // seconds to age new tokens, to get past the "too fast" check
const jwtStub = {
  sign: (p, s) => { const body = `${b64({ alg: 'HS256' })}.${b64({ ...p, iat: Math.floor(Date.now() / 1000) - backdate })}`; return `${body}.${mac(body, s)}`; },
  verify: (t, s) => { const [h, p, sig] = String(t).split('.'); if (!sig || mac(`${h}.${p}`, s) !== sig) throw new Error('bad'); return JSON.parse(Buffer.from(p, 'base64url').toString()); },
};
const sets = [{ _id: 's1', category: 'ms-excel', active: true, questions: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, question: `Q${i + 1}`, options: { a: 'A', b: 'B', c: 'C', d: 'D' }, correct_option: 'b', explanation: 'x' })) }];
const modelStub = { distinct: async () => ['ms-excel'], findById: async (id) => sets.find((s) => s._id === id) || null };
const logged = [];
const pickedLevels = [];
let logFails = false;
const logStub = { create: (d) => { if (logFails) throw new Error('db down'); logged.push(d); return Promise.resolve(d); } };
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'jsonwebtoken') return jwtStub;
  if (request === '../models/Assessment') return {};
  if (request === '../models/CampusQuestionSet') return modelStub;
  if (request === '../utils/aiHelper') return { GoogleGenerativeAI: class {} };
  if (request === '../utils/questionBank') return { pickSet: async (key, level) => { pickedLevels.push(level); if (key !== 'ms-excel') throw new Error('empty'); return { ...sets[0], level: level === 'hard' ? 'hard' : undefined }; } };
  if (request === '../models/FreeTestAttempt') return logStub;
  if (request === '../models/SkillTestResult' || request === '../models/User') return {};
  return realLoad.call(this, request, ...rest);
};
const c = require('../../controllers/assessmentController');
const res = () => { const r = { code: 200 }; r.status = (n) => { r.code = n; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };

test('skill list shows only skills that have questions', async () => {
  const r = res(); await c.getFreeSkills({}, r);
  assert.ok(r.body.some((x) => x.key === 'ms-excel'));
  assert.ok(!r.body.some((x) => x.key === 'sql-basics')); // no questions yet, so not listed
  const excel = r.body.find((x) => x.key === 'ms-excel');
  assert.equal(excel.industry, 'Office, IT and finance');
  assert.ok(excel.levels.includes('medium'));
});
test('test never contains the right answers', async () => {
  const r = res(); await c.getFreeBankTest({ query: { category: 'ms-excel' } }, r);
  assert.equal(r.code, 200);
  assert.ok(r.body.attemptToken);
  assert.ok(!JSON.stringify(r.body.questions).includes('correct_option'));
});
test('unknown or empty skill is refused cleanly', async () => {
  let r = res(); await c.getFreeBankTest({ query: { category: 'nonsense' } }, r); assert.equal(r.code, 400);
  r = res(); await c.getFreeBankTest({ query: { category: 'sql-basics' } }, r); assert.equal(r.code, 503);
});
test('server scores the test and rejects instant or forged submissions', async () => {
  let r = res(); await c.getFreeBankTest({ query: { category: 'ms-excel' } }, r);
  const token = r.body.attemptToken;
  const answers = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, i < 7 ? 'b' : 'a']));
  let s = res(); await c.submitFreeBankTest({ body: { category: 'ms-excel', attemptToken: token, answers } }, s);
  assert.equal(s.code, 400); // instant submit
  backdate = 60;
  r = res(); await c.getFreeBankTest({ query: { category: 'ms-excel' } }, r);
  s = res(); await c.submitFreeBankTest({ body: { category: 'ms-excel', attemptToken: r.body.attemptToken, answers } }, s);
  assert.equal(s.code, 200); assert.equal(s.body.score, 7); assert.equal(s.body.passed, true); assert.equal(s.body.review.length, 10);
  s = res(); await c.submitFreeBankTest({ body: { category: 'ms-excel', attemptToken: 'forged.token.x', answers } }, s);
  assert.equal(s.code, 400);
  s = res(); await c.submitFreeBankTest({ body: { category: 'accounting', attemptToken: r.body.attemptToken, answers } }, s);
  assert.equal(s.code, 400); // token is for another skill
});

test('each scored test is counted, with no personal data, and a failing log never breaks scoring', async () => {
  backdate = 60;
  const answers = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, i < 7 ? 'b' : 'a']));
  const before = logged.length;
  let r = res(); await c.getFreeBankTest({ query: { category: 'ms-excel' } }, r);
  let s = res(); await c.submitFreeBankTest({ body: { category: 'ms-excel', attemptToken: r.body.attemptToken, answers } }, s);
  assert.equal(s.code, 200);
  assert.equal(logged.length, before + 1);
  assert.deepEqual(Object.keys(logged[logged.length - 1]).sort(), ['level', 'passed', 'percentage', 'score', 'skill', 'source', 'total']);
  assert.equal(logged[logged.length - 1].source, 'bank');
  assert.equal(logged[logged.length - 1].passed, true);
  logFails = true;
  r = res(); await c.getFreeBankTest({ query: { category: 'ms-excel' } }, r);
  s = res(); await c.submitFreeBankTest({ body: { category: 'ms-excel', attemptToken: r.body.attemptToken, answers } }, s);
  assert.equal(s.code, 200); assert.equal(s.body.score, 7);
  logFails = false;
});

test('level is passed to the bank, defaults to medium, and comes back scored as that level', async () => {
  backdate = 60;
  let r = res(); await c.getFreeBankTest({ query: { category: 'ms-excel', level: 'hard' } }, r);
  assert.equal(r.body.level, 'hard');
  assert.equal(pickedLevels.at(-1), 'hard');
  const answers = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, 'b']));
  sets[0].level = 'hard'; // the stored set carries its level
  const s = res(); await c.submitFreeBankTest({ body: { category: 'ms-excel', attemptToken: r.body.attemptToken, answers } }, s);
  delete sets[0].level;
  assert.equal(s.body.level, 'hard');
  assert.equal(logged.at(-1).level, 'hard');
  r = res(); await c.getFreeBankTest({ query: { category: 'ms-excel', level: 'impossible' } }, r);
  assert.equal(r.body.level, 'medium');
  assert.equal(pickedLevels.at(-1), 'medium');
});
