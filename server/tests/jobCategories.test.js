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

test('interests: valid keys only, no repeats, at most three', () => {
  const { cleanInterestedCategories } = require('../config/jobCategories');
  assert.deepEqual(cleanInterestedCategories(['healthcare', 'healthcare', 'nope', 'engineering']), ['healthcare', 'engineering']);
  assert.deepEqual(cleanInterestedCategories(['healthcare', 'engineering', 'manufacturing', 'non-profit']), ['healthcare', 'engineering', 'manufacturing']);
  assert.deepEqual(cleanInterestedCategories('healthcare'), []);
  assert.deepEqual(cleanInterestedCategories(undefined), []);
  assert.deepEqual(cleanInterestedCategories([{ $gt: '' }, 5, null]), []);
});

test('hotel and kitchen job titles land in the right field', () => {
  const { guessCategory } = require('../config/jobCategories');
  for (const t of ['South Indian Chef', 'Chinese CDP', 'Tandoori CDP']) assert.equal(guessCategory({ title: t }), 'kitchen-culinary', t);
  for (const t of ['House Mens', 'Housemen', 'House Keeping Supervisor', 'Cleaner']) assert.equal(guessCategory({ title: t }), 'housekeeping-facilities', t);
  assert.equal(guessCategory({ title: 'Waiters' }), 'hospitality-tourism');
  for (const t of ['A.C Mechanic', 'AC Mechanic']) assert.equal(guessCategory({ title: t }), 'skilled-trades', t);
});
