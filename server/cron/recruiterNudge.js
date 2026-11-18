// Nudge to recruiters who leave applicants unread.
// OFF unless RECRUITER_NUDGE_ENABLED=true. Needs FRONTEND_URL for the link in the mail.
// Rules: an application is "unread" when it is still pending, has no first response, is older than 3 days and the
// recruiter has not opened the job's applicant list since it arrived. One nudge per company (or per independent
// recruiter) per 3 days, sent through the existing in-app notification + email sender. Opted-out people get the
// in-app notification only. Models are required lazily so this file loads without a database driver.
const DAY = 86400000;
const NUDGE_TYPE = 'recruiter_unread_nudge';
const WAIT_DAYS = 3;       // an application must be this old to count, and the cap between nudges
const LOOKBACK_DAYS = 45;  // older applications are not chased
const MAX_PER_RUN = () => Number(process.env.RECRUITER_NUDGE_MAX_PER_RUN || 100);
const enabled = (env = process.env) => env.RECRUITER_NUDGE_ENABLED === 'true';

// apps = unread applications ({ job }); jobs = their jobs ({ _id, title, company, recruiter, lastViewedApplicantsAt }).
// Returns [{ key, companyId, recruiterIds, count, jobCount }], one per company (or independent recruiter).
const groupUnread = (apps, jobs) => {
  const byJob = new Map(jobs.map((j) => [String(j._id), j]));
  const groups = new Map();
  for (const a of apps) {
    const job = byJob.get(String(a.job));
    if (!job) continue;
    if (job.lastViewedApplicantsAt && new Date(job.lastViewedApplicantsAt) >= new Date(a.createdAt)) continue; // recruiter already opened the list
    const key = job.company ? `c:${job.company}` : `r:${job.recruiter}`;
    if (!groups.has(key)) groups.set(key, { key, companyId: job.company ? String(job.company) : null, recruiterIds: new Set(), jobs: new Set(), count: 0 });
    const g = groups.get(key);
    g.recruiterIds.add(String(job.recruiter));
    g.jobs.add(String(job._id));
    g.count += 1;
  }
  return [...groups.values()].map((g) => ({ key: g.key, companyId: g.companyId, recruiterIds: [...g.recruiterIds], count: g.count, jobCount: g.jobs.size }));
};

const nudgeText = (count, jobCount) => ({
  title: 'Applicants are waiting for you',
  message: `${count} application${count === 1 ? '' : 's'} on ${jobCount} job${jobCount === 1 ? '' : 's'} ${count === 1 ? 'has' : 'have'} been waiting more than ${WAIT_DAYS} days. Candidates are more likely to join when they hear back quickly.`,
});

// deps are injectable for tests; by default the real models and sender are loaded on first use.
const runRecruiterNudge = async (deps = {}, now = Date.now()) => {
  if (!enabled()) return { skipped: 'disabled', sent: 0 };
  const Application = deps.Application || require('../models/Application');
  const Job = deps.Job || require('../models/Job');
  const User = deps.User || require('../models/User');
  const Notification = deps.Notification || require('../models/Notification');
  const notifyUsers = deps.notifyUsers || require('../utils/inAppNotifications').notifyUsers;

  const apps = await Application.find({
    status: 'pending',
    firstResponseAt: null,
    createdAt: { $lte: new Date(now - WAIT_DAYS * DAY), $gte: new Date(now - LOOKBACK_DAYS * DAY) },
  }).select('job createdAt').limit(5000).lean();
  if (!apps.length) return { sent: 0 };

  const jobs = await Job.find({ _id: { $in: [...new Set(apps.map((a) => String(a.job)))] }, status: 'active' })
    .select('title company recruiter lastViewedApplicantsAt').lean();
  const groups = groupUnread(apps, jobs);

  let sent = 0;
  for (const g of groups) {
    if (sent >= MAX_PER_RUN()) break;
    // Cap: 1 per company per 3 days. The record of the last nudge is the notification itself.
    const recent = await Notification.exists({ type: NUDGE_TYPE, 'metadata.groupKey': g.key, createdAt: { $gte: new Date(now - WAIT_DAYS * DAY) } });
    if (recent) continue;
    const people = await User.find({ _id: { $in: g.recruiterIds }, isAdminBlocked: { $ne: true } }).select('_id email emailPrefs').lean();
    if (!people.length) continue;
    const { title, message } = nudgeText(g.count, g.jobCount);
    const base = { title, message, type: NUDGE_TYPE, link: '/company/jobs', metadata: { groupKey: g.key, count: g.count } };
    const emailOk = people.filter((u) => u.email && !/\.portal$/i.test(u.email) && u.emailPrefs?.marketingOptOut !== true).map((u) => u._id);
    const emailSet = new Set(emailOk.map(String));
    const inAppOnly = people.filter((u) => !emailSet.has(String(u._id))).map((u) => u._id);
    try {
      if (emailOk.length) await notifyUsers({ ...base, recipientIds: emailOk, email: true });
      if (inAppOnly.length) await notifyUsers({ ...base, recipientIds: inAppOnly, email: false });
      sent += 1;
    } catch (err) {
      console.error('[RecruiterNudge] failed for', g.key, err.message);
    }
  }
  return { sent };
};

module.exports = runRecruiterNudge;
module.exports.runRecruiterNudge = runRecruiterNudge;
module.exports.groupUnread = groupUnread;
module.exports.nudgeText = nudgeText;
module.exports.enabled = enabled;
