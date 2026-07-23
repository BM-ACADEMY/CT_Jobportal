const Interview = require('../models/Interview');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');

// Emails both the candidate and recruiter for any scheduled interview starting within the
// next hour that hasn't been reminded about yet. Meant to run every ~15 minutes via cron.
module.exports = async function sendUpcomingInterviewReminders() {
  try {
    const now = new Date();
    const soon = new Date(now.getTime() + 60 * 60 * 1000);

    const dueInterviews = await Interview.find({
      status: 'scheduled',
      reminderSent: false,
      scheduledAt: { $gte: now, $lte: soon }
    })
      .populate('candidate', 'name email')
      .populate('recruiter', 'name email')
      .populate('job', 'title');

    for (const interview of dueInterviews) {
      const when = new Date(interview.scheduledAt).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
      const recipients = [interview.candidate, interview.recruiter].filter(u => u?.email);

      for (const recipient of recipients) {
        sendEmail({
          email: recipient.email,
          subject: `Reminder: Interview for ${interview.job?.title || 'a role'} starts soon`,
          html: emailWrapper('Interview Reminder', `
            <p>Hi ${recipient.name || 'there'},</p>
            <p>This is a reminder that the interview for <strong>${interview.job?.title || 'the role'}</strong> is scheduled at <strong>${when}</strong>.</p>
            ${interview.meetingLink ? `<p><a href="${interview.meetingLink}" style="color:#059669;">Join meeting</a></p>` : ''}
          `)
        }).catch(() => {});
      }

      interview.reminderSent = true;
      await interview.save();
    }

    if (dueInterviews.length > 0) {
      console.log(`[Cron] Sent interview reminders for ${dueInterviews.length} upcoming interview(s)`);
    }
  } catch (err) {
    console.error('[Cron] Interview reminder run failed:', err.message);
  }
};
