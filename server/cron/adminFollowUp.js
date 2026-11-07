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

module.exports = { runAutoAssignAndReminders, runDailyDigest, runPaymentAlerts };
