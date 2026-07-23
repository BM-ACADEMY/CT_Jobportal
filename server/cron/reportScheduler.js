const College = require('../models/College');
const CollegePlacementReport = require('../models/CollegePlacementReport');
const { generatePlacementReportForCollege } = require('../controllers/collegeController');

const isProPlus = (tier) => tier === 'campus_pro' || tier === 'campus_elite';

// Weekly for Campus Pro/Elite, monthly for Lite, none for Free — mirrors the cadence promised
// on the Campus plan matrix. A college is "due" if its last auto/manual report is older than
// its cadence window, so this is safe to run more often than the cadence itself.
const runScheduledPlacementReports = async () => {
  try {
    const colleges = await College.find({ isActive: true, verificationStatus: 'verified', subscriptionTier: { $ne: 'campus_free' } });

    for (const college of colleges) {
      const frequency = isProPlus(college.subscriptionTier) ? 'weekly' : 'monthly';
      const windowDays = frequency === 'weekly' ? 7 : 28;
      const dueBefore = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

      const lastReport = await CollegePlacementReport.findOne({ college: college._id }).sort({ createdAt: -1 });
      if (lastReport && lastReport.createdAt > dueBefore) continue;

      try {
        await generatePlacementReportForCollege(college);
        console.log(`[Cron] Auto-generated ${frequency} placement report for ${college.name}`);
      } catch (err) {
        console.error(`[Cron] Failed to auto-generate report for ${college.name}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Cron] Scheduled placement report run failed:', err.message);
  }
};

module.exports = { runScheduledPlacementReports };
