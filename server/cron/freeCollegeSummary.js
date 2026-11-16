const College = require('../models/College');
const CollegeStudent = require('../models/CollegeStudent');
const CampusDrive = require('../models/CampusDrive');
const AdminAlertLog = require('../models/AdminAlertLog');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const { reportRecipients } = require('../utils/reportEmail');
const { enabled, keyFor, pickDue, summaryHtml } = require('../utils/freeCollegeSummary');

// Daily check; each free college gets one summary per calendar month (the log key remembers it). Off with FREE_COLLEGE_SUMMARY=off.
const runFreeCollegeSummaries = async (now = new Date()) => {
  if (!enabled()) return;
  try {
    const colleges = await College.find({ isActive: true, verificationStatus: 'verified', $or: [{ subscriptionTier: 'campus_free' }, { subscriptionTier: null }] }).lean();
    const keys = colleges.map((c) => keyFor(c._id, now));
    const sent = new Set((await AdminAlertLog.find({ key: { $in: keys } }).select('key').lean()).map((r) => r.key));
    const since = new Date(now.getTime() - 30 * 86400000);
    const MAX_PER_RUN = 40; // a first run never floods; the rest go out on the next days
    const settled = new Date(now.getTime() - 30 * 86400000);
    const due = pickDue({ colleges: colleges.filter((c) => !c.createdAt || new Date(c.createdAt) <= settled), sentKeys: sent, now }).slice(0, MAX_PER_RUN);
    for (const college of due) {
      try {
        const [total, joined, drives, placed] = await Promise.all([
          CollegeStudent.countDocuments({ college: college._id }),
          CollegeStudent.countDocuments({ college: college._id, createdAt: { $gte: since } }),
          CampusDrive.countDocuments({ college: college._id, createdAt: { $gte: since } }),
          CollegeStudent.countDocuments({ college: college._id, placementStatus: 'placed' }),
        ]);
        if (!total) continue; // colleges with no students yet get the signup nudges, not a summary of zeros
        const html = summaryHtml({ college, stats: { joined, drives, placed }, frontendUrl: process.env.FRONTEND_URL || '', emailWrapper });
        const results = await Promise.allSettled(reportRecipients(college).map((email) => sendEmail({ email, subject: `[Velaivaaipu] ${college.name}: your monthly summary`, html })));
        if (results.some((r) => r.status === 'fulfilled' && r.value !== false)) {
          await AdminAlertLog.updateOne({ key: keyFor(college._id, now) }, { $setOnInsert: { key: keyFor(college._id, now) } }, { upsert: true }).catch(() => {});
        }
      } catch (err) { console.error(`[Cron] Free college summary failed for ${college.name}:`, err.message); }
    }
  } catch (err) { console.error('[Cron] Free college summaries failed:', err.message); }
};

module.exports = { runFreeCollegeSummaries };
