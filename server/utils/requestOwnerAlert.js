// Tells whoever owns a new Needs-action "request" that it arrived. The owner is the person already assigned, or the person
// set for type "request" in the routing rules (the assignment is then saved, as the 15-minute job would have done).
// With no owner, the Super Admin is told instead. Never throws: a failed alert must not fail the person's request.
// Models and senders are required lazily, so this file loads without a database.
const LINK = '/admin/needs-action';

// Two call styles are supported:
//   alertRequestOwner(request, { io, title, message })  - for an existing request record (assignment is saved)
//   alertRequestOwner({ io, title, message, link, metadata }) - no record yet (college signup, pack and call requests):
//     tells the person set for "request" in the routing rules, or does nothing and returns false if no one is set.
const alertRequestOwner = async (request, opts) => {
  if (request && request._id === undefined && opts === undefined) return alertByRule(request);
  return alertForRequest(request, opts);
};

const alertByRule = async ({ io, title, message, link = '/admin/requests', metadata } = {}) => {
  try {
    const AdminRoutingRule = require('../models/AdminRoutingRule');
    const { notifyUser } = require('./inAppNotifications');
    const rule = await AdminRoutingRule.findOne({ kind: 'request' }).select('ownerId').lean();
    if (!rule?.ownerId) return false;
    await notifyUser({ io, recipientId: rule.ownerId, title, message, type: 'service_request', link, metadata });
    return true;
  } catch (err) {
    console.error('Request owner alert failed:', err.message);
    return false;
  }
};

const alertForRequest = async (request, { io, title, message, deps = {} } = {}) => {
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
