const cron = require('node-cron');
const sendUpcomingInterviewReminders = require('./interviewReminders');
const { runScheduledPlacementReports } = require('./reportScheduler');
const expireJobs = require('./expireJobs');
const runCourseFollowUps = require('./courseFollowUps');
const runLifecycleMails = require('./lifecycleMails');

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

  console.log('[Cron] Scheduled jobs started: interview reminders (every 15m), placement reports (daily 07:00), job expiry (hourly)');
};

module.exports = { startCronJobs };
