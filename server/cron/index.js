const cron = require('node-cron');
const sendUpcomingInterviewReminders = require('./interviewReminders');
const { runScheduledPlacementReports } = require('./reportScheduler');
const expireJobs = require('./expireJobs');

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

  console.log('[Cron] Scheduled jobs started: interview reminders (every 15m), placement reports (daily 07:00), job expiry (hourly)');
};

module.exports = { startCronJobs };
