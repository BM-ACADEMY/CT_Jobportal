// Guards two defects found in the review of launch-extras (13 Nov 2026).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('Application.certificateCode has no null default (unique sparse index would reject the second application)', () => {
  const line = read('models/Application.js').split('\n').find((l) => l.includes('certificateCode:'));
  assert.ok(line, 'certificateCode field exists');
  assert.ok(!/default\s*:\s*null/.test(line), 'no default null on certificateCode');
  assert.ok(/unique:\s*true/.test(line) && /sparse:\s*true/.test(line));
});

test('public company profile never returns internal call-verification notes', () => {
  const src = read('routes/publicRoutes.js');
  for (const f of ['verifiedByCallNote', 'verifiedByCallBy', 'verifiedByCallAt']) {
    assert.ok(src.includes(`'${f}'`), `${f} is removed from the public company response`);
  }
});
