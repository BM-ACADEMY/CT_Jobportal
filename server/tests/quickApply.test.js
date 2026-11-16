const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanQuickDetails, fillMissing } = require('../utils/quickApply');

test('cleans each detail and drops bad ones', () => {
  assert.deepEqual(cleanQuickDetails({ phone: '+91 98765 43210', location: '  Villupuram  ', experienceLevel: 'fresher', category: 'Healthcare' }),
    { phone: '9876543210', location: 'Villupuram', experienceLevel: 'fresher', category: cleanQuickDetails({ category: 'Healthcare' }).category });
  assert.deepEqual(cleanQuickDetails({ phone: '123', location: 'x', experienceLevel: 'expert', category: 'nonsense' }), {});
  assert.deepEqual(cleanQuickDetails(null), {});
  assert.deepEqual(cleanQuickDetails('hello'), {});
});

test('a known category is kept', () => {
  assert.ok(cleanQuickDetails({ category: 'Healthcare' }).category);
});

test('only empty profile fields are filled; saved details are never overwritten', () => {
  const d = { phone: '9876543210', location: 'Pondy', experienceLevel: 'fresher', category: 'healthcare' };
  assert.deepEqual(fillMissing({ profile: {} }, d), { 'profile.phone': '9876543210', 'profile.location': 'Pondy', 'profile.experienceLevel': 'fresher', 'profile.interestedCategories': ['healthcare'] });
  assert.equal(fillMissing({ profile: { phone: '9000000000', location: 'Chennai', experienceLevel: 'over_5_years', interestedCategories: ['retail'] } }, d), null);
  assert.deepEqual(fillMissing({ profile: { phone: '9000000000' } }, d), { 'profile.location': 'Pondy', 'profile.experienceLevel': 'fresher', 'profile.interestedCategories': ['healthcare'] });
  assert.equal(fillMissing({ profile: {} }, {}), null);
});
