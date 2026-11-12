// Tells whoever owns a new Needs-action "request" that it arrived. The owner is the person already assigned, or the person
// set for type "request" in the routing rules (the assignment is then saved, as the 15-minute job would have done).
// With no owner, the Super Admin is told instead. Never throws: a failed alert must not fail the person's request.
// Models and senders are required lazily, so this file loads without a database.
const LINK = '/admin/needs-action';

const alertRequestOwner = async (request, { io, title, message, deps = {} } = {}) => {
  try {
    const AdminAssignment = deps.AdminAssignment || require('../models/AdminAssignment');
    const AdminRoutingRule = deps.AdminRoutingRule || require('../models/AdminRoutingRule');
    const { notifyUser, notifyRoles } = deps.notify || require('./inAppNotifications');
    const heading = title || 'New request waiting';
    const body = message || 'A new request needs your attention.';

    let owner = await AdminAssignment.findOne({ kind: 'request', refId: request._id }).lean();
    if (!owner) {
      const rule = await AdminRoutingRule.findOne({ kind: 'request' }).lean();
      if (rule) {
        await AdminAssignment.updateOne(
          { kind: 'request', refId: request._id },
          { $setOnInsert: { ownerId: rule.ownerId, ownerName: rule.ownerName, assignedBy: 'auto' } },
          { upsert: true }
        ).catch(() => {});
        owner = rule;
      }
    }
    if (owner && owner.ownerId) {
      await notifyUser({ io, recipientId: owner.ownerId, title: heading, message: body, type: 'admin_request', link: LINK });
      return { alerted: 'owner', ownerId: String(owner.ownerId) };
    }
    await notifyRoles({ io, roles: ['admin'], title: heading, message: body, type: 'admin_request', link: LINK });
    return { alerted: 'admin' };
  } catch (err) {
    console.error('[Request alert] failed:', err.message);
    return { alerted: null };
  }
};

module.exports = { alertRequestOwner };
