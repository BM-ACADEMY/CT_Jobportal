'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkImage, isRefusal, configured } = require('../utils/imageCheck');

const file = path.join(os.tmpdir(), `imgcheck-${process.pid}.png`);
fs.writeFileSync(file, Buffer.from([137, 80, 78, 71]));
const env = { IMAGE_CHECK_ENDPOINT: 'https://check.example/v1', IMAGE_CHECK_KEY: 'test-key-not-real' };
const reply = (body, ok = true) => async () => ({ ok, json: async () => body });

test('unset or half-set env: ok without any network call', async () => {
  let called = 0;
  const f = async () => { called += 1; };
  assert.deepEqual(await checkImage(file, { env: {}, fetchImpl: f }), { ok: true, checked: false });
  assert.deepEqual(await checkImage(file, { env: { IMAGE_CHECK_ENDPOINT: 'https://x' }, fetchImpl: f }), { ok: true, checked: false });
  assert.deepEqual(await checkImage(file, { env: { IMAGE_CHECK_KEY: 'k' }, fetchImpl: f }), { ok: true, checked: false });
  assert.equal(called, 0);
  assert.equal(configured({}), false);
});
test('configured: sends the bytes with the key, and refuses only on an explicit refusal', async () => {
  let seen;
  const f = async (url, opts) => { seen = { url, opts }; return { ok: true, json: async () => ({ ok: true }) }; };
  assert.deepEqual(await checkImage(file, { env, fetchImpl: f }), { ok: true, checked: true });
  assert.equal(seen.url, env.IMAGE_CHECK_ENDPOINT);
  assert.equal(seen.opts.headers['Content-Type'], 'image/png');
  assert.equal((await checkImage(file, { env, fetchImpl: reply({ ok: false }) })).ok, false);
  assert.equal((await checkImage(file, { env, fetchImpl: reply({ flagged: true }) })).ok, false);
  assert.equal(isRefusal({ ok: true }), false);
  assert.equal(isRefusal(null), false);
});
test('failures never block: error, bad status, bad body, missing file, unknown type', async () => {
  assert.equal((await checkImage(file, { env, fetchImpl: async () => { throw new Error('boom'); } })).ok, true);
  assert.equal((await checkImage(file, { env, fetchImpl: reply({}, false) })).ok, true);
  assert.equal((await checkImage(file, { env, fetchImpl: async () => ({ ok: true, json: async () => { throw new Error('bad json'); } }) })).ok, true);
  assert.equal((await checkImage('/nonexistent/a.png', { env, fetchImpl: reply({ ok: false }) })).ok, true);
  assert.equal((await checkImage('/tmp/a.exe', { env, fetchImpl: reply({ ok: false }) })).ok, true);
});
test('the env names are read only in utils/imageCheck.js; the logo path uses the util', () => {
  const root = path.join(__dirname, '..');
  const hits = [];
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    if (['node_modules', 'uploads', 'tests'].includes(e.name)) return;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    if (e.name.endsWith('.js') && /IMAGE_CHECK_(ENDPOINT|KEY)/.test(fs.readFileSync(p, 'utf8'))) hits.push(path.relative(root, p));
  });
  walk(root);
  assert.deepEqual(hits, [path.join('utils', 'imageCheck.js')]);
  assert.match(fs.readFileSync(path.join(root, 'controllers/recruiterController.js'), 'utf8'), /imageCheck'\)\.checkImage\(logoFile\.path\)/);
  fs.unlinkSync(file);
});
