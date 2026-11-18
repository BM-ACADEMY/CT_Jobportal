// Words and once-only rule for the messages a job seeker gets around a counselling or mock-interview request.
//  - when the request comes in: "received, we will contact you within 24 hours"
//  - when the session is marked completed: one ask for a short review (feeds the home-page reviews after approval)

const SESSION_TYPES = ['counselling', 'mock_interview'];
const label = (type) => (type === 'mock_interview' ? 'mock interview' : type === 'student_pack' ? 'student pack' : 'career counselling');
const link = (type) => (type === 'mock_interview' ? '/candidate/mock-interviews' : type === 'student_pack' ? '/college/dashboard' : '/candidate/career-counselling');

const receivedMessage = (type, name) => type === 'student_pack' ? ({
  title: 'We received your student pack request',
  message: `Thanks${name ? `, ${name}` : ''}. Our team will contact you within 24 hours with payment details. The extra students are added once payment is confirmed.`,
  link: link(type)
}) : ({
  title: `We received your ${label(type)} request`,
  message: `Thanks${name ? `, ${name}` : ''}. Our team will contact you within 24 hours to confirm your ${label(type)} session. You can follow it on your dashboard.`,
  link: link(type)
});

const reviewAskMessage = (type) => ({
  title: 'How was your session?',
  message: `Your ${label(type)} session is marked complete. Two lines about how it went help other job seekers. With your review we may show it on our home page after we check it.`,
  link: '/write-review'
});

// Sends the review ask once per request. Returns true when it sent one.
// `save` persists the marker first so a second status change cannot send it twice.
const askForReviewOnce = async ({ request, notify, io }) => {
  if (!request || request.status !== 'completed' || !SESSION_TYPES.includes(request.type) || request.reviewAskedAt) return false;
  const userId = request.user?._id || request.user;
  if (!userId) return false;
  request.reviewAskedAt = new Date();
  await request.save();
  const m = reviewAskMessage(request.type);
  notify({ io, recipientId: userId, ...m, type: 'service_review_ask', metadata: { requestId: request._id } })
    .catch((err) => console.error('Review ask failed:', err.message));
  return true;
};

module.exports = { SESSION_TYPES, receivedMessage, reviewAskMessage, askForReviewOnce };
