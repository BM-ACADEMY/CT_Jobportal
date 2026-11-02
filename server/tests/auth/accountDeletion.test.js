const test = require('node:test');
const assert = require('node:assert/strict');
const { canSelfDelete, buildAnonymisePatch, confirmationProblem } = require('../../utils/accountDeletion');

test('students, recruiters and team members may delete themselves', () => {
  for (const role of ['jobseeker', 'recruiter', 'org_employee', 'drive_incharge']) assert.equal(canSelfDelete({ role }).ok, true);
});
test('organisation owners and admins are sent to support', () => {
  for (const role of ['company', 'college', 'admin', 'subadmin']) assert.equal(canSelfDelete({ role }).ok, false);
  assert.equal(canSelfDelete({ role: 'recruiter', ownsCompany: true }).ok, false);
  assert.equal(canSelfDelete({ role: 'jobseeker', ownsCollege: true }).ok, false);
});
test('anonymise patch clears personal data and blocks login', () => {
  const p = buildAnonymisePatch('abc123', new Date('2026-11-02T00:00:00Z'));
  assert.equal(p.$set.email, 'deleted-abc123@deleted.invalid');
  assert.equal(p.$set.name, 'Deleted user');
  assert.equal(p.$set.isDeleted, true);
  assert.equal(p.$set['profile.phone'], '');
  assert.deepEqual(p.$set['profile.documents'], []);
  assert.equal(p.$set['emailPrefs.marketingOptOut'], true);
  for (const k of ['password', 'otp', 'googleId', 'githubId', 'linkedinId']) assert.equal(p.$unset[k], 1);
});
test('confirmation needs DELETE and the password when one exists', () => {
  assert.match(confirmationProblem({ confirm: 'delete', hasPassword: false }), /DELETE/);
  assert.match(confirmationProblem({ confirm: 'DELETE', hasPassword: true, passwordMatches: false }), /password/);
  assert.equal(confirmationProblem({ confirm: 'DELETE', hasPassword: true, passwordMatches: true }), null);
  assert.equal(confirmationProblem({ confirm: ' DELETE ', hasPassword: false }), null);
});
