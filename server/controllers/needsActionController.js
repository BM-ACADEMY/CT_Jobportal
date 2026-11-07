const User = require('../models/User');
const Role = require('../models/Role');
const College = require('../models/College');
const Ticket = require('../models/Ticket');
const ContactMessage = require('../models/ContactMessage');
const Review = require('../models/Review');
const AdminRequest = require('../models/AdminRequest');
const Job = require('../models/Job');
const AdminAssignment = require('../models/AdminAssignment');
const { buildNeedsAction } = require('../utils/needsAction');

const KINDS = ['college', 'ticket', 'message', 'review', 'request', 'job'];
const HEX = /^[0-9a-fA-F]{24}$/;
const PER_SOURCE = 100;

const load = (query) => query.sort({ createdAt: 1 }).limit(PER_SOURCE).lean().catch(() => []);

// @route GET /api/admin/needs-action
// Everything waiting for an admin in one list, with its owner and how long it has waited. Super admin only.
const getNeedsAction = async (req, res) => {
  try {
    const groups = {
      colleges: await load(College.find({ verificationStatus: 'pending', isTest: { $ne: true } }).select('name code collegeEmail collegePhone createdAt')),
      tickets: await load(Ticket.find({ status: { $in: ['open', 'in_progress'] } }).select('category accountIdentity createdAt')),
      messages: await load(ContactMessage.find({ status: 'new' }).select('name email subject createdAt')),
      reviews: await load(Review.find({ status: 'pending' }).select('rating comment createdAt')),
      requests: await load(AdminRequest.find({ status: 'pending' }).select('type bookingName bookingEmail createdAt')),
      jobs: await load(Job.find({ 'scamFlags.0': { $exists: true }, scamReviewed: { $ne: true }, status: { $ne: 'closed' } }).select('title scamFlags createdAt'))
    };
    const assignments = await AdminAssignment.find({}).lean();
    const result = buildNeedsAction(groups, assignments, new Date());

    let owners = [];
    try {
      const subadmin = await Role.findOne({ name: 'subadmin' }).select('_id');
      const staff = subadmin ? await User.find({ role: subadmin._id, isDeleted: { $ne: true } }).select('name').lean() : [];
      owners = staff.map((s) => ({ id: String(s._id), name: s.name }));
    } catch (e) {
      console.error('Needs-action owners failed:', e.message);
    }
    owners.unshift({ id: String(req.user.id), name: 'Me' });
    res.json({ ...result, owners });
  } catch (err) {
    console.error('Needs-action error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route PUT /api/admin/needs-action/assign   Body: { kind, id, ownerId, ownerName }  (ownerId null removes the owner)
const assignItem = async (req, res) => {
  try {
    const { kind, id, ownerId, ownerName } = req.body || {};
    if (!KINDS.includes(kind)) return res.status(400).json({ msg: 'Unknown item type' });
    if (!HEX.test(String(id))) return res.status(400).json({ msg: 'Invalid item id' });
    if (ownerId === null || ownerId === undefined || ownerId === '') {
      await AdminAssignment.deleteOne({ kind, refId: id });
      return res.json({ msg: 'Owner removed' });
    }
    if (!HEX.test(String(ownerId))) return res.status(400).json({ msg: 'Invalid owner' });
    const name = String(ownerName || '').trim().slice(0, 80);
    if (!name) return res.status(400).json({ msg: 'Owner name is required' });
    const doc = await AdminAssignment.findOneAndUpdate(
      { kind, refId: id },
      { $set: { ownerId: String(ownerId), ownerName: name, assignedBy: String(req.user.id) } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ msg: 'Owner saved', assignment: { kind: doc.kind, id: String(doc.refId), owner: { id: doc.ownerId, name: doc.ownerName } } });
  } catch (err) {
    console.error('Assign error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getNeedsAction, assignItem };
