const Job = require('../models/Job');

const expireJobs = async () => {
  try {
    const result = await Job.updateMany(
      { status: 'active', validThrough: { $lte: new Date() } },
      { $set: { status: 'closed' } }
    );
    if (result.modifiedCount) console.log(`[Cron] Closed ${result.modifiedCount} expired job(s)`);
  } catch (error) {
    console.error('[Cron] Job expiry failed:', error.message);
  }
};

module.exports = expireJobs;
