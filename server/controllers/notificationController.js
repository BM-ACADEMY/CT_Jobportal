const Notification = require('../models/Notification');

const listNotifications = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 }).limit(limit),
      Notification.countDocuments({ recipient: req.user.id, isRead: false })
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to load notifications', error: err.message });
  }
};

const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ msg: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update notification', error: err.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update notifications', error: err.message });
  }
};

module.exports = { listNotifications, markRead, markAllRead };
