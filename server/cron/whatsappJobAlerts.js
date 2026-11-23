// WhatsApp job alerts: up to 3 matching jobs, at most one message per person per week, only to people who said yes.
// OFF unless WHATSAPP_JOB_ALERTS_ENABLED=true AND WA_TEMPLATE_JOB_ALERT (the approved Meta template name) AND FRONTEND_URL are set.
// Template body, 4 variables: "Hi {{1}}, {{2}} new jobs match you: {{3}}. See them: {{4}}"
const MAX_PER_RUN = 150;

const weekId = (d = new Date()) => {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const week = Math.ceil(((t - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(week).padStart(2, '0')}`;
};

const eligibleUserFilter = (roleId) => ({
  role: roleId, isVerified: true, isDeleted: { $ne: true }, isAdminBlocked: { $ne: true },
  'whatsapp.optIn': true, 'whatsapp.number': { $ne: '' }, 'whatsapp.optOutAt': null,
});

const runWhatsAppJobAlerts = async ({ now = new Date(), deps = {} } = {}) => {
  const env = deps.env || process.env;
  if (env.WHATSAPP_JOB_ALERTS_ENABLED !== 'true' || !env.WA_TEMPLATE_JOB_ALERT || !env.FRONTEND_URL) return { skipped: 'off' };
  const User = deps.User || require('../models/User');
  const Job = deps.Job || require('../models/Job');
  const Role = deps.Role || require('../models/Role');
  const Log = deps.Log || require('../models/WhatsAppAlertLog');
  const send = deps.send || require('../utils/whatsapp').sendWhatsAppTemplate;
  const rank = deps.rank || require('../utils/lifecycle/jobMatch').rankForMail;

  const role = await Role.findOne({ name: 'jobseeker' }).select('_id').lean();
  if (!role) return { skipped: 'no_role' };
  const fresh = await Job.find({ status: 'active', validThrough: { $gt: now }, createdAt: { $gte: new Date(now.getTime() - 7 * 86400000) } })
    .populate('company', 'name').sort({ createdAt: -1 }).limit(300).lean();
  if (!fresh.length) return { sent: 0 };

  const period = weekId(now);
  const users = await User.find(eligibleUserFilter(role._id)).limit(MAX_PER_RUN * 3).lean();
  let sent = 0;
  for (const u of users) {
    if (sent >= MAX_PER_RUN) break;
    const jobs = rank(u, fresh, 3);
    if (!jobs.length) continue;
    try { await Log.create({ user: u._id, period }); } catch (e) { if (e.code === 11000) continue; throw e; }   // already handled this week
    const titles = jobs.map((j) => j.title).join(', ').slice(0, 200);
    const r = await send({ to: u.whatsapp.number, template: env.WA_TEMPLATE_JOB_ALERT, params: [String(u.name || 'there').split(' ')[0], jobs.length, titles, `${env.FRONTEND_URL.replace(/\/$/, '')}/jobs?source=wa_alert`] });
    await Log.updateOne({ user: u._id, period }, { $set: { status: r && r.ok ? 'sent' : (r && r.skipped ? 'skipped' : 'failed') } });
    if (r && r.ok) sent += 1;
  }
  return { sent };
};

module.exports = { runWhatsAppJobAlerts, weekId, eligibleUserFilter };
