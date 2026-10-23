// Copy for the lifecycle mails (Afra Ventures Smart Reply Mail Plan, Velaivaaipu rows).
// Rules from the plan: under 120 words, one button, personalised, honest (no fake urgency), unsubscribe in footer.
const { lifecycleWrapper, unsubscribeHeaders, button, esc, frontend } = require('../lifecycleEmails');

const slugify = (t) => String(t ?? '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60);
const jobUrl = (job) => {
  const parts = [slugify(job.title), slugify(job.location)].filter(Boolean).join('-');
  return `${frontend()}/job/${parts ? `${parts}-` : ''}${job._id}`;
};
const first = (user) => esc(String(user?.name || 'there').split(' ')[0]);
const utm = (url, campaign) => `${url}${url.includes('?') ? '&' : '?'}utm_source=email&utm_medium=lifecycle&utm_campaign=${campaign}`;
const link = (path, campaign) => utm(`${frontend()}${path}`, campaign);

// stage: 'first' (day 2), 'second' (day 7), 'monthly' (after 30 days). Same ask, different angle each time.
const PROFILE_COPY = {
  first: (pct) => ({
    subject: null,
    title: 'Your profile is almost there',
    body: `<p>Your Velaivaaipu profile is ${pct}% complete. Recruiters filter out profiles with missing skills or no resume.</p>
    <p>Add your skills and resume (about 5 minutes) so you show up when companies search.</p>`,
  }),
  second: (pct) => ({
    subject: 'Your profile is still at ' + pct + '%. 5 minutes to fix it',
    title: 'A complete profile gets seen',
    body: `<p>Your profile is ${pct}% complete. The fastest wins: a photo, your skills, and a resume. No resume? Our AI Resume Builder makes one for you.</p>`,
  }),
  monthly: (pct) => ({
    subject: 'Is your profile ready for the next job?',
    title: 'Get your profile job-ready',
    body: `<p>Companies post jobs on Velaivaaipu, and your profile is ${pct}% complete. Finish it so you are ready when the right job appears.</p>`,
  }),
};

const profileIncomplete = (user, pct, stage = 'first') => {
  const p = Math.round(pct);
  const c = (PROFILE_COPY[stage] || PROFILE_COPY.first)(p);
  return {
    subject: c.subject || `${String(user.name || '').split(' ')[0] || 'Hi'}, recruiters skip incomplete profiles`,
    title: c.title,
    html: `<p>Hi ${first(user)},</p>
    ${c.body}
    ${button(link('/candidate/settings', `profile_incomplete_${stage}`), 'Finish my profile')}`,
  };
};

const skillTestInvite = (user) => ({
  subject: 'Take your free skill test and stand out',
  title: 'Prove your skills, free',
  html: `<p>Hi ${first(user)},</p>
    <p>Your profile is ready. A skill test adds a score and a certificate to it, which helps recruiters trust what you list.</p>
    <p>It takes about 10 minutes and costs nothing.</p>
    ${button(link('/candidate/skill-tests', 'skill_test_invite'), 'Take the free skill test')}`,
});

const skillGap = (user, { label, percent, course, courseUrl }) => ({
  subject: `Your ${label} test result and a way to improve`,
  title: 'Your skill test result',
  html: `<p>Hi ${first(user)},</p>
    <p>You scored ${Math.round(percent)}% in ${esc(label)}. That shows where to focus. A short course on <strong>${esc(course)}</strong> from BM Academy can help you build it, with placement support.</p>
    <p>உங்கள் திறனை வளர்க்க இது ஒரு நல்ல தொடக்கம்.</p>
    ${button(utm(courseUrl, 'skill_gap'), 'See the course and book a free call')}`,
});

const jobsForYou = (user, jobs, { paid, frequency }) => ({
  subject: paid ? `${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching your profile` : `${jobs.length} job${jobs.length > 1 ? 's' : ''} that match you`,
  title: paid ? 'Your job alert' : 'Jobs that match your profile',
  html: `<p>Hi ${first(user)},</p>
    <p>${paid ? `Here are your ${String(frequency).toLowerCase()} matches:` : 'Since you last visited, these jobs match your profile:'}</p>
    <ul style="padding-left:18px;">${jobs.map((j) => `<li style="margin:6px 0;"><a href="${esc(utm(jobUrl(j), paid ? 'job_alert' : 'winback'))}" style="color:#059669;font-weight:bold;">${esc(j.title)}</a>${j.company?.name ? ` at ${esc(j.company.name)}` : ''}${j.location ? `, ${esc(j.location)}` : ''}</li>`).join('')}</ul>
    ${paid ? '' : '<p style="font-size:13px;color:#475569;">Want these in your inbox regularly? Job Alerts is available on our plans.</p>'}
    ${button(utm(`${frontend()}/jobs`, paid ? 'job_alert' : 'winback'), 'See all jobs')}`,
});

const firstJobTips = (user) => ({
  subject: 'Your job is live. Three tips to get better applicants',
  title: 'Get more from your first job post',
  html: `<p>Hi ${first(user)},</p>
    <p>Your first job is on Velaivaaipu. To attract good applicants: add the exact skills you need, state the salary range, and reply to applicants within 48 hours.</p>
    <p>Then review the shortlist our matching gives you.</p>
    ${button(link('/company/ats-pipeline', 'first_job_tips'), 'Review my applicants')}`,
});

const postJobTemplates = (user) => ({
  subject: 'Ready-made job posts, copy and publish in 2 minutes',
  title: 'Post your first job faster',
  html: `<p>Hi ${first(user)},</p>
    <p>You have not posted a job yet. We wrote ready-to-copy job posts for 10 common roles, so you only change the details.</p>
    <p>Posting is free to start.</p>
    ${button(link('/job-post-templates', 'post_job_templates'), 'Open the job post templates')}`,
});

const batchReadiness = (user, college, s) => ({
  subject: `${college.name}: batch readiness report`,
  title: 'Your batch readiness report',
  html: `<p>Hi ${first(user)},</p>
    <p>${s.registered} students joined from ${esc(college.name)}; ${s.tested} took a skill test and ${s.passRate}% passed (average ${s.avgPercent}%).</p>
    <p>Strongest: ${esc(s.best)}. Needs work: ${esc(s.weakest)}. Running a campus drive or workshop now will help.</p>
    ${button(link('/college/reports', 'batch_readiness'), 'Open full reports')}`,
});

const companyProfileIncomplete = (user) => ({
  subject: 'Finish your company page before candidates look',
  title: 'Finish your company page',
  html: `<p>Hi ${first(user)},</p>
    <p>Your company page is missing a logo or a description. Candidates look at the company before they apply.</p>
    <p>It takes about 3 minutes.</p>
    ${button(link('/company/profile-management', 'company_profile_incomplete'), 'Complete my company page')}`,
});

const collegeVerify = (user, college) => ({
  subject: `Get ${college.name} verified on Velaivaaipu`,
  title: 'Verify your college',
  html: `<p>Hi ${first(user)},</p>
    <p>${esc(college.name)} is not verified yet. Upload your proof once, and students and companies will see a verified college.</p>
    ${button(link('/college/verification', 'college_verify'), 'Verify my college')}`,
});

const collegeFirstDrive = (user, college) => ({
  subject: `Create your first campus drive for ${college.name}`,
  title: 'Start your first campus drive',
  html: `<p>Hi ${first(user)},</p>
    <p>A campus drive gives you a QR code. Students scan it, register with their name and WhatsApp number, and take a free skill test. No app to install.</p>
    ${button(link('/college/drives/new', 'college_first_drive'), 'Create a drive')}`,
});

const collegeFirstStudents = (user, college) => ({
  subject: 'Your drive is ready. Share the QR code with your students',
  title: 'Get your first students on board',
  html: `<p>Hi ${first(user)},</p>
    <p>Your drive for ${esc(college.name)} is created, but no students have joined yet. Share the QR code in your class groups or on the notice board.</p>
    ${button(link('/college/drives', 'college_first_students'), 'Open my drives')}`,
});

const wrap = (m, userId) => ({ subject: m.subject, html: lifecycleWrapper(m.title, m.html, userId), headers: unsubscribeHeaders(userId) });

module.exports = { companyProfileIncomplete, collegeVerify, collegeFirstDrive, collegeFirstStudents, profileIncomplete, skillTestInvite, skillGap, jobsForYou, firstJobTips, postJobTemplates, batchReadiness, wrap, jobUrl };
