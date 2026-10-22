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

const profileIncomplete = (user, pct) => ({
  subject: `${String(user.name || '').split(' ')[0] || 'Hi'}, recruiters skip incomplete profiles`,
  title: 'Your profile is almost there',
  html: `<p>Hi ${first(user)},</p>
    <p>Your Velaivaaipu profile is ${Math.round(pct)}% complete. Recruiters filter out profiles with missing skills or no resume.</p>
    <p>Add your skills and resume (about 5 minutes) so you show up when companies search.</p>
    ${button(link('/candidate/settings', 'profile_incomplete'), 'Finish my profile')}`,
});

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

const wrap = (m, userId) => ({ subject: m.subject, html: lifecycleWrapper(m.title, m.html, userId), headers: unsubscribeHeaders(userId) });

module.exports = { profileIncomplete, skillTestInvite, skillGap, jobsForYou, firstJobTips, postJobTemplates, batchReadiness, wrap, jobUrl };
