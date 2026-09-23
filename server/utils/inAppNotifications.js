const Notification = require('../models/Notification');
const User = require('../models/User');
const Role = require('../models/Role');
const sendEmail = require('./sendEmail');
const { emailWrapper } = require('./emailTemplates');

const EMAIL_BATCH_SIZE = 10;

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const emitNotification = (io, notification) => {
  if (io && notification?.recipient) {
    io.to(`user:${notification.recipient}`).emit('notification:new', notification);
  }
};

// Every in-app notification is also mailed to the recipient so nobody has to be logged in to
// find out about an action that concerns them. Pass `email: false` where the caller already
// sends its own bespoke email, or `emailSubject` / `emailBody` to override the generated one.
const emailRecipients = async ({ recipientIds, title, message, link, emailSubject, emailBody }) => {
  const users = await User.find({ _id: { $in: recipientIds } }).select('name email');
  const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
  const recipients = users.filter(user => user.email);

  for (let i = 0; i < recipients.length; i += EMAIL_BATCH_SIZE) {
    await Promise.allSettled(recipients.slice(i, i + EMAIL_BATCH_SIZE).map(user => sendEmail({
      email: user.email,
      subject: emailSubject || title,
      html: emailWrapper(escapeHtml(title), `
        <p>Hi ${escapeHtml(user.name || 'there')},</p>
        ${emailBody || `<p>${escapeHtml(message)}</p>`}
        ${link && frontendUrl ? `<p><a href="${frontendUrl}${link}" style="color:#059669;">View on Velaivaaipu</a></p>` : ''}
      `)
    })));
  }
};

const notifyUsers = async ({ io, recipientIds, title, message, type = 'general', link = '', metadata = {}, email = true, emailSubject, emailBody }) => {
  const ids = [...new Set((recipientIds || []).filter(Boolean).map(String))];
  if (!ids.length) return [];
  const notifications = await Notification.insertMany(ids.map(recipient => ({
    recipient, title, message, type, link, metadata
  })));
  notifications.forEach(notification => emitNotification(io, notification));

  if (email) {
    emailRecipients({ recipientIds: ids, title, message, link, emailSubject, emailBody })
      .catch(err => console.error(`Notification email failed (${type}):`, err.message));
  }
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
