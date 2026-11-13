const test = require('node:test');
const assert = require('node:assert');
const Module = require('node:module');
const realLoad = Module._load;
Module._load = function (req, ...a) { return req === 'jsonwebtoken' ? { sign: () => 't', verify: () => ({}) } : req === 'nodemailer' ? { createTransport: () => ({}) } : realLoad.call(this, req, ...a); };
const V = require('../utils/publicVisibility');
const mails = require('../utils/lifecycle/mails');

test('45-day cutoff', () => {
  assert.strictEqual(V.JOB_MAX_AGE_DAYS, 45);
  const now = Date.UTC(2026, 10, 9);
  assert.strictEqual(V.freshCutoff(now).getTime(), now - 45 * 86400000);
});
test('job conditions hide admin-hidden, old and (when asked) unverified-company jobs', () => {
  const now = Date.UTC(2026, 10, 9);
  const c = V.publicJobConditions({ now, verifiedCompanyIds: ['a'] });
  assert.deepStrictEqual(c[0], { hiddenFromPublic: { $ne: true } });
  const normal = c[1].$or.find((x) => x.shortLife && x.shortLife.$ne === true);
  assert.ok(normal.$or.some((x) => x.renewedAt), 'renewed jobs stay (normal jobs)');
  assert.ok(c[1].$or.some((x) => x.shortLife === true && x.createdAt), 'free-email jobs get 14 days');
  assert.deepStrictEqual(c[2], { company: { $in: ['a'] } });
});
test('with the switch off, only hidden companies are removed', () => {
  const c = V.publicJobConditions({ hiddenCompanyIds: ['h'] });
  assert.deepStrictEqual(c[2], { company: { $nin: ['h'] } });
  assert.strictEqual(V.publicJobConditions({ hiddenCompanyIds: [] }).length, 2);
});
test('company conditions follow HIDE_UNVERIFIED_JOBS', () => {
  delete process.env.HIDE_UNVERIFIED_JOBS;
  assert.strictEqual(V.publicCompanyConditions().is_verified, true);
  process.env.HIDE_UNVERIFIED_JOBS = 'false';
  assert.strictEqual(V.publicCompanyConditions().is_verified, undefined);
  assert.strictEqual(V.publicCompanyConditions().hiddenFromPublic.$ne, true);
  delete process.env.HIDE_UNVERIFIED_JOBS;
});
test('verify mail is honest and has one button', () => {
  process.env.FRONTEND_URL = 'https://velaivaaipu.in';
  const m = mails.companyVerify({ name: 'Asha K' }, 'first');
  assert.match(m.html, /Hi Asha/);
  assert.match(m.html, /not on the public page/);
  assert.strictEqual((m.html.match(/<a /g) || []).length, 1);
});
