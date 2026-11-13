const test = require('node:test');
const assert = require('node:assert/strict');
const { rateLimitBy, honeypot } = require('../middlewares/rateLimit');

const call = (mw, body) => {
  const res = { code: 200, body: null, headers: {}, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; }, set(k, v) { this.headers[k] = v; } };
  let passed = false;
  mw({ baseUrl: '/api/x', path: '/p', body }, res, () => { passed = true; });
  return { res, passed };
};

test('limits one email even when the request comes from many places, ignoring letter case', () => {
  const mw = rateLimitBy({ fields: ['email'], windowMs: 60000, max: 2 });
  assert.equal(call(mw, { email: 'A@x.com' }).passed, true);
  assert.equal(call(mw, { email: 'a@x.com ' }).passed, true);
  const third = call(mw, { email: 'a@X.com' });
  assert.equal(third.passed, false);
  assert.equal(third.res.code, 429);
  assert.ok(third.res.headers['Retry-After']);
});

test('a different email is not affected, and a request without one passes through', () => {
  const mw = rateLimitBy({ fields: ['email'], windowMs: 60000, max: 1 });
  assert.equal(call(mw, { email: 'one@x.com' }).passed, true);
  assert.equal(call(mw, { email: 'two@x.com' }).passed, true);
  assert.equal(call(mw, {}).passed, true);
});

test('a filled hidden field gets a friendly reply and the request stops', () => {
  const mw = honeypot('company_website');
  const bot = call(mw, { company_website: 'http://spam.example' });
  assert.equal(bot.passed, false);
  assert.equal(bot.res.code, 200);
  assert.equal(call(mw, { name: 'Real person' }).passed, true);
  assert.equal(call(mw, { company_website: '   ' }).passed, true);
});
