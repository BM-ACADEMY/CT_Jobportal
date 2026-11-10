// Keeps the admin queue moving without anyone remembering to look:
//  - every 15 minutes: items with no owner go to the person set for their type; owners are reminded at 24 hours;
//    anything past 48 hours is escalated to the super admin
//  - 09:00 India time: a daily summary to the super admin
//  - every 30 minutes: failed payments are reported to the super admin
// Switch everything off with ADMIN_FOLLOWUP_ENABLED=false. It only reads existing records and sends messages.
const AdminAssignment = require('../models/AdminAssignment');
const AdminRoutingRule = require('../models/AdminRoutingRule');
const AdminAlertLog = require('../models/AdminAlertLog');
const Payment = require('../models/Payment');
const SpendEntry = require('../models/SpendEntry');
const { buildSpendSummary } = require('../utils/spendSummary');
const User = require('../models/User');
const { loadNeedsAction } = require('../utils/needsActionLoader');
const { notifyUser, notifyRoles } = require('../utils/inAppNotifications');
const College = require('../models/College');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const { pickCollegesToAsk, keyFor: collegeAskKey, ROLE_ASK } = require('../utils/collegeReminder');
const { planAutoAssign, planReminders, escalationBody, digestBody, paymentAlertBody } = require('../utils/adminFollowUp');

const enabled = () => process.env.ADMIN_FOLLOWUP_ENABLED !== 'false';
const LINK = '/admin/needs-action';

const alreadySent = async (keys) => new Set((await AdminAlertLog.find({ key: { $in: keys } }).select('key').lean()).map((r) => r.key));
const remember = async (keys) => {
  await Promise.all(keys.map((key) => AdminAlertLog.updateOne({ key }, { $setOnInsert: { key } }, { upsert: true }).catch(() => {})));
};

const runAutoAssignAndReminders = async () => {
  if (!enabled()) return;
  try {
    let { items } = await loadNeedsAction(new Date());

    const rules = await AdminRoutingRule.find({}).lean();
    const assignments = planAutoAssign(items, rules);
    for (const a of assignments) {
      await AdminAssignment.updateOne(
        { kind: a.kind, refId: a.id },
        { $setOnInsert: { ownerId: a.ownerId, ownerName: a.ownerName, assignedBy: 'auto' } },
        { upsert: true }
      ).catch(() => {});
    }
    if (assignments.length) ({ items } = await loadNeedsAction(new Date()));

    const { ownerReminders, escalations } = planReminders(items, await alreadySent(items.flatMap((i) => [`late:${i.kind}:${i.id}`, `overdue:${i.kind}:${i.id}`])));

    for (const { item, key } of ownerReminders) {
      await notifyUser({
        recipientId: item.owner.id, title: `Waiting more than 24 hours: ${item.label}`,
        message: `${item.title} has been waiting ${item.ageHours} hours and is yours.`, type: 'admin_reminder', link: LINK
      }).catch((e) => console.error('[Admin follow-up] reminder failed:', e.message));
      await remember([key]);
    }

    if (escalations.length) {
      await notifyRoles({
        roles: ['admin'], title: `${escalations.length} item${escalations.length === 1 ? '' : 's'} waiting more than 48 hours`,
        message: 'Open Needs action to see them.', type: 'admin_escalation', link: LINK,
        emailBody: escalationBody(escalations.map((e) => e.item))
      }).catch((e) => console.error('[Admin follow-up] escalation failed:', e.message));
      await remember(escalations.map((e) => e.key));
    }
  } catch (err) {
    console.error('[Admin follow-up] run failed:', err.message);
  }
};

const runDailyDigest = async () => {
  if (!enabled()) return;
  try {
    const since = new Date(Date.now() - 24 * 3600000);
    const [{ items, summary }, failedPayments, newUsers, paid] = await Promise.all([
      loadNeedsAction(new Date()),
      Payment.countDocuments({ status: 'failed', createdAt: { $gte: since } }),
      User.countDocuments({ createdAt: { $gte: since } }),
      Payment.aggregate([{ $match: { status: 'completed', createdAt: { $gte: since } } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);
    const spendEntries = await SpendEntry.find({ voided: { $ne: true } }).select('date line amount').lean().catch(() => []);
    const { budget } = buildSpendSummary({ entries: spendEntries, days: 1 });
    await notifyRoles({
      roles: ['admin'], title: `Velaivaaipu daily summary: ${summary.total} waiting, ${summary.overdue} overdue`,
      message: `${newUsers} new users, ${failedPayments} failed payments in the last 24 hours.`, type: 'admin_digest', link: LINK,
      emailBody: digestBody({ summary, items, failedPayments, newUsers, revenue: paid[0]?.total || 0, budget })
    });
  } catch (err) {
    console.error('[Admin follow-up] digest failed:', err.message);
  }
};

const runPaymentAlerts = async () => {
  if (!enabled()) return;
  try {
    const since = new Date(Date.now() - 3 * 3600000);
    const failed = await Payment.find({ status: 'failed', createdAt: { $gte: since } }).populate('user', 'email').select('amount createdAt user').lean();
    if (!failed.length) return;
    const sent = await alreadySent(failed.map((p) => `payment:${p._id}`));
    const fresh = failed.filter((p) => !sent.has(`payment:${p._id}`));
    if (!fresh.length) return;
    await notifyRoles({
      roles: ['admin'], title: `${fresh.length} failed payment${fresh.length === 1 ? '' : 's'}`,
      message: 'Someone tried to pay and it failed. A quick reply with a retry link often saves the sale.', type: 'admin_payment_alert', link: '/admin/payment-history',
      emailBody: paymentAlertBody(fresh.map((p) => ({ amount: p.amount, email: p.user?.email, createdAt: p.createdAt })))
    });
    await remember(fresh.map((p) => `payment:${p._id}`));
  } catch (err) {
    console.error('[Admin follow-up] payment alert failed:', err.message);
  }
};

// Once a day: colleges still pending after 2 days get one mail asking for name, role and phone. Never asked twice.
const escape = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const runCollegeRoleReminders = async () => {
  if (!enabled()) return;
  try {
    const pending = await College.find({ verificationStatus: 'pending', isTest: { $ne: true }, createdAt: { $lte: new Date(Date.now() - 2 * 86400000) } })
      .populate('tpoUser', 'name email').limit(50);
    const sent = await alreadySent(pending.map(collegeAskKey));
    for (const c of pickCollegesToAsk(pending, sent)) {
      const to = c.principalEmail || c.tpoUser?.email || c.collegeEmail;
      const ok = await sendEmail({
        email: to, subject: `[Velaivaaipu] ${c.name}: one quick detail to finish verification`,
        html: emailWrapper('One quick detail', `<p>Hi ${escape(c.tpoUser?.name || c.principalName || 'there')},</p><p>${escape(ROLE_ASK)}</p>`)
      }).catch(() => false);
      if (ok === false) continue;
      c.infoRequests = [...(c.infoRequests || []), { message: ROLE_ASK, askedAt: new Date() }];
      await c.save().catch(() => {});
      if (c.tpoUser?._id) notifyUser({ recipientId: c.tpoUser._id, title: 'One quick detail to finish verification', message: ROLE_ASK, type: 'college_verification', link: '/college/settings', email: false }).catch(() => {});
      await remember([collegeAskKey(c)]);
    }
  } catch (err) {
    console.error('[Admin follow-up] college reminders failed:', err.message);
  }
};

// Once a day: colleges whose student list is over 70%, 90% or 100% of their limit get one message per line crossed
// (the limit is part of the key, so a new pack or plan starts the count again). Our team gets one call task per college.
const runCollegeLimitNudges = async () => {
  if (!enabled()) return;
  try {
    const CollegeStudent = require('../models/CollegeStudent');
    const AdminRequest = require('../models/AdminRequest');
    const { effectiveStudentLimit } = require('../utils/collegePack');
    const { levelFor, nudgeText } = require('../utils/collegeLimit');
    const counts = new Map((await CollegeStudent.aggregate([{ $group: { _id: '$college', n: { $sum: 1 } } }])).map((r) => [String(r._id), r.n]));
    const colleges = await College.find({ isActive: true, isTest: { $ne: true }, verificationStatus: 'verified' }).populate('tpoUser', 'name email phone').limit(500);
    const due = [];
    for (const c of colleges) {
      const used = counts.get(String(c._id)) || 0; const limit = effectiveStudentLimit(c);
      const level = levelFor(used, limit);
      if (level) due.push({ c, used, limit, level, key: `limit:${c._id}:${limit}:${level}` });
    }
    const sent = await alreadySent(due.map((d) => d.key));
    for (const d of due.filter((x) => !sent.has(x.key))) {
      const text = nudgeText(d.level, { used: d.used, limit: d.limit, college: d.c.name });
      const tpoId = d.c.tpoUser?._id;
      if (tpoId) await notifyUser({ recipientId: tpoId, title: text.title, message: text.message, type: 'college_limit', link: '/college/dashboard' }).catch((e) => console.error('[Admin follow-up] limit notice failed:', e.message));
      const open = await AdminRequest.exists({ type: 'college_upgrade', college: d.c._id, status: { $in: ['pending', 'approved'] } });
      if (!open && tpoId) {
        await AdminRequest.create({
          user: tpoId, type: 'college_upgrade', college: d.c._id,
          bookingName: d.c.tpoUser?.name || d.c.principalName || '', bookingPhone: d.c.tpoUser?.phone || d.c.collegePhone || '', bookingEmail: d.c.tpoUser?.email || d.c.principalEmail || '',
          notes: `${d.c.name} has ${d.used} of ${d.limit} students (${d.level}% line crossed). Call to offer a student pack or Campus Lite.`
        }).catch((e) => console.error('[Admin follow-up] upgrade task failed:', e.message));
      }
      await remember([d.key]);
    }
  } catch (err) {
    console.error('[Admin follow-up] college limit nudges failed:', err.message);
  }
};

module.exports = { runAutoAssignAndReminders, runDailyDigest, runPaymentAlerts, runCollegeRoleReminders, runCollegeLimitNudges };
