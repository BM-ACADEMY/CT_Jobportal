// Welcome series after sign-up. Day 0 is the welcome mail sent at verification (sendWelcomeEmail in utils/lifecycleEmails.js).
// This adds day 2 and day 5, per audience: 'seeker' (job seeker), 'company' (company/recruiter), 'college'.
// Sent by cron/lifecycleMails.js through the same deliver() path (EmailLog key = once only, weekly cap, unsubscribe link).
// Pure, so it can be tested. Wording rules as the other lifecycle mails: short, one button, honest, no fake urgency.
const { button, esc, frontend } = require('../lifecycleEmails');

const DAY = 86400000;
const STAGES = [{ stage: 'd2', min: 2, max: 9 }, { stage: 'd5', min: 5, max: 12 }];
const keyFor = (audience, stage) => `wel_${audience}_${stage}`;
const first = (user) => esc(String(user?.name || 'there').split(' ')[0]);
const link = (path, campaign) => `${frontend()}${path}?utm_source=email&utm_medium=lifecycle&utm_campaign=${campaign}`;

const COPY = {
  seeker: {
    d2: { subject: 'How to get noticed on Velaivaaipu', title: 'Two quick things that help', path: '/jobs', label: 'See jobs for me',
      body: '<p>Two things get job seekers noticed: a profile with your skills, and applying early to new jobs.</p><p>Open the "For you" tab on the jobs page to see openings that match your profile.</p>' },
    d5: { subject: 'Ready to apply to your first job?', title: 'Apply to your first job', path: '/jobs', label: 'Browse jobs',
      body: '<p>Pick one job that fits you and apply today. It takes a few minutes, and companies reply to applications they can see.</p><p>Need help with your resume? The AI Resume Builder in your dashboard can make one.</p>' },
  },
  company: {
    d2: { subject: 'Post your first job on Velaivaaipu', title: 'Your first job post', path: '/company/jobs/new', label: 'Post a job',
      body: '<p>Your account is set up. A job post with clear skills and a salary range gets better applicants.</p><p>Posting takes about 5 minutes.</p>' },
    d5: { subject: 'Get your company page ready for candidates', title: 'Show candidates who you are', path: '/company/profile-management', label: 'Open my company page',
      body: '<p>Candidates look at the company before they apply. Add your logo and a short description. Verified companies are shown to more job seekers.</p>' },
  },
  college: {
    d2: { subject: 'Create your first campus drive', title: 'Start with one drive', path: '/college/drives/new', label: 'Create a drive',
      body: '<p>A campus drive gives you a QR code. Students scan it, register with their WhatsApp number and take a free skill test. No app to install.</p>' },
    d5: { subject: 'Bring your first students on board', title: 'Share the QR code', path: '/college/dashboard', label: 'Go to my dashboard',
      body: '<p>Share your drive QR code in class groups or on the notice board. You see how your batch performs once students take the test.</p>' },
  },
};

// Which stages are due for someone who signed up at `createdAt`. A stage is due from its day on, for a week, so a missed cron run catches up.
const dueStages = (createdAt, now = Date.now()) => {
  const age = (now - new Date(createdAt).getTime()) / DAY;
  return STAGES.filter((s) => age >= s.min && age <= s.max).map((s) => s.stage);
};

const audienceOf = (roleName) => (roleName === 'jobseeker' ? 'seeker' : roleName === 'college' ? 'college' : ['recruiter', 'company'].includes(roleName) ? 'company' : null);

const welcomeMail = (audience, stage, user) => {
  const c = COPY[audience]?.[stage];
  if (!c) return null;
  return { subject: c.subject, title: c.title, html: `<p>Hi ${first(user)},</p>${c.body}${button(link(c.path, `welcome_${audience}_${stage}`), c.label)}` };
};

const welcomeEnabled = (env = process.env) => env.LIFECYCLE_EMAILS_ENABLED === 'true';

module.exports = { STAGES, COPY, keyFor, dueStages, audienceOf, welcomeMail, welcomeEnabled };
