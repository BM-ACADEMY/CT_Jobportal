const Application = require('../models/Application');
const { notifyUsers } = require('./inAppNotifications');

// Applications that are still waiting on a decision; candidates who already got a final answer
// (rejected / offer / withdrawn) do not need to hear that the posting went away.
const OPEN_APPLICATION_STATUSES = ['pending', 'reviewed', 'shortlisted'];

// Tells the job's poster (unless they performed the action themselves) and every candidate with an
// open application that the posting was closed or removed.
// `job` needs { _id, title, recruiter, company }; call this before deleting so applications still exist.
const notifyJobClosedOrRemoved = async ({ io, job, actorId, action }) => {
  const applications = await Application.find({ job: job._id, status: { $in: OPEN_APPLICATION_STATUSES } }).select('applicant');
  const verb = action === 'closed' ? 'closed' : 'removed';

  const sends = [
    notifyUsers({
      io,
      recipientIds: applications.map(application => application.applicant),
      title: `Job ${verb}`,
      message: `“${job.title}”, which you applied for, has been ${verb} by the employer and is no longer accepting applications.`,
      type: 'job_closed',
      link: '/candidate/applications',
      metadata: { jobId: job._id }
    })
  ];

  if (job.recruiter && String(job.recruiter) !== String(actorId)) {
    sends.push(notifyUsers({
      io,
      recipientIds: [job.recruiter],
      title: `Your job was ${verb}`,
      message: `Your job posting “${job.title}” has been ${verb}.`,
      type: 'job_closed',
      link: '/company/jobs',
      metadata: { jobId: job._id }
    }));
  }

  await Promise.allSettled(sends);
};

// Confirms to the poster that their posting is live.
const notifyJobPublished = ({ io, job, recipientId }) => notifyUsers({
  io,
  recipientIds: [recipientId],
  title: 'Job posted',
  message: `Your job “${job.title}” has been posted and is now live for candidates to apply.`,
  type: 'job_published',
  link: '/company/jobs',
  metadata: { jobId: job._id }
});

module.exports = { notifyJobClosedOrRemoved, notifyJobPublished };
