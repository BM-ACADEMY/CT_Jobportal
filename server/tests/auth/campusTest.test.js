const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const crypto = require('crypto');

process.env.JWT_SECRET = 'z'.repeat(40);

// Use the real jsonwebtoken when installed, otherwise a tiny HS256 stand-in that also sets iat.
const realLoad = Module._load;
let jwtImpl;
try { jwtImpl = require('jsonwebtoken'); } catch {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const mac = (d, s) => crypto.createHmac('sha256', s).update(d).digest('base64url');
  jwtImpl = {
    sign: (p, s) => { const body = `${b64({ alg: 'HS256' })}.${b64({ ...p, iat: Math.floor(Date.now() / 1000) })}`; return `${body}.${mac(body, s)}`; },
    verify: (t, s) => { const [h, p, sig] = String(t).split('.'); if (!sig || mac(`${h}.${p}`, s) !== sig) throw new Error('bad'); return JSON.parse(Buffer.from(p, 'base64url').toString()); },
  };
}
Module._load = function (request, ...rest) {
  if (request === 'jsonwebtoken') return jwtImpl;
  return realLoad.call(this, request, ...rest);
};

const { normalizeSet, publicQuestions, signAttempt, verifyAttempt, scoreAttempt } = require('../../utils/campusTest');

const rawQ = (i, correct = 'a') => ({
  question: `Question ${i}?`,
  options: { a: `A${i}`, b: `B${i}`, c: `C${i}`, d: `D${i}` },
  correct_option: correct,
  explanation: 'because',
});
const raw = (n = 10) => Array.from({ length: n }, (_, i) => rawQ(i + 1));

test('normalizeSet keeps the correct answer after shuffling', () => {
  const set = normalizeSet(raw(), () => 0.3);
  assert.equal(set.length, 10);
  set.forEach((q, i) => assert.equal(q.options[q.correct_option], `A${i + 1}`));
});

test('normalizeSet rejects unusable AI output', () => {
  assert.equal(normalizeSet(null), null);
  assert.equal(normalizeSet(raw(9)), null);
  const dup = raw(); dup[0].options.b = dup[0].options.a;
  assert.equal(normalizeSet(dup), null);
  const badLetter = raw(); badLetter[2].correct_option = 'e';
  assert.equal(normalizeSet(badLetter), null);
  const empty = raw(); empty[1].options.c = '  ';
  assert.equal(normalizeSet(empty), null);
});

test('publicQuestions never exposes answers or explanations', () => {
  const set = { questions: normalizeSet(raw()) };
  const shown = JSON.stringify(publicQuestions(set));
  assert.ok(!shown.includes('correct_option'));
  assert.ok(!shown.includes('explanation'));
});

test('scoreAttempt counts only correct answers and ignores junk', () => {
  const set = { questions: normalizeSet(raw(), () => 0.5) };
  const answers = {};
  set.questions.slice(0, 6).forEach((q) => { answers[q.id] = q.correct_option.toUpperCase(); });
  assert.deepEqual(scoreAttempt(set, answers), { score: 6, total: 10 });
  assert.deepEqual(scoreAttempt(set, null), { score: 0, total: 10 });
  assert.deepEqual(scoreAttempt(set, ['a', 'a']), { score: 0, total: 10 });
});

test('attempt token: too fast, mismatch, invalid and valid', () => {
  const token = signAttempt({ studentId: 's1', category: 'ms-excel', setId: 'set1' });
  const now = Date.now();
  assert.equal(verifyAttempt(token, { studentId: 's1', category: 'ms-excel', nowMs: now }).error, 'too_fast');
  const later = now + 60_000;
  const ok = verifyAttempt(token, { studentId: 's1', category: 'ms-excel', nowMs: later });
  assert.equal(ok.claims.set, 'set1');
  assert.equal(verifyAttempt(token, { studentId: 's2', category: 'ms-excel', nowMs: later }).error, 'mismatch');
  assert.equal(verifyAttempt(token, { studentId: 's1', category: 'accounting', nowMs: later }).error, 'mismatch');
  assert.equal(verifyAttempt('garbage', { studentId: 's1', category: 'ms-excel', nowMs: later }).error, 'invalid');
});
