const College = require('../models/College');
const Ticket = require('../models/Ticket');
const ContactMessage = require('../models/ContactMessage');
const Review = require('../models/Review');
const AdminRequest = require('../models/AdminRequest');
const Job = require('../models/Job');
const Feedback = require('../models/Feedback');
const AdminAssignment = require('../models/AdminAssignment');
const { buildNeedsAction } = require('./needsAction');

const PER_SOURCE = 100;
const load = (query) => query.sort({ createdAt: 1 }).limit(PER_SOURCE).lean().catch(() => []);

// Everything waiting for an admin, as one list (see utils/needsAction.js). Used by the admin page and the follow-up jobs.
const loadNeedsAction = async (now = new Date()) => {
  const groups = {
    colleges: await load(College.find({ verificationStatus: 'pending', isTest: { $ne: true } }).select('name code collegeEmail collegePhone createdAt')),
    tickets: await load(Ticket.find({ status: { $in: ['open', 'in_progress'] } }).select('category accountIdentity createdAt')),
    messages: await load(ContactMessage.find({ status: 'new' }).select('name email subject createdAt')),
    reviews: await load(Review.find({ status: 'pending' }).select('rating comment createdAt')),
    requests: await load(AdminRequest.find({ status: 'pending' }).select('type bookingName bookingEmail createdAt')),
    feedback: await load(Feedback.find({ status: 'new' }).select('rating text role createdAt')),
    jobs: await load(Job.find({ 'scamFlags.0': { $exists: true }, scamReviewed: { $ne: true }, status: { $ne: 'closed' } }).select('title scamFlags createdAt'))
  };
  const assignments = await AdminAssignment.find({}).lean();
  return buildNeedsAction(groups, assignments, now);
};

module.exports = { loadNeedsAction };
