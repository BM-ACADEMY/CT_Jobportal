const test = require('node:test');
const assert = require('node:assert/strict');
const { clean, valid } = require('../utils/phoneRule');

test('Indian numbers: 10 digits starting 6 to 9, with or without 91 or 0', () => {
  for (const x of ['9876543210', '98765 43210', '09876543210', '919876543210', '+91 98765-43210']) assert.equal(clean(x), '+919876543210', x);
});
test('bad Indian numbers are refused', () => {
  for (const x of ['', null, undefined, '12345', '5876543210', '+915876543210', 'abcdefghij', '98765432']) assert.equal(valid(x), false, String(x));
});
test('other countries need a plus sign and 7 to 15 digits', () => {
  assert.equal(clean('+971501234567'), '+971501234567');
  assert.equal(clean('+14155550123'), '+14155550123');
  assert.equal(valid('+123'), false);
  assert.equal(valid('4155550123'), false); // no plus sign and not an Indian number
});
