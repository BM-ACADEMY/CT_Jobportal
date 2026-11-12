// Every 10 minutes: if sign-ups, OTP requests or job reports in the last hour pass their level, tell the Super Admin once per hour.
// Levels: SPIKE_SIGNUPS_PER_HOUR (30), SPIKE_OTP_PER_HOUR (60), SPIKE_REPORTS_PER_HOUR (10). Off with SPIKE_ALERTS_ENABLED=false.
// It only reads counts and sends a notification; nothing is changed or blocked.
// OTP requests are counted from the codes issued in the last hour that are still stored on the account (a code is issued with a 10 minute expiry).
const { planSpikes, spikeMessage, enabled } = require('../utils/spikeAlerts');

const runSpikeAlerts = async ({ deps, env = process.env, now = new Date() } = {}) => {
  if (!enabled(env)) return { skipped: true };
  try {
    const d = deps || {
      User: require('../models/User'), JobReport: require('../models/JobReport'), AdminAlertLog: require('../models/AdminAlertLog'),
      notifyRoles: require('../utils/inAppNotifications').notifyRoles
    };
    const since = new Date(now.getTime() - 3600000);
    const otpTtl = 10 * 60000;
    const [signups, otp, reports] = await Promise.all([
      d.User.countDocuments({ createdAt: { $gte: since } }),
      d.User.countDocuments({ otpExpiry: { $gte: new Date(since.getTime() + otpTtl), $lte: new Date(now.getTime() + otpTtl) } }),
      d.JobReport.countDocuments({ createdAt: { $gte: since } })
    ]);
    const counts = { signups, otp, reports };
    const keys = ['signups', 'otp', 'reports'].map((k) => require('../utils/spikeAlerts').keyFor(k, now));
    const sent = new Set((await d.AdminAlertLog.find({ key: { $in: keys } }).select('key').lean()).map((r) => r.key));
    const spikes = planSpikes(counts, { env, now, sent });
    if (!spikes.length) return { spikes: 0 };
    // Claim the hour first, so two runs cannot both announce it.
    const claimed = [];
    for (const s of spikes) {
      try { await d.AdminAlertLog.create({ key: s.key }); claimed.push(s); }
      catch (e) { if (e.code !== 11000) throw e; }
    }
    if (!claimed.length) return { spikes: 0 };
    await d.notifyRoles({
      roles: ['admin'], title: `Unusual activity: ${claimed.map((s) => s.label).join(', ')}`,
      message: `${spikeMessage(claimed)}. Check the dashboard for bots or a campaign that is working.`, type: 'admin_spike_alert', link: '/admin/dashboard'
    });
    return { spikes: claimed.length };
  } catch (err) {
    console.error('[Spike alerts] run failed:', err.message);
    return { error: true };
  }
};

module.exports = runSpikeAlerts;
