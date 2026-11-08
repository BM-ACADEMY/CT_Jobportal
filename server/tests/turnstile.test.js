const test = require('node:test');
const assert = require('node:assert/strict');
const { turnstile } = require('../middlewares/turnstile');

const res = () => { const r = { code: 200 }; r.status = (n) => { r.code = n; return r; }; r.json = (b) => { r.body = b; return r; }; return r; };
const run = async (mw, body = {}) => { const r = res(); let passed = false; await mw({ body, ip: '1.2.3.4' }, r, () => { passed = true; }); return { r, passed }; };
const ok = (json) => async () => ({ ok: true, json: async () => json });

test('no secret key set: the check is skipped', async () => {
  let called = false;
  const { passed } = await run(turnstile({ env: {}, fetchFn: async () => { called = true; } }));
  assert.equal(passed, true);
  assert.equal(called, false);
});

test('with a key: no token is refused without calling Cloudflare', async () => {
  let called = false;
  const { r, passed } = await run(turnstile({ env: { TURNSTILE_SECRET_KEY: 's' }, fetchFn: async () => { called = true; } }), {});
  assert.equal(passed, false);
  assert.equal(r.code, 400);
  assert.equal(called, false);
});

test('a good token passes and a bad token is refused', async () => {
  const env = { TURNSTILE_SECRET_KEY: 's' };
  assert.equal((await run(turnstile({ env, fetchFn: ok({ success: true }) }), { turnstileToken: 't' })).passed, true);
  const bad = await run(turnstile({ env, fetchFn: ok({ success: false, 'error-codes': ['invalid-input-response'] }) }), { turnstileToken: 't' });
  assert.equal(bad.passed, false);
  assert.equal(bad.r.code, 400);
});

test('the secret and token go to Cloudflare as a form post', async () => {
  let seen;
  await run(turnstile({ env: { TURNSTILE_SECRET_KEY: 'sek' }, fetchFn: async (url, opts) => { seen = { url, opts }; return { ok: true, json: async () => ({ success: true }) }; } }), { turnstileToken: 'tok' });
  assert.match(seen.url, /challenges\.cloudflare\.com\/turnstile\/v0\/siteverify$/);
  assert.equal(seen.opts.method, 'POST');
  assert.equal(seen.opts.body.get('secret'), 'sek');
  assert.equal(seen.opts.body.get('response'), 'tok');
});

test('Cloudflare down, slow or broken: the request is let through', async () => {
  const env = { TURNSTILE_SECRET_KEY: 's' };
  const body = { turnstileToken: 't' };
  assert.equal((await run(turnstile({ env, fetchFn: async () => { throw new Error('network'); } }), body)).passed, true);
  assert.equal((await run(turnstile({ env, fetchFn: async () => ({ ok: false, status: 503 }) }), body)).passed, true);
  assert.equal((await run(turnstile({ env, fetchFn: async () => ({ ok: true, json: async () => { throw new Error('not json'); } }) }), body)).passed, true);
});
