const User = require('../models/User');
const Role = require('../models/Role');
const AdminAssignment = require('../models/AdminAssignment');
const AdminRoutingRule = require('../models/AdminRoutingRule');
const { loadNeedsAction } = require('../utils/needsActionLoader');

const KINDS = ['college', 'ticket', 'message', 'review', 'request', 'feedback', 'drive', 'idea', 'job'];
const HEX = /^[0-9a-fA-F]{24}$/;
// @route GET /api/admin/needs-action
// Everything waiting for an admin in one list, with its owner and how long it has waited. Super admin only.
const getNeedsAction = async (req, res) => {
  try {
    const result = await loadNeedsAction(new Date());
    const rules = (await AdminRoutingRule.find({}).lean().catch(() => [])).map((r) => ({ kind: r.kind, ownerId: r.ownerId, ownerName: r.ownerName }));

    let owners = [];
    try {
      const subadmin = await Role.findOne({ name: 'subadmin' }).select('_id');
      const staff = subadmin ? await User.find({ role: subadmin._id, isDeleted: { $ne: true } }).select('name').lean() : [];
      owners = staff.map((s) => ({ id: String(s._id), name: s.name }));
    } catch (e) {
      console.error('Needs-action owners failed:', e.message);
    }
    owners.unshift({ id: String(req.user.id), name: 'Me' });
    res.json({ ...result, owners, rules });
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

// @route PUT /api/admin/needs-action/rules   Body: { kind, ownerId, ownerName }  (ownerId null removes the rule)
const setRule = async (req, res) => {
  try {
    const { kind, ownerId, ownerName } = req.body || {};
    if (!KINDS.includes(kind)) return res.status(400).json({ msg: 'Unknown item type' });
    if (ownerId === null || ownerId === undefined || ownerId === '') {
      await AdminRoutingRule.deleteOne({ kind });
      return res.json({ msg: 'Rule removed' });
    }
    if (!HEX.test(String(ownerId))) return res.status(400).json({ msg: 'Invalid owner' });
    const name = String(ownerName || '').trim().slice(0, 80);
    if (!name) return res.status(400).json({ msg: 'Owner name is required' });
    await AdminRoutingRule.findOneAndUpdate({ kind }, { $set: { ownerId: String(ownerId), ownerName: name } }, { upsert: true, setDefaultsOnInsert: true });
    res.json({ msg: 'Rule saved' });
  } catch (err) {
    console.error('Routing rule error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { getNeedsAction, assignItem, setRule };
