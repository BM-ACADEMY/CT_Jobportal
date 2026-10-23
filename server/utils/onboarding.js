// Onboarding checklist per role. Pure functions (no database access) so the rules are easy to test.
// The controller gathers the facts; this file decides which steps exist and which are done.

const has = (v) => typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : !!v;

const jobseekerSteps = ({ user, counts }) => {
  const p = user.profile || {};
  const prefs = p.jobPreferences || {};
  return [
    { key: 'photo', label: 'Add a profile photo', hint: 'A photo helps employers recognise you.', path: '/candidate/settings', done: has(user.avatar) },
    { key: 'headline', label: 'Write a headline and short bio', hint: 'One line on who you are and what you want.', path: '/candidate/settings', done: has(p.headline) && has(p.bio) },
    { key: 'contact', label: 'Add your phone and location', hint: 'Employers filter by city.', path: '/candidate/settings', done: has(p.phone) && has(p.location) },
    { key: 'skills', label: 'Add your skills', hint: 'Skills drive your job matches.', path: '/candidate/settings', done: has(p.skills) },
    { key: 'education', label: 'Add your education', hint: 'Degree, college and year.', path: '/candidate/settings', done: has(p.qualification) },
    { key: 'resume', label: 'Upload your resume', hint: 'No resume yet? Build one with our AI Resume Builder.', path: '/candidate/resume-builder', done: has(p.resumeUrl) || has(p.documents) },
    { key: 'preferences', label: 'Set the jobs you want', hint: 'Roles, job type and work mode.', path: '/candidate/settings', done: has(p.preferredRole) || has(p.interestedDomain) || has(prefs.jobTitles) || has(prefs.locationTypes) || has(prefs.employmentTypes) },
    { key: 'skill_test', label: 'Take a free skill test', hint: 'Earn a certificate to show employers.', path: '/candidate/skill-tests', done: counts.skillTests > 0 },
    { key: 'first_application', label: 'Apply to your first job', hint: 'Browse jobs near you.', path: '/jobs', done: counts.applications > 0 },
  ];
};

const employeeSteps = ({ user }) => jobseekerSteps({ user, counts: { skillTests: 1, applications: 1 } })
  .filter((s) => ['photo', 'headline', 'contact', 'skills', 'education'].includes(s.key))
  .map((s) => ({ ...s, path: '/employee/settings' }));

const companySteps = ({ user, company, counts, roleName }) => {
  const me = { ...(user.recruiterProfile || {}), ...(user.companyProfile || {}) };
  const c = company || {};
  const steps = [
    { key: 'my_details', label: 'Add your name details', hint: 'Your job title and phone, so candidates know who they talk to.', path: '/company/settings', done: has(me.jobTitle) && has(me.phone) },
    { key: 'company_logo', label: 'Add your company logo', hint: 'A logo makes your jobs easier to recognise.', path: '/company/profile-management', done: has(c.logo) || has(c.logo_url) },
    { key: 'company_about', label: 'Describe your company', hint: 'A short paragraph, your industry and your city.', path: '/company/profile-management', done: has(c.description) && has(c.industry) && (has(c.location) || has(c.headquarters_address)) },
    { key: 'first_job', label: 'Post your first job', hint: 'Use a ready template to do it in two minutes.', path: '/company/jobs/new', done: counts.jobs > 0 },
  ];
  if (roleName === 'company') {
    steps.push({ key: 'invite_team', label: 'Invite a teammate', hint: 'Let your HR team review applicants with you.', path: '/company/team', done: counts.teamMembers > 0 });
  }
  return steps;
};

const collegeSteps = ({ college, counts }) => {
  const c = college || {};
  return [
    { key: 'college_details', label: 'Complete your college details', hint: 'Logo, university, location, principal and phone.', path: '/college/settings', done: has(c.logo) && has(c.university) && has(c.location) && has(c.principalName) && has(c.collegePhone) },
    { key: 'verification', label: 'Get your college verified', hint: 'Upload proof so students and companies trust you.', path: '/college/verification', done: c.verificationStatus === 'verified' },
    { key: 'first_drive', label: 'Create your first campus drive', hint: 'A drive gives you a QR code for students.', path: '/college/drives/new', done: counts.drives > 0 },
    { key: 'first_students', label: 'Get your first students on board', hint: 'Share the drive QR code in class groups.', path: '/college/students', done: counts.students > 0 },
    { key: 'fifty_students', label: 'Reach 50 students', hint: 'More students make your placement reports more useful.', path: '/college/students', done: counts.students >= 50 },
  ];
};

const GROUPS = { jobseeker: 'jobseeker', recruiter: 'company', company: 'company', org_employee: 'employee', college: 'college' };

const buildChecklist = (roleName, data) => {
  const group = GROUPS[roleName];
  if (!group) return null;
  const counts = { skillTests: 0, applications: 0, jobs: 0, teamMembers: 0, drives: 0, students: 0, ...(data.counts || {}) };
  const input = { ...data, counts, roleName };
  const steps = group === 'jobseeker' ? jobseekerSteps(input)
    : group === 'company' ? companySteps(input)
    : group === 'employee' ? employeeSteps(input)
    : collegeSteps(input);
  const done = steps.filter((s) => s.done).length;
  const percent = Math.round((done / steps.length) * 100);
  return {
    group,
    steps,
    done,
    total: steps.length,
    percent,
    complete: done === steps.length,
    nextStep: steps.find((s) => !s.done) || null,
  };
};

module.exports = { buildChecklist };
