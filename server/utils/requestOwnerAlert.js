// Tell the person who owns Requests (set in Admin > Needs action > Auto-assign) the moment a college asks for something,
// so the 24-hour promise has a named person straight away. Never throws: signup and requests must not fail because of it.
const AdminRoutingRule = require('../models/AdminRoutingRule');
const { notifyUser } = require('./inAppNotifications');

const alertRequestOwner = async ({ io, title, message, link = '/admin/requests', metadata }) => {
  try {
    const rule = await AdminRoutingRule.findOne({ kind: 'request' }).select('ownerId').lean();
    if (!rule?.ownerId) return false;
    await notifyUser({ io, recipientId: rule.ownerId, title, message, type: 'service_request', link, metadata });
    return true;
  } catch (err) {
    console.error('Request owner alert failed:', err.message);
    return false;
  }
};

module.exports = { alertRequestOwner };
