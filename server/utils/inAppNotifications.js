const Notification = require('../models/Notification');
const User = require('../models/User');
const Role = require('../models/Role');

const emitNotification = (io, notification) => {
  if (io && notification?.recipient) {
    io.to(`user:${notification.recipient}`).emit('notification:new', notification);
  }
};

const notifyUsers = async ({ io, recipientIds, title, message, type = 'general', link = '', metadata = {} }) => {
  const ids = [...new Set((recipientIds || []).filter(Boolean).map(String))];
  if (!ids.length) return [];
  const notifications = await Notification.insertMany(ids.map(recipient => ({
    recipient, title, message, type, link, metadata
  })));
  notifications.forEach(notification => emitNotification(io, notification));
  return notifications;
};

const notifyUser = ({ io, recipientId, ...notification }) =>
  notifyUsers({ io, recipientIds: [recipientId], ...notification });

const notifyRoles = async ({ io, roles, ...notification }) => {
  const roleDocs = await Role.find({ name: { $in: roles } }).select('_id');
  const users = await User.find({ role: { $in: roleDocs.map(role => role._id) } }).select('_id');
  return notifyUsers({ io, recipientIds: users.map(user => user._id), ...notification });
};

module.exports = { notifyUser, notifyUsers, notifyRoles };
