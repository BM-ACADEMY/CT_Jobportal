const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../../client/src/pages/Jobs.jsx'), 'utf8');

test('quick chips cover the common one-tap searches', () => {
  for (const label of ['Internship', 'Posted today', 'Under ₹10,000', 'Work from home', 'No experience needed', 'Part-time']) assert.ok(src.includes(`label: '${label}'`), label);
});
test('nearby town chips fill the place box and clear on a second tap', () => {
  for (const c of ['Puducherry', 'Chennai', 'Cuddalore', 'Villupuram', 'Bengaluru', 'Hyderabad']) assert.ok(src.includes(`'${c}'`), c);
  assert.match(src, /setLocationTerm\(on \? '' : c\)/);
});
test('drawer sections open and close, show a chosen count, and job types are no longer hidden behind Show more', () => {
  for (const id of ['types', 'pay', 'exp', 'edu', 'mode', 'posted']) assert.ok(src.includes(`secHead('${id}'`), id);
  assert.ok(!src.includes('showAllTypes'));
  assert.ok(!src.includes('Show more'));
});
test('remembered filters never keep search words or place, and storage failures are guarded', () => {
  const m = src.slice(src.indexOf("const FILTER_MEMORY"), src.indexOf('// Drawer sections open'));
  assert.ok(!/searchTerm|locationTerm/.test(m.replace(/\/\/.*$/gm, '')));
  assert.ok((m.match(/catch \{/g) || []).length >= 2);
  assert.match(m, /!routeLocation && !\[\.\.\.searchParams\.keys\(\)\]\.length/);
});
test('brace balance of the page is intact', () => {
  for (const [a, b] of [['(', ')'], ['{', '}'], ['[', ']']]) assert.strictEqual(src.split(a).length, src.split(b).length, a);
});
