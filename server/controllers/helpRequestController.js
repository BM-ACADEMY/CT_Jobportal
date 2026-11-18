// POST /api/help-requests : any signed-in person asks for help; it lands in Admin > Needs action as a request.
// Models are required lazily so this file loads in tests without a database.
const { cleanHelpInput, MAX_PER_HOUR } = require('../utils/helpRequest');
const { alertRequestOwner } = require('../utils/requestOwnerAlert');

const createHelpRequest = async (req, res, deps = {}) => {
  try {
    const clean = cleanHelpInput(req.body);
    if (clean.error) return res.status(400).json({ msg: clean.error });
    const AdminRequest = deps.AdminRequest || require('../models/AdminRequest');
    const User = deps.User || require('../models/User');

    const user = await User.findById(req.user.id).select('name email phone').lean();
    if (!user) return res.status(403).json({ msg: 'Please sign in with your account to ask for help.' });

    const recent = await AdminRequest.countDocuments({ user: user._id, type: 'help_request', createdAt: { $gte: new Date(Date.now() - 3600000) } });
    if (recent >= MAX_PER_HOUR) return res.status(429).json({ msg: 'You have sent several help requests. We will get back to you soon.' });

    const request = await AdminRequest.create({
      user: user._id, type: 'help_request', bookingName: user.name || '', bookingEmail: user.email || '', bookingPhone: user.phone || '',
      notes: clean.message, pageUrl: clean.pageUrl
    });
    await (deps.alert || alertRequestOwner)(request, {
      io: req.io, title: 'Help request', message: `${user.name || 'A user'} asked for help${clean.pageUrl ? ` on ${clean.pageUrl}` : ''}: ${clean.message.slice(0, 120)}`, deps: deps.alertDeps
    });
    res.status(201).json({ msg: 'Thank you. Our team will get back to you.', id: request._id });
  } catch (err) {
    console.error('Help request failed:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { createHelpRequest };
