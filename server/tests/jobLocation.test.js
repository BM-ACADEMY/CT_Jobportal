const test = require('node:test');
const assert = require('node:assert');
const { vagueLocation } = require('../utils/jobLocation');

test('vague places are refused for jobs with a fixed workplace', () => {
  ['Various', 'various locations', 'Multiple Locations', 'Tamil Nadu', 'tamilnadu', 'India', 'All India', 'Pan India', 'anywhere', 'N/A', '-', ' Various. '].forEach((v) => assert.strictEqual(vagueLocation(v, 'On-site'), true, v));
});
test('real towns and cities are accepted', () => {
  ['Puducherry', 'Villupuram', 'Chennai, Tamil Nadu', 'Kosapalayam, Puducherry', 'Cuddalore', 'Tindivanam, India'].forEach((v) => assert.strictEqual(vagueLocation(v, 'On-site'), false, v));
});
test('remote jobs and empty values are left alone', () => {
  assert.strictEqual(vagueLocation('India', 'Remote'), false);
  assert.strictEqual(vagueLocation('Various', 'remote'), false);
  assert.strictEqual(vagueLocation('', 'On-site'), false);
  assert.strictEqual(vagueLocation(undefined, undefined), false);
});
