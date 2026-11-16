// Words and choices for the logged-in home page. Pure, so every rule can be tested without a database.
const DAY = 86400000;

// What one employer (company or recruiter) should do next, most urgent first.
// s: { verified, openJobs, newApplicants, staleJobs, shortlistWaiting }
const employerNextAction = (s = {}) => {
  if (s.verified === false) return { key: 'verify', text: 'Finish your company page so our team can verify you. Your jobs are hidden from the public until then.', to: '/company/profile-management', cta: 'Complete my company page' };
  if (!s.openJobs) return { key: 'post', text: 'Post your first job. It takes about 5 minutes.', to: '/company/jobs/new', cta: 'Post a job' };
  if (s.newApplicants > 0) return { key: 'review', text: `${s.newApplicants} new ${s.newApplicants === 1 ? 'applicant is' : 'applicants are'} waiting for you.`, to: '/company/ats-pipeline', cta: 'Review applicants' };
  if (s.staleJobs > 0) return { key: 'renew', text: `${s.staleJobs} ${s.staleJobs === 1 ? 'job is' : 'jobs are'} older than 45 days and will leave the public page. Renew to keep ${s.staleJobs === 1 ? 'it' : 'them'} up.`, to: '/company/jobs', cta: 'Open my jobs' };
  return { key: 'drive', text: 'Need many people fast? Run a walk-in drive, or post a free internship.', to: '/company/drives', cta: 'Plan a drive' };
};

// What a college should do next. s: { students, applied }
const collegeNextAction = (s = {}) => {
  if (!s.students) return { key: 'invite', text: 'Invite your students with the QR code or a CSV.', to: '/college/students', cta: 'Add students' };
  if (!s.applied) return { key: 'drive', text: 'Your students have not applied yet. Run a campus drive to get them started.', to: '/college/drives', cta: 'Open campus drives' };
  return { key: 'internships', text: 'See how your students are doing on internships.', to: '/college/internships', cta: 'Open internships' };
};

// Small, honest ways for a job seeker to get more matches. user is the profile as the client has it.
const unlockTips = (user = {}) => {
  const p = user.profile || {};
  const tips = [];
  const skills = Array.isArray(p.skills) ? p.skills.length : 0;
  if (skills < 5) tips.push({ key: 'skills', text: `Add ${5 - skills} more ${5 - skills === 1 ? 'skill' : 'skills'}`, to: '/candidate/settings' });
  if (!p.resume && !p.resumeUrl) tips.push({ key: 'resume', text: 'Add your resume', to: '/candidate/settings' });
  const cats = Array.isArray(p.interestedCategories) ? p.interestedCategories.length : 0;
  if (cats < 3) tips.push({ key: 'fields', text: 'Choose up to 3 fields you want to work in', to: '/candidate/settings' });
  return tips.slice(0, 3);
};

// Rows to show under the real matches so the page is never empty. Matches come first and are never changed;
// each filler row is labelled so it is clear why it appears. Returns [{ job, why }] up to `limit`.
const fillRows = ({ matches = [], allJobs = [], interestedCategories = [], limit = 6 }) => {
  const rows = matches.slice(0, limit).map((job) => ({ job, why: 'match' }));
  const seen = new Set(matches.map((j) => String(j._id)));
  const add = (list, why) => { for (const j of list) { if (rows.length >= limit) return; if (!seen.has(String(j._id))) { seen.add(String(j._id)); rows.push({ job: j, why }); } } };
  const cats = new Set(interestedCategories);
  add(allJobs.filter((j) => j.category && cats.has(j.category)), 'field');
  add([...allJobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), 'new');
  return rows;
};

module.exports = { DAY, employerNextAction, collegeNextAction, unlockTips, fillRows };
