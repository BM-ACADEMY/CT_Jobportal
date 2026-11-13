const User = require('../models/User');
const { optInNumber, inviteLink } = require('../utils/referral');

// PUT /api/user/whatsapp-optin {enabled, number?}
// Records consent only. Nothing is sent until a WhatsApp Business account is connected.
const setWhatsAppOptIn = async (req, res) => {
  try {
    if (typeof req.body?.enabled !== 'boolean') return res.status(400).json({ msg: 'Send enabled as true or false' });
    const user = await User.findById(req.user.id).select('whatsapp profile.phone');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.whatsapp = user.whatsapp || {};
    if (req.body.enabled) {
      const r = optInNumber(req.body.number, user.profile?.phone);
      if (r.error) return res.status(400).json({ msg: r.error });
      user.whatsapp.optIn = true; user.whatsapp.number = r.number; user.whatsapp.optInAt = new Date();
    } else { user.whatsapp.optIn = false; user.whatsapp.optOutAt = new Date(); }
    await user.save();
    res.json({ optIn: user.whatsapp.optIn, number: user.whatsapp.number });
  } catch (err) { console.error('WhatsApp opt-in:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

// GET /api/user/referrals : my invite link and how many invited friends have joined (verified accounts only).
const getReferrals = async (req, res) => {
  try {
    const [joined, me] = await Promise.all([User.countDocuments({ referredBy: req.user.id, isVerified: true }), User.findById(req.user.id).select('whatsapp')]);
    res.json({ link: inviteLink(req.user.id, process.env.FRONTEND_URL), joined, whatsapp: { optIn: !!me?.whatsapp?.optIn, number: me?.whatsapp?.number || '' } });
  } catch (err) { console.error('Referrals:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

module.exports = { setWhatsAppOptIn, getReferrals };
