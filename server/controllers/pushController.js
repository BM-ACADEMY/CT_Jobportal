const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');
const webPush = require('../utils/webPush');

const MAX_DEVICES_PER_USER = 10;

// Shape check plus the push-service allowlist (utils/webPush.isAllowedEndpoint): the server will POST to
// this URL, so it must be a known push service, not any https address.
const validSubscription = (sub) =>
  !!sub && webPush.isAllowedEndpoint(sub.endpoint) &&
  !!sub.keys && typeof sub.keys.p256dh === 'string' && typeof sub.keys.auth === 'string' &&
  sub.keys.p256dh.length > 0 && sub.keys.auth.length > 0 && sub.keys.p256dh.length < 256 && sub.keys.auth.length < 128;

// @route GET /api/push/config  (public)  -> { enabled, publicKey, categories }
const getConfig = (req, res) => {
  res.json({ enabled: webPush.isPushEnabled(), publicKey: webPush.isPushEnabled() ? webPush.publicKey() : '', categories: webPush.CATEGORIES });
};

// @route POST /api/push/subscribe  Body: { subscription: PushSubscriptionJSON, standalone?: boolean }
const subscribe = async (req, res) => {
  try {
    if (!webPush.isPushEnabled()) return res.status(503).json({ msg: 'Push notifications are not switched on.' });
    const { subscription, standalone } = req.body || {};
    if (!validSubscription(subscription)) return res.status(400).json({ msg: 'Invalid push subscription: the endpoint must belong to a known browser push service.' });

    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    if (existing && String(existing.user) !== String(req.user.id)) {
      // Same browser, different account now signed in: the device follows the signed-in person.
      existing.user = req.user.id;
    }
    const doc = existing || new PushSubscription({ user: req.user.id, endpoint: subscription.endpoint });
    doc.keys = { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth };
    doc.userAgent = String(req.get('user-agent') || '').slice(0, 300);
    doc.standalone = !!standalone;
    doc.failures = 0;
    await doc.save();

    // Keep the oldest devices from piling up forever.
    const all = await PushSubscription.find({ user: req.user.id }).sort({ updatedAt: -1 }).select('_id');
    if (all.length > MAX_DEVICES_PER_USER) {
      await PushSubscription.deleteMany({ _id: { $in: all.slice(MAX_DEVICES_PER_USER).map(s => s._id) } });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Push subscribe error:', err.message);
    res.status(500).json({ msg: 'Could not save the push subscription.' });
  }
};

// @route DELETE /api/push/subscribe  Body: { endpoint }
const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ msg: 'endpoint is required.' });
    await PushSubscription.deleteOne({ endpoint, user: req.user.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Push unsubscribe error:', err.message);
    res.status(500).json({ msg: 'Could not remove the push subscription.' });
  }
};

// @route GET /api/push/prefs -> { mutedCategories, devices }
const getPrefs = async (req, res) => {
  try {
    const [user, devices] = await Promise.all([
      User.findById(req.user.id).select('pushPrefs').lean(),
      PushSubscription.countDocuments({ user: req.user.id })
    ]);
    res.json({ mutedCategories: user?.pushPrefs?.mutedCategories || [], devices, categories: webPush.CATEGORIES });
  } catch (err) {
    console.error('Push prefs error:', err.message);
    res.status(500).json({ msg: 'Could not load notification preferences.' });
  }
};

// @route PUT /api/push/prefs  Body: { mutedCategories: string[] }
const updatePrefs = async (req, res) => {
  try {
    const { mutedCategories } = req.body || {};
    if (!Array.isArray(mutedCategories) || mutedCategories.some(c => !webPush.CATEGORIES.includes(c))) {
      return res.status(400).json({ msg: 'Invalid category list.' });
    }
    const unique = [...new Set(mutedCategories)];
    await User.updateOne({ _id: req.user.id }, { $set: { 'pushPrefs.mutedCategories': unique, 'pushPrefs.updatedAt': new Date() } });
    res.json({ success: true, mutedCategories: unique });
  } catch (err) {
    console.error('Push prefs update error:', err.message);
    res.status(500).json({ msg: 'Could not save notification preferences.' });
  }
};

// @route POST /api/push/test  -> sends one push to the caller's own devices (ignores quiet hours and mutes)
const sendTest = async (req, res) => {
  try {
    if (!webPush.isPushEnabled()) return res.status(503).json({ msg: 'Push notifications are not switched on.' });
    const payload = webPush.buildPayload({
      title: 'Velaivaaipu notifications are on',
      message: 'You will hear from us here about applications, interviews and your account.',
      link: '/',
      type: 'push_test',
      category: 'general'
    });
    const delivered = await webPush.sendToUser(req.user.id, payload, { urgent: true });
    res.json({ success: true, delivered });
  } catch (err) {
    console.error('Push test error:', err.message);
    res.status(500).json({ msg: 'Could not send the test notification.' });
  }
};

module.exports = { getConfig, subscribe, unsubscribe, getPrefs, updatePrefs, sendTest };
