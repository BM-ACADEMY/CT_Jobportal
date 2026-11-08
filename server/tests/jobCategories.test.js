const test = require('node:test');
const assert = require('node:assert/strict');
const { JOB_CATEGORIES, cleanCategory, guessCategory } = require('../config/jobCategories');

test('only known category keys pass, anything else becomes empty', () => {
  assert.equal(cleanCategory('Healthcare'), 'healthcare'); // capital letters are accepted
  assert.equal(cleanCategory('Health care'), '');
  assert.equal(cleanCategory(' healthcare '), 'healthcare');
  assert.equal(cleanCategory('<script>'), '');
  assert.equal(cleanCategory(undefined), '');
  assert.equal(cleanCategory({ $gt: '' }), '');
});

test('old jobs get a sensible guess from the title and skills', () => {
  assert.equal(guessCategory({ title: 'Staff Nurse - ICU' }), 'healthcare');
  assert.equal(guessCategory({ title: 'Delivery Executive' }), 'logistics-delivery');
  assert.equal(guessCategory({ title: 'Telecaller (Tamil)' }), 'bpo-support');
  assert.equal(guessCategory({ title: 'Tally Accountant' }), 'finance-accounts');
  assert.equal(guessCategory({ title: 'React Developer', skillsRequired: ['Node'] }), 'it-software');
  assert.equal(guessCategory({ title: 'Hotel Front Desk Executive' }), 'hospitality-tourism');
});

test('no match gives empty, never a wrong field', () => {
  assert.equal(guessCategory({ title: 'Astronaut' }), '');
  assert.equal(guessCategory({}), '');
});

test('every category has a unique key and a label', () => {
  const keys = JOB_CATEGORIES.map((c) => c.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(JOB_CATEGORIES.every((c) => c.label && c.words.length));
});
