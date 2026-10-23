// Lifecycle mails for Velaivaaipu (Afra Ventures Smart Reply Mail Plan, "Platform lifecycle mails").
// OFF unless LIFECYCLE_EMAILS_ENABLED=true. Needs FRONTEND_URL and API_PUBLIC_URL (for the unsubscribe link).
// Rules: one lifecycle mail per person per day, once-only keys, never to unsubscribed users.
const User = require('../models/User');
const Role = require('../models/Role');
const Job = require('../models/Job');
const College = require('../models/College');
const Company = require('../models/Company');
const CampusDrive = require('../models/CampusDrive');
const CollegeStudent = require('../models/CollegeStudent');
const SkillTestResult = require('../models/SkillTestResult');
const EmailLog = require('../models/EmailLog');
const sendEmail = require('../utils/sendEmail');
const mails = require('../utils/lifecycle/mails');
const { rankJobsForUser, alertFrequency, ALERT_PERIOD_DAYS } = require('../utils/lifecycle/jobMatch');
const { computeBatchStats, periodId } = require('../utils/lifecycle/stats');
const { getCategory, PASS_RATIO } = require('../config/courseMap');

const DAY = 86400000;
const ago = (days, now = Date.now()) => new Date(now - days * DAY);
const BATCH = Number(process.env.LIFECYCLE_BATCH || 200);
const MAX_PER_RUN = Number(process.env.LIFECYCLE_MAX_PER_RUN || 150);
const MIN_STUDENTS = Number(process.env.LIFECYCLE_MIN_STUDENTS || 10);
const realEmail = (u) => u?.email && !/\.portal$/i.test(u.email);
const optedOut = (u) => u?.emailPrefs?.marketingOptOut === true;

const enabled = () => process.env.LIFECYCLE_EMAILS_ENABLED === 'true' && process.env.FRONTEND_URL && process.env.API_PUBLIC_URL;

// Claims (user, key) first so two runs can never send the same mail, then sends.
const SENDER_ENV = { seeker: 'LIFECYCLE_FROM_SEEKER', company: 'LIFECYCLE_FROM_COMPANY', college: 'LIFECYCLE_FROM_COLLEGE' };
const senderFor = (audience) => process.env[SENDER_ENV[audience]] || process.env.LIFECYCLE_FROM || '';

const deliver = async (state, user, key, mail, audience = 'seeker') => {
  if (state.sent >= MAX_PER_RUN || !mail) return false;
  if (!realEmail(user) || optedOut(user)) return false;
  const recent = await EmailLog.exists({ user: user._id, sentAt: { $gte: ago(20 / 24) } });
  if (recent) return false;
  try {
    await EmailLog.create({ user: user._id, key });
  } catch (err) {
    if (err.code === 11000) return false;
    throw err;
  }
  const ok = await sendEmail({
    email: user.email,
    subject: mail.subject,
    html: mail.html,
    headers: mail.headers,
    ...(senderFor(audience) ? { from: senderFor(audience) } : {}),
  });
  if (!ok) { await EmailLog.deleteOne({ user: user._id, key }).catch(() => {}); return false; }
  state.sent += 1;
  await new Promise((r) => setTimeout(r, 300)); // gentle pacing for SMTP limits
  return true;
};

const baseUserFilter = { isVerified: true, isAdminBlocked: { $ne: true }, 'emailPrefs.marketingOptOut': { $ne: true }, email: { $not: /\.portal$/i } };

// Three nudges while the profile stays under 70%: day 2, day 7, then once a month. Each is sent at most once (the monthly one once per month).
const profileIncomplete = async (state) => {
  const role = await Role.findOne({ name: 'jobseeker' }).select('_id');
  const month = new Date().toISOString().slice(0, 7);
  const stages = [
    { stage: 'first', key: 'js_profile_incomplete', min: 2, max: 30 },
    { stage: 'second', key: 'js_profile_incomplete_d7', min: 7, max: 30 },
    { stage: 'monthly', key: `js_profile_monthly-${month}`, min: 30, max: 180 },
  ];
  for (const st of stages) {
    const users = await User.find({ ...baseUserFilter, role: role._id, createdAt: { $gte: ago(st.max), $lte: ago(st.min) }, 'profile.profileCompletion': { $lt: 70 } }).limit(BATCH);
    for (const u of users) await deliver(state, u, st.key, mails.wrap(mails.profileIncomplete(u, u.profile?.profileCompletion || 0, st.stage), u._id));
  }
};

const skillTestInvite = async (state) => {
  const role = await Role.findOne({ name: 'jobseeker' }).select('_id');
  const users = await User.find({ ...baseUserFilter, role: role._id, createdAt: { $gte: ago(30), $lte: ago(1) }, 'profile.profileCompletion': { $gte: 70 } }).limit(BATCH);
  for (const u of users) {
    if (await SkillTestResult.exists({ user: u._id })) continue;
    await deliver(state, u, 'js_skill_test_invite', mails.wrap(mails.skillTestInvite(u), u._id));
  }
};

// Low campus test score -> skill-gap mail with the matching BM Academy course.
const skillGap = async (state) => {
  const courseUrl = process.env.COURSE_PAGE_URL;
  if (!courseUrl) return;
  const students = await CollegeStudent.find({ 'assessmentScores.completedAt': { $gte: ago(14), $lte: ago(1 / 24) } })
    .populate('user', 'name email emailPrefs').limit(BATCH);
  for (const s of students) {
    const last = [...(s.assessmentScores || [])].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];
    const cat = getCategory(last?.category);
    if (!cat || !last.total || last.score / last.total >= PASS_RATIO || !s.user) continue;
    await deliver(state, s.user, 'js_skill_gap', mails.wrap(mails.skillGap(s.user, { label: cat.label, percent: (last.score / last.total) * 100, course: cat.course, courseUrl }), s.user._id));
  }
};

// Paid Job Alerts (plan tier or pay-per) and the free win-back for people who stopped visiting.
const jobMails = async (state) => {
  const role = await Role.findOne({ name: 'jobseeker' }).select('_id');
  const now = new Date();
  const fresh = await Job.find({ status: 'active', validThrough: { $gt: now }, createdAt: { $gte: ago(30) } })
    .populate('company', 'name').sort({ createdAt: -1 }).limit(400).lean();
  if (!fresh.length) return;

  const paidUsers = await User.find({
    ...baseUserFilter, role: role._id,
    $or: [{ 'subscriptionDetails.jobAlerts': { $in: Object.keys(ALERT_PERIOD_DAYS) } }, { purchasedFeatures: { $elemMatch: { isActive: true, featureKey: { $in: ['jobAlerts', 'hasJobAlerts'] } } } }],
  }).limit(BATCH);
  const paidIds = new Set();
  for (const u of paidUsers) {
    const freq = alertFrequency(u, now);
    if (!freq) continue;
    paidIds.add(String(u._id));
    const days = ALERT_PERIOD_DAYS[freq];
    const jobs = rankJobsForUser(u, fresh.filter((j) => new Date(j.createdAt) >= ago(days)), 5);
    if (jobs.length) await deliver(state, u, `alert-${freq}-${periodId(days, now)}`, mails.wrap(mails.jobsForYou(u, jobs, { paid: true, frequency: freq }), u._id));
  }

  const lapsed = await User.find({ ...baseUserFilter, role: role._id, lastLoginAt: { $gte: ago(60), $lte: ago(7) } }).limit(BATCH);
  for (const u of lapsed) {
    if (paidIds.has(String(u._id))) continue;
    const jobs = rankJobsForUser(u, fresh.filter((j) => new Date(j.createdAt) >= ago(14)), 3);
    if (jobs.length) await deliver(state, u, `winback-${periodId(14, now)}`, mails.wrap(mails.jobsForYou(u, jobs, { paid: false }), u._id));
  }
};

const employerMails = async (state) => {
  const roles = await Role.find({ name: { $in: ['recruiter', 'company'] } }).select('_id');
  const roleIds = roles.map((r) => r._id);

  const owners = await Job.find({ status: 'active', createdAt: { $gte: ago(14), $lte: ago(1) } }).distinct('recruiter');
  const posters = await User.find({ ...baseUserFilter, _id: { $in: owners.slice(0, BATCH) }, role: { $in: roleIds } });
  for (const u of posters) await deliver(state, u, 'co_first_job_tips', mails.wrap(mails.firstJobTips(u), u._id), 'company');

  const idle = await User.find({ ...baseUserFilter, role: { $in: roleIds }, isTeamManaged: { $ne: true }, createdAt: { $gte: ago(30), $lte: ago(5) } }).limit(BATCH);
  for (const u of idle) {
    if (await Job.exists({ recruiter: u._id })) continue;
    await deliver(state, u, 'co_post_job_templates', mails.wrap(mails.postJobTemplates(u), u._id), 'company');
  }
};

// Company page missing a logo or description, 3 to 30 days after sign-up.
const companyProfileNudge = async (state) => {
  const roles = await Role.find({ name: { $in: ['recruiter', 'company'] } }).select('_id');
  const users = await User.find({ ...baseUserFilter, role: { $in: roles.map((r) => r._id) }, company: { $ne: null }, createdAt: { $gte: ago(30), $lte: ago(3) } }).limit(BATCH);
  for (const u of users) {
    const co = await Company.findById(u.company).select('logo logo_url description').lean();
    if (!co || ((co.logo || co.logo_url) && co.description)) continue;
    await deliver(state, u, 'co_complete_company_profile', mails.wrap(mails.companyProfileIncomplete(u), u._id), 'company');
  }
};

// New colleges: verify (day 3), create a first drive (day 4), share the QR when a drive has no students (day 7).
const collegeOnboarding = async (state) => {
  const colleges = await College.find({ createdAt: { $gte: ago(45), $lte: ago(3) } }).populate('tpoUser', 'name email emailPrefs').limit(BATCH);
  for (const c of colleges) {
    if (!c.tpoUser) continue;
    const ageDays = (Date.now() - new Date(c.createdAt).getTime()) / DAY;
    const send = (key, mail) => deliver(state, c.tpoUser, key, mails.wrap(mail, c.tpoUser._id), 'college');
    if (c.verificationStatus !== 'verified' && await send('col_verify', mails.collegeVerify(c.tpoUser, c))) continue;
    const drives = await CampusDrive.countDocuments({ college: c._id });
    if (!drives) { if (ageDays >= 4) await send('col_first_drive', mails.collegeFirstDrive(c.tpoUser, c)); continue; }
    if (ageDays >= 7 && !(await CollegeStudent.exists({ college: c._id }))) await send('col_first_students', mails.collegeFirstStudents(c.tpoUser, c));
  }
};

const collegeMails = async (state) => {
  const colleges = await College.find({}).populate('tpoUser', 'name email emailPrefs').limit(BATCH);
  const month = new Date().toISOString().slice(0, 7);
  for (const c of colleges) {
    if (!c.tpoUser) continue;
    const students = await CollegeStudent.find({ college: c._id }).select('assessmentScores').lean();
    if (students.length < MIN_STUDENTS) continue;
    const stats = computeBatchStats(students);
    if (stats.tested < 5) continue;
    await deliver(state, c.tpoUser, `batch-readiness-${month}`, mails.wrap(mails.batchReadiness(c.tpoUser, c, stats), c.tpoUser._id), 'college');
  }
};

const runLifecycleMails = async () => {
  if (!enabled()) return;
  const state = { sent: 0 };
  // Order matters: the first rule that mails a person today wins (one mail per person per day).
  for (const rule of [profileIncomplete, skillTestInvite, skillGap, jobMails, companyProfileNudge, employerMails, collegeOnboarding, collegeMails]) {
    try { await rule(state); } catch (err) { console.error(`[Cron] Lifecycle rule ${rule.name} failed:`, err.message); }
    if (state.sent >= MAX_PER_RUN) break;
  }
  if (state.sent) console.log(`[Cron] Lifecycle mails sent: ${state.sent}`);
};

module.exports = runLifecycleMails;
