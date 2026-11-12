const cron = require('node-cron');
const sendUpcomingInterviewReminders = require('./interviewReminders');
const { runScheduledPlacementReports } = require('./reportScheduler');
const expireJobs = require('./expireJobs');
const runCourseFollowUps = require('./courseFollowUps');
const runLifecycleMails = require('./lifecycleMails');
const runDriveReminders = require('./driveReminders');
const runWeeklyAdvisor = require('./advisorWeekly');
const runSpikeAlerts = require('./spikeAlerts');
const { runFreeCollegeSummaries } = require('./freeCollegeSummary');
const { runAutoAssignAndReminders, runDailyDigest, runPaymentAlerts, runCollegeRoleReminders, runCollegeLimitNudges } = require('./adminFollowUp');

// Called once after the Mongo connection is established (see server/index.js).
const startCronJobs = () => {
  // Every 15 minutes — reminds candidates/recruiters of interviews starting within the hour.
  cron.schedule('*/15 * * * *', sendUpcomingInterviewReminders);

  // Once a day at 07:00 server time — checks which colleges are due for their weekly/monthly
  // placement report and emails it to the principal.
  cron.schedule('0 7 * * *', runScheduledPlacementReports);

  // Remove expired vacancies from all active-job queries within one hour.
  cron.schedule('0 * * * *', expireJobs);
  expireJobs();

  // Course follow-up to opted-in students who scored below the pass mark (off unless WHATSAPP_FOLLOWUP_ENABLED=true).
  cron.schedule('*/10 * * * *', runCourseFollowUps);

  // Lifecycle mails (profile nudges, job alerts, employer tips, college batch report) once a day at 10:00 India time.
  // Off unless LIFECYCLE_EMAILS_ENABLED=true.
  cron.schedule('0 10 * * *', runLifecycleMails, { timezone: 'Asia/Kolkata' });

  // Admin follow-up (off with ADMIN_FOLLOWUP_ENABLED=false): auto-assign, 24h reminders, 48h escalation, daily summary, failed-payment alert.
  cron.schedule('*/15 * * * *', runAutoAssignAndReminders);
  cron.schedule('0 9 * * *', runDailyDigest, { timezone: 'Asia/Kolkata' });
  cron.schedule('*/30 * * * *', runPaymentAlerts);
  cron.schedule('0 10 * * *', runCollegeRoleReminders, { timezone: 'Asia/Kolkata' });
  cron.schedule('30 10 * * *', runCollegeLimitNudges, { timezone: 'Asia/Kolkata' });
  // Free colleges: one short summary a month (off with FREE_COLLEGE_SUMMARY=off).
  cron.schedule('45 10 * * *', () => runFreeCollegeSummaries(), { timezone: 'Asia/Kolkata' });

  // Walk-in drive reminders: day before (18:00) and morning of (07:00) India time. Off unless DRIVE_REMINDERS_ENABLED=true.
  cron.schedule('0 18 * * *', () => runDriveReminders('day_before'), { timezone: 'Asia/Kolkata' });
  cron.schedule('0 7 * * *', () => runDriveReminders('morning'), { timezone: 'Asia/Kolkata' });

  // Spike alerts to the Super Admin (sign-ups, OTP requests, job reports per hour). On unless SPIKE_ALERTS_ENABLED=false.
  cron.schedule('*/10 * * * *', () => runSpikeAlerts());

  // Business advisor weekly note, Monday 08:00 India time. Off unless ADVISOR_ENABLED=true.
  cron.schedule('0 8 * * 1', () => runWeeklyAdvisor(), { timezone: 'Asia/Kolkata' });

  console.log('[Cron] Scheduled jobs started: interview reminders (every 15m), placement reports (daily 07:00), job expiry (hourly)');
};

module.exports = { startCronJobs };
