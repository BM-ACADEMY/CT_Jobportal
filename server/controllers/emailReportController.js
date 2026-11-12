const EmailLog = require('../models/EmailLog');
const Payment = require('../models/Payment');
const { conversionReport, WEEKLY_CAP, ATTRIBUTION_DAYS } = require('../utils/lifecycle/emailPolicy');

// GET /api/admin/email-report?days=30 : what the automatic mails sent, and how many payments followed within 7 days.
const getEmailReport = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 90);
    const since = new Date(Date.now() - days * 86400000);
    const logs = await EmailLog.find({ sentAt: { $gte: new Date(since.getTime() - ATTRIBUTION_DAYS * 86400000) } }).select('user key sentAt').lean();
    const payments = await Payment.find({ status: 'completed', amount: { $gt: 0 }, createdAt: { $gte: since } }).select('user createdAt amount baseAmount').lean();
    const inWindow = logs.filter((l) => l.sentAt >= since);
    res.json({
      days,
      enabled: process.env.LIFECYCLE_EMAILS_ENABLED === 'true',
      totalSent: inWindow.length,
      weeklyCap: WEEKLY_CAP,
      note: `A payment counts as "followed" a mail when the same person paid within ${ATTRIBUTION_DAYS} days after getting it. It shows a link, it does not prove the mail caused it.`,
      rows: conversionReport(logs, payments, since).filter((r) => r.sent || r.paymentsFollowed),
      attributed: conversionReport(logs, payments).reduce((a, r) => a + r.paymentsFollowed, 0),
      payments: payments.length,
    });
  } catch (err) {
    console.error('Email report error:', err.message);
    res.status(500).json({ message: 'Could not load the email report.' });
  }
};

// GET /api/admin/email-report/by-type : sent counts per mail type for the last 7 and 30 days (see utils/lifecycle/emailCounts.js).
const getEmailCountsByType = async (req, res) => {
  try {
    const { countByType } = require('../utils/lifecycle/emailCounts');
    const since = new Date(Date.now() - 30 * 86400000);
    const logs = await EmailLog.find({ sentAt: { $gte: since } }).select('key sentAt').lean();
    res.json({ enabled: process.env.LIFECYCLE_EMAILS_ENABLED === 'true', ...countByType(logs) });
  } catch (err) {
    console.error('Email counts error:', err.message);
    res.status(500).json({ message: 'Could not load the email counts.' });
  }
};

module.exports = { getEmailReport, getEmailCountsByType };
