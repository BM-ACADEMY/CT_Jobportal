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
    <ul style="padding-left:18px;">${jobs.map((j) => `<li style="margin:6px 0;"><a href="${esc(utm(jobUrl(j), paid ? 'job_alert' : 'winback'))}" style="color:#059669;font-weight:bold;">${esc(j.title)}</a>${j.company?.name ? ` at ${esc(j.company.name)}` : ''}${j.location ? `, ${esc(j.location)}` : ''}${Array.isArray(j.why) && j.why.length ? `<br><span style="font-size:12px;color:#475569;">Why this job: ${j.why.slice(0, 3).map(esc).join(' &middot; ')}</span>` : ''}</li>`).join('')}</ul>
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

// Sent once per job: the 5 best-fitting job seekers for a job the person just posted. Names and skills only; contact details
// stay behind the candidate search (which counts against the daily limit).
const topCandidates = (user, job, candidates) => ({
  subject: `${candidates.length} candidate${candidates.length > 1 ? 's' : ''} that fit your ${job.title} job`,
  title: 'Top candidates for your job',
  html: `<p>Hi ${first(user)},</p>
    <p>Based on skills, role, location and experience, these job seekers fit <strong>${esc(job.title)}</strong> best:</p>
    <ul style="padding-left:18px;">${candidates.map((c) => `<li style="margin:8px 0;"><strong>${esc(c.name)}</strong>${c.profile?.headline ? `, ${esc(c.profile.headline)}` : ''}${c.relevance?.reasons?.length ? `<br><span style="font-size:12px;color:#475569;">Why: ${c.relevance.reasons.slice(0, 3).map(esc).join(' &middot; ')}</span>` : ''}</li>`).join('')}</ul>
    <p style="font-size:13px;color:#475569;">This is a suggestion, not a guarantee. Review each profile before you decide.</p>
    ${button(link('/company/candidates', 'top_candidates'), 'Open candidate search')}`,
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

// Company not yet verified: its jobs are hidden from the public pages until our team verifies it. Honest ask: complete the page, keep the phone free.
const companyVerify = (user, stage) => ({
  subject: stage === 'first' ? 'Your jobs are not public yet. Get your company verified' : 'Still waiting: verify your company to show your jobs',
  title: 'Get your company verified',
  html: `<p>Hi ${first(user)},</p>
    <p>Candidates see jobs only from verified companies, so your jobs are not on the public page yet.</p>
    <p>Add your logo, website and a short description, and keep your phone free. Our team will call to verify you. It is free.</p>
    ${button(link('/company/profile-management', 'company_verify_' + stage), 'Complete my company page')}`,
});

const planEnding = (user, stage, planName) => ({
  subject: stage === 'expired' ? 'Your plan has ended' : stage === 'd1' ? 'Your plan ends tomorrow' : 'Your plan ends in a few days',
  title: stage === 'expired' ? 'Your plan has ended' : 'Your plan is ending',
  html: `<p>Hi ${first(user)},</p>
    <p>${stage === 'expired' ? `Your ${esc(planName || 'plan')} has ended, so paid features are switched off.` : `Your ${esc(planName || 'plan')} ends ${stage === 'd1' ? 'tomorrow' : 'soon'}.`}</p>
    <p>Renew to keep your jobs, candidate access and reports working without a break.</p>
    ${button(link('/plans', 'plan_' + stage), 'Renew my plan')}`,
});

const paymentRetry = (user, planName) => ({
  subject: 'Your payment did not go through',
  title: 'Your payment did not go through',
  html: `<p>Hi ${first(user)},</p>
    <p>Your payment${planName ? ` for ${esc(planName)}` : ''} did not complete. If money left your account, your bank usually returns it within a few working days.</p>
    <p>You can try again in a minute. If it keeps failing, reply to this mail and our team will help.</p>
    ${button(link('/plans', 'payment_retry'), 'Try again')}`,
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

// Weekly jobs mail for every active job seeker (free). Up to 5 real matches, with the reason each one fits.
const weeklyJobs = (user, jobs) => ({
  subject: `${jobs.length} new job${jobs.length > 1 ? 's' : ''} for you this week`,
  title: 'New jobs that fit you',
  html: `<p>Hi ${first(user)},</p>
    <p>These jobs were posted this week and match your profile:</p>
    <ul style="padding-left:18px;">${jobs.map((j) => `<li style="margin:6px 0;"><a href="${esc(utm(jobUrl(j), 'weekly_jobs'))}" style="color:#059669;font-weight:bold;">${esc(j.title)}</a>${j.company?.name ? ` at ${esc(j.company.name)}` : ''}${j.location ? `, ${esc(j.location)}` : ''}${j.why?.length ? `<br><span style="font-size:12px;color:#475569;">${esc(j.why.slice(0, 2).join(' · '))}</span>` : ''}</li>`).join('')}</ul>
    <p style="font-size:13px;color:#475569;">Applying is free. A complete profile and a resume help your application get seen.</p>
    ${button(utm(`${frontend()}/jobs`, 'weekly_jobs'), 'See all jobs')}`,
});

// Sent once after a payment: what they bought and the one place to start, so the money turns into a benefit.
const PAID_START = {
  seeker: { path: '/candidate/job-alerts', label: 'Set up my job alerts', tip: 'Set your alert once and matching jobs reach your inbox. Also try the AI resume review and mock interviews included in your plan.' },
  company: { path: '/company/candidates', label: 'Find candidates', tip: 'Post your job, then open Candidates to see people who fit. Your plan lets you contact them directly.' },
  college: { path: '/college/drives', label: 'Open my drives', tip: 'Create a drive and share the QR code with students. Their skill results show up in your reports.' },
};
const paidWelcome = (user, { audience, itemName }) => {
  const s = PAID_START[audience] || PAID_START.seeker;
  return {
    subject: `Your ${itemName || 'plan'} is active. Start here`,
    title: 'Thank you. Here is how to use it',
    html: `<p>Hi ${first(user)},</p>
      <p>Your payment for <strong>${esc(itemName || 'your plan')}</strong> went through. ${esc(s.tip)}</p>
      <p>Stuck on anything? Reply to this mail or write to hello@velaivaaipu.in and we will help.</p>
      ${button(link(s.path, 'paid_welcome'), s.label)}`,
  };
};

// Recruiter mails: new applicants (weekly), a job about to close, and the day before / after a walk-in drive.
const applicantsWeekly = (user, { total, pending, topJob }) => ({
  subject: `${total} new applicant${total > 1 ? 's' : ''} on your jobs this week`,
  title: 'Applicants are waiting',
  html: `<p>Hi ${first(user)},</p>
    <p>${total} new ${total > 1 ? 'people applied' : 'person applied'} to your jobs this week${topJob ? `, most for <strong>${esc(topJob)}</strong>` : ''}. ${pending} ${pending === 1 ? 'is' : 'are'} still waiting for your review.</p>
    <p>Quick replies keep good candidates interested.</p>
    ${button(link('/company/candidates', 'applicants_weekly'), 'Review applicants')}`,
});

const jobClosing = (user, job, { shortLife }) => ({
  subject: `Your job "${String(job.title).slice(0, 60)}" closes soon`,
  title: 'Your job is about to close',
  html: `<p>Hi ${first(user)},</p>
    <p><strong>${esc(job.title)}</strong> closes in about ${Math.max(1, Math.ceil((new Date(job.validThrough) - Date.now()) / 86400000))} day(s).</p>
    ${shortLife
    ? '<p>Jobs from free email addresses run for 14 days and cannot be renewed. To keep hiring, register with your company email or ask us to verify your company, and post again.</p>'
    : '<p>Still hiring? Extend it from your jobs page. Already hired? Close it so candidates are not kept waiting.</p>'}
    ${button(link('/company/jobs', 'job_closing'), 'Open my jobs')}`,
});

const drivePre = (user, drive, { registered }) => ({
  subject: `Tomorrow: ${String(drive.title).slice(0, 60)}. ${registered} registered`,
  title: 'Your drive is tomorrow',
  html: `<p>Hi ${first(user)},</p>
    <p><strong>${esc(drive.title)}</strong> is tomorrow. ${registered} ${registered === 1 ? 'person has' : 'people have'} registered. Candidates were reminded to bring their documents.</p>
    <p>Keep the check-in QR ready on your phone.</p>
    ${button(link('/company/drives', 'drive_pre'), 'Open drive')}`,
});

const drivePost = (user, drive, { registered, checkedIn }) => ({
  subject: `${String(drive.title).slice(0, 60)}: update your candidates`,
  title: 'Thanks for hosting your drive',
  html: `<p>Hi ${first(user)},</p>
    <p>${checkedIn} of ${registered} registered candidates checked in at <strong>${esc(drive.title)}</strong>.</p>
    <p>Mark who is shortlisted or selected so people hear back quickly. It also keeps your hiring record in one place.</p>
    ${button(link('/company/drives', 'drive_post'), 'Update candidates')}`,
});

const wrap = (m, userId) => ({ subject: m.subject, html: lifecycleWrapper(m.title, m.html, userId), headers: unsubscribeHeaders(userId) });

module.exports = { applicantsWeekly, jobClosing, drivePre, drivePost, weeklyJobs, paidWelcome, planEnding, paymentRetry, companyVerify, companyProfileIncomplete, collegeVerify, collegeFirstDrive, collegeFirstStudents, profileIncomplete, skillTestInvite, skillGap, jobsForYou, firstJobTips, postJobTemplates, topCandidates, batchReadiness, wrap, jobUrl };
