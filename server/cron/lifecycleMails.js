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
const { getTopCandidatesForJob, engineEnabled } = require('../utils/matchingJobs');
const { rankForMail, alertFrequency, ALERT_PERIOD_DAYS } = require('../utils/lifecycle/jobMatch');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const { expiryStage, failedPaymentDue } = require('../utils/lifecycle/billing');
const { computeBatchStats, periodId } = require('../utils/lifecycle/stats');
const policy = require('../utils/lifecycle/emailPolicy');
const welcome = require('../utils/lifecycle/welcomeSeries');
const Feedback = require('../models/Feedback');
const { signFeedbackToken, ASK_AFTER_DAYS, ASK_WINDOW_DAYS } = require('../utils/paymentFeedback');
const WalkInDrive = require('../models/WalkInDrive');
const DriveRegistration = require('../models/DriveRegistration');
const { istDayStart } = require('../utils/driveRules');
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
  if (!policy.isTransactional(key)) { // weekly cap: never more than a few marketing-style mails a week
    const lastWeek = await EmailLog.countDocuments({ user: user._id, sentAt: { $gte: ago(7) }, key: { $not: /^(plan_|pay_|paid_)/ } });
    if (!policy.underWeeklyCap(audience, lastWeek)) return false;
  }
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

// Jobs the person already applied to, so the engine never mails them again. Only looked up when the engine is on.
const appliedJobIds = async (u) => (process.env.RELEVANCE_ENGINE_ENABLED === 'true'
  ? (await Application.find({ applicant: u._id }).select('job').lean()).map((a) => String(a.job))
  : []);

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
    const jobs = rankForMail(u, fresh.filter((j) => new Date(j.createdAt) >= ago(days)), 5, { appliedJobIds: await appliedJobIds(u) });
    if (jobs.length) await deliver(state, u, `alert-${freq}-${periodId(days, now)}`, mails.wrap(mails.jobsForYou(u, jobs, { paid: true, frequency: freq }), u._id));
  }

  const lapsed = await User.find({ ...baseUserFilter, role: role._id, lastLoginAt: { $gte: ago(60), $lte: ago(7) } }).limit(BATCH);
  for (const u of lapsed) {
    if (paidIds.has(String(u._id))) continue;
    const jobs = rankForMail(u, fresh.filter((j) => new Date(j.createdAt) >= ago(14)), 3, { appliedJobIds: await appliedJobIds(u) });
    if (jobs.length) await deliver(state, u, `winback-${periodId(14, now)}`, mails.wrap(mails.jobsForYou(u, jobs, { paid: false }), u._id));
  }
};

// Once per job, 1 hour to 3 days after posting: the 5 best-fitting candidates, mailed to whoever posted it.
// Only with the relevance engine on, and only when at least one candidate really fits.
const topCandidatesMail = async (state) => {
  if (!engineEnabled()) return;
  const roles = await Role.find({ name: { $in: ['recruiter', 'company'] } }).select('_id');
  const jobs = await Job.find({ status: 'active', validThrough: { $gt: new Date() }, createdAt: { $gte: ago(3), $lte: ago(1 / 24) } })
    .populate('company', 'name').sort({ createdAt: -1 }).limit(BATCH).lean();
  for (const job of jobs) {
    if (state.sent >= MAX_PER_RUN) break;
    const poster = await User.findOne({ ...baseUserFilter, _id: job.recruiter, role: { $in: roles.map((r) => r._id) } });
    if (!poster) continue;
    const key = `co_top_candidates-${job._id}`;
    if (await EmailLog.exists({ user: poster._id, key })) continue; // skip the expensive ranking when already sent
    const candidates = await getTopCandidatesForJob(job, { User, Role, SkillTestResult });
    if (!candidates.length) continue;
    await deliver(state, poster, key, mails.wrap(mails.topCandidates(poster, job, candidates), poster._id), 'company');
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

// Unverified companies with a live job: one mail, then one more a week later (max two). Their jobs stay hidden from the public until verified.
const companyVerifyNudge = async (state) => {
  const roles = await Role.find({ name: { $in: ['recruiter', 'company'] } }).select('_id');
  const users = await User.find({ ...baseUserFilter, role: { $in: roles.map((r) => r._id) }, company: { $ne: null } }).limit(BATCH);
  for (const u of users) {
    const co = await Company.findById(u.company).select('is_verified hiddenFromPublic createdAt').lean();
    if (!co || co.is_verified || co.hiddenFromPublic) continue;
    if (!(await Job.exists({ recruiter: u._id, status: 'active' }))) continue;
    const first = await EmailLog.findOne({ user: u._id, key: 'co_verify_d1' }).select('sentAt').lean();
    if (!first) { await deliver(state, u, 'co_verify_d1', mails.wrap(mails.companyVerify(u, 'first'), u._id), 'company'); continue; }
    if (Date.now() - new Date(first.sentAt).getTime() >= 7 * DAY) await deliver(state, u, 'co_verify_d7', mails.wrap(mails.companyVerify(u, 'second'), u._id), 'company');
  }
};

// Plan ending (7 days, 1 day, just ended) and a retry mail after a failed payment. Mails only: payments and Razorpay are not touched.
const billingMails = async (state) => {
  const soon = await User.find({ ...baseUserFilter, subscription: { $ne: null }, subscriptionExpiry: { $gte: ago(3), $lte: new Date(Date.now() + 8 * DAY) } }).populate('subscription', 'name price').limit(BATCH);
  for (const u of soon) {
    if (!(u.subscription && u.subscription.price > 0)) continue; // free plans do not end
    const s = expiryStage(u.subscriptionExpiry);
    if (s) await deliver(state, u, s.key, mails.wrap(mails.planEnding(u, s.stage, u.subscription.name), u._id), 'company');
  }
  const failed = await Payment.find({ status: 'failed', createdAt: { $gte: ago(2) } }).select('user').lean();
  for (const uid of [...new Set(failed.map((p) => String(p.user)))].slice(0, BATCH)) {
    const user = await User.findOne({ ...baseUserFilter, _id: uid });
    if (!user) continue;
    const recent = await Payment.find({ user: uid, createdAt: { $gte: ago(2) } }).populate('plan', 'name').select('status createdAt plan').lean();
    const due = failedPaymentDue(recent);
    if (due) await deliver(state, user, due.key, mails.wrap(mails.paymentRetry(user, recent.find((p) => p.status === 'failed')?.plan?.name), user._id), 'company');
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

// Free weekly jobs mail for job seekers (Tue-Thu). Skips people with no real match, people who just applied, and paid-alert holders (they have their own).
const weeklyJobs = async (state) => {
  const now = new Date();
  if (!policy.isDigestDay(now)) return;
  const role = await Role.findOne({ name: 'jobseeker' }).select('_id');
  const fresh = await Job.find({ status: 'active', validThrough: { $gt: now }, createdAt: { $gte: ago(7) } })
    .populate('company', 'name').sort({ createdAt: -1 }).limit(400).lean();
  if (!fresh.length) return;
  const week = `weekly-${periodId(7, now)}`;
  const done = (await EmailLog.find({ key: week }).select('user').lean()).map((l) => l.user);
  const users = await User.find({
    ...baseUserFilter, role: role._id, _id: { $nin: done },
    'profile.profileCompletion': { $gte: 40 },
    $or: [{ lastLoginAt: { $gte: ago(90) } }, { lastLoginAt: null, createdAt: { $gte: ago(90) } }],
  }).limit(BATCH);
  for (const u of users) {
    if (state.sent >= MAX_PER_RUN) break;
    if (alertFrequency(u, now)) continue;
    const last = await Application.findOne({ applicant: u._id }).sort({ createdAt: -1 }).select('createdAt').lean();
    if (policy.recentlyApplied(last?.createdAt)) continue;
    const jobs = rankForMail(u, fresh, 5, { appliedJobIds: await appliedJobIds(u) });
    if (jobs.length) await deliver(state, u, week, mails.wrap(mails.weeklyJobs(u, jobs), u._id));
  }
};

// Once after a completed payment (first 3 days): what they bought and where to start. Not counted against the weekly cap.
const paidWelcome = async (state) => {
  const payments = await Payment.find({ status: 'completed', amount: { $gt: 0 }, createdAt: { $gte: ago(3), $lte: ago(1 / 24) } })
    .populate('plan', 'name').populate('payPerFeature', 'name').sort({ createdAt: -1 }).limit(BATCH).lean();
  const roles = await Role.find({ name: { $in: ['jobseeker', 'recruiter', 'company', 'college'] } }).lean();
  const nameOf = Object.fromEntries(roles.map((r) => [String(r._id), r.name]));
  for (const p of payments) {
    const user = await User.findOne({ ...baseUserFilter, _id: p.user });
    if (!user) continue;
    const rn = nameOf[String(user.role)];
    const audience = rn === 'jobseeker' ? 'seeker' : rn === 'college' ? 'college' : 'company';
    await deliver(state, user, `paid_welcome-${p._id}`, mails.wrap(mails.paidWelcome(user, { audience, itemName: p.plan?.name || p.payPerFeature?.name }), user._id), audience);
  }
};

// Weekly (Tue-Thu) to recruiters: how many people applied to their jobs in the last 7 days and how many wait for review.
const applicantsWeekly = async (state) => {
  const now = new Date();
  if (!policy.isDigestDay(now)) return;
  const apps = await Application.find({ createdAt: { $gte: ago(7) }, status: { $ne: 'withdrawn' } }).select('job status').lean();
  if (!apps.length) return;
  const jobs = await Job.find({ _id: { $in: [...new Set(apps.map((a) => a.job))] } }).select('recruiter title').lean();
  const byRecruiter = new Map();
  for (const j of jobs) {
    const mine = apps.filter((a) => String(a.job) === String(j._id));
    const r = byRecruiter.get(String(j.recruiter)) || { total: 0, pending: 0, best: { title: '', n: 0 } };
    r.total += mine.length; r.pending += mine.filter((a) => a.status === 'pending').length;
    if (mine.length > r.best.n) r.best = { title: j.title, n: mine.length };
    byRecruiter.set(String(j.recruiter), r);
  }
  const week = `co_applicants-${periodId(7, now)}`;
  for (const [id, r] of [...byRecruiter].slice(0, BATCH)) {
    const u = await User.findOne({ ...baseUserFilter, _id: id });
    if (u) await deliver(state, u, week, mails.wrap(mails.applicantsWeekly(u, { total: r.total, pending: r.pending, topJob: r.best.title }), u._id), 'company');
  }
};

// One mail per job, 1 to 3 days before it closes.
const jobClosing = async (state) => {
  const jobs = await Job.find({ status: 'active', validThrough: { $gt: new Date(Date.now() + 12 * 3600000), $lte: ago(-3) } }).select('title validThrough recruiter shortLife').limit(BATCH).lean();
  for (const j of jobs) {
    const u = await User.findOne({ ...baseUserFilter, _id: j.recruiter });
    if (u) await deliver(state, u, `co_job_closing-${j._id}`, mails.wrap(mails.jobClosing(u, j, { shortLife: !!j.shortLife }), u._id), 'company');
  }
};

// Walk-in drive organiser: a heads-up the day before and a follow-up the day after. (Candidates get their own reminders from cron/driveReminders.js.)
const driveOrganiser = async (state) => {
  const today = istDayStart(new Date()).getTime();
  const drives = await WalkInDrive.find({ status: 'published', date: { $gte: new Date(today - DAY), $lt: new Date(today + 2 * DAY) } }).limit(BATCH);
  for (const d of drives) {
    const u = await User.findOne({ ...baseUserFilter, _id: d.organiser });
    if (!u) continue;
    const at = istDayStart(d.date).getTime();
    const registered = await DriveRegistration.countDocuments({ drive: d._id });
    if (at === today + DAY) { if (registered) await deliver(state, u, `co_drive_pre-${d._id}`, mails.wrap(mails.drivePre(u, d, { registered }), u._id), 'company'); }
    else if (at === today - DAY && registered) {
      const checkedIn = await DriveRegistration.countDocuments({ drive: d._id, status: { $ne: 'registered' } });
      await deliver(state, u, `co_drive_post-${d._id}`, mails.wrap(mails.drivePost(u, d, { registered, checkedIn }), u._id), 'company');
    }
  }
};

// A week after a completed payment: did it deliver what they expected? Once per payment, skipped when they already answered.
const paymentFeedbackAsk = async (state) => {
  const payments = await Payment.find({ status: 'completed', amount: { $gt: 0 }, createdAt: { $gte: ago(ASK_WINDOW_DAYS), $lte: ago(ASK_AFTER_DAYS) } })
    .populate('plan', 'name').populate('payPerFeature', 'name').sort({ createdAt: -1 }).limit(BATCH).lean();
  for (const p of payments) {
    if (await Feedback.exists({ payment: p._id })) continue;
    const user = await User.findOne({ ...baseUserFilter, _id: p.user });
    if (!user) continue;
    const itemName = p.plan?.name || p.payPerFeature?.name || '';
    await deliver(state, user, `paid_feedback-${p._id}`, mails.wrap(mails.paymentFeedbackAsk(user, { itemName, token: signFeedbackToken(user._id, p._id) }), user._id), 'company');
  }
};

// Welcome series: day 2 and day 5 after sign-up (day 0 is sent at verification). Per audience, once each (EmailLog key).
const welcomeSeries = async (state) => {
  const roles = await Role.find({ name: { $in: ['jobseeker', 'recruiter', 'company', 'college'] } }).select('_id name').lean();
  const nameById = new Map(roles.map((r) => [String(r._id), r.name]));
  const users = await User.find({ ...baseUserFilter, role: { $in: roles.map((r) => r._id) }, isTeamManaged: { $ne: true }, createdAt: { $gte: ago(12), $lte: ago(2) } }).limit(BATCH);
  for (const u of users) {
    const audience = welcome.audienceOf(nameById.get(String(u.role)));
    if (!audience) continue;
    for (const stage of welcome.dueStages(u.createdAt)) {
      const sent = await deliver(state, u, welcome.keyFor(audience, stage), mails.wrap(welcome.welcomeMail(audience, stage, u), u._id), audience);
      if (sent) break; // one mail per person per run
    }
  }
};

const runLifecycleMails = async () => {
  if (!enabled()) return;
  const state = { sent: 0 };
  // Order matters: the first rule that mails a person today wins (one mail per person per day).
  for (const rule of [paidWelcome, paymentFeedbackAsk, welcomeSeries, profileIncomplete, skillTestInvite, skillGap, jobMails, weeklyJobs, driveOrganiser, applicantsWeekly, jobClosing, companyProfileNudge, companyVerifyNudge, billingMails, topCandidatesMail, employerMails, collegeOnboarding, collegeMails]) {
    try { await rule(state); } catch (err) { console.error(`[Cron] Lifecycle rule ${rule.name} failed:`, err.message); }
    if (state.sent >= MAX_PER_RUN) break;
  }
  if (state.sent) console.log(`[Cron] Lifecycle mails sent: ${state.sent}`);
};

module.exports = runLifecycleMails;
