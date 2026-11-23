const test = require('node:test');
const assert = require('node:assert/strict');
const { tidyJobText } = require('../utils/tidyJobText');

test('capitalises each word', () => assert.equal(tidyJobText('Business Development executive'), 'Business Development Executive'));
test('keeps small words lower, acronyms and symbols', () => {
  assert.equal(tidyJobText('python trainer & developer'), 'Python Trainer & Developer');
  assert.equal(tidyJobText('head of IT'), 'Head of IT');
});
test('city lower case fixed, spaces trimmed', () => assert.equal(tidyJobText('  bengaluru '), 'Bengaluru'));
test('non strings pass through', () => assert.equal(tidyJobText(undefined), undefined));
test('comma separated places', () => assert.equal(tidyJobText('puducherry, tamil nadu'), 'Puducherry, Tamil Nadu'));
