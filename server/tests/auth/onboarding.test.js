const test = require('node:test');
const assert = require('node:assert/strict');
const { buildChecklist } = require('../../utils/onboarding');

test('new job seeker starts at 0% with the photo step first', () => {
  const c = buildChecklist('jobseeker', { user: { profile: {} } });
  assert.equal(c.group, 'jobseeker');
  assert.equal(c.percent, 0);
  assert.equal(c.total, 9);
  assert.equal(c.nextStep.key, 'photo');
  assert.ok(c.steps.every((s) => s.path.startsWith('/')));
});

test('job seeker progress counts profile, tests and applications', () => {
  const user = { avatar: 'a.png', profile: { headline: 'h', bio: 'b', phone: '1', location: 'Pondy', skills: ['x'], qualification: [{ degree: 'BCom' }], resumeUrl: 'r.pdf', preferredRole: 'Sales' } };
  const c = buildChecklist('jobseeker', { user, counts: { skillTests: 1, applications: 0 } });
  assert.equal(c.done, 8);
  assert.equal(c.nextStep.key, 'first_application');
  assert.equal(buildChecklist('jobseeker', { user, counts: { skillTests: 1, applications: 2 } }).complete, true);
});

test('company role gets a team step, recruiter does not', () => {
  const co = buildChecklist('company', { user: {}, company: {}, counts: {} });
  const rec = buildChecklist('recruiter', { user: {}, company: {}, counts: {} });
  assert.ok(co.steps.some((s) => s.key === 'invite_team'));
  assert.ok(!rec.steps.some((s) => s.key === 'invite_team'));
});

test('company steps follow company data and jobs', () => {
  const c = buildChecklist('company', {
    user: { companyProfile: { jobTitle: 'HR', phone: '9' } },
    company: { logo: 'l.png', description: 'd', industry: 'IT', location: 'Pondy' },
    counts: { jobs: 1, teamMembers: 0 },
  });
  assert.deepEqual(c.steps.filter((s) => s.done).map((s) => s.key), ['my_details', 'company_logo', 'company_about', 'first_job']);
  assert.equal(c.nextStep.key, 'invite_team');
});

test('college steps: verification and student milestones', () => {
  const none = buildChecklist('college', { college: {}, counts: {} });
  assert.equal(none.percent, 0);
  const some = buildChecklist('college', { college: { verificationStatus: 'verified', logo: 'l', university: 'u', location: 'l', principalName: 'p', collegePhone: '1' }, counts: { drives: 1, students: 12 } });
  assert.deepEqual(some.steps.filter((s) => !s.done).map((s) => s.key), ['fifty_students']);
  assert.equal(buildChecklist('college', { college: {}, counts: { students: 50 } }).steps.find((s) => s.key === 'fifty_students').done, true);
});

test('admin-type roles and a college with no college record are handled', () => {
  assert.equal(buildChecklist('admin', { user: {} }), null);
  assert.equal(buildChecklist('subadmin', { user: {} }), null);
  assert.equal(buildChecklist('college', { college: null, counts: {} }).percent, 0);
});

test('org employee only sees personal profile steps', () => {
  const c = buildChecklist('org_employee', { user: { profile: {} } });
  assert.equal(c.group, 'employee');
  assert.ok(c.steps.every((s) => s.path === '/employee/settings'));
});
