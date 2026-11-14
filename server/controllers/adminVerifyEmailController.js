const User = require('../models/User');
const { notifyUser } = require('../utils/inAppNotifications');

// Admin-only. Marks a person's email as verified when their verification code never reached them (for example during a
// mail outage), so they can simply log in. It records who did it, when and why. It never touches admin accounts, accounts
// without a real email, or blocked accounts' block status.
const verifyUserEmail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!/^[0-9a-fA-F]{24}$/.test(String(id))) return res.status(400).json({ msg: 'Invalid user id' });

    const user = await User.findById(id).populate('role', 'name');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (user.role?.name === 'admin') return res.status(400).json({ msg: 'Admin accounts cannot be verified this way' });
    if (/\.portal\s*$/i.test(user.email) || /@deleted\.invalid$/i.test(user.email)) {
      return res.status(400).json({ msg: 'This account has no real email address' });
    }
    if (user.isVerified) return res.json({ msg: 'Email was already verified', alreadyVerified: true, isVerified: true });

    const note = String(req.body?.note || '').trim().slice(0, 200);
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    user.emailVerifiedByAdmin = { by: req.user && (req.user.id || req.user._id), at: new Date(), note: note || 'Verification code did not arrive' };
    await user.save();

    notifyUser({
      io: req.io,
      recipientId: user._id,
      title: 'Your email is verified',
      message: 'Sorry for the trouble with your code. Your account is ready, so you can log in now.',
      type: 'account_status',
      metadata: { emailVerifiedByAdmin: true }
    }).catch(err => console.error('Email-verified notification failed:', err.message));

    res.json({ msg: 'Email marked as verified', isVerified: true });
  } catch (err) {
    console.error('Admin verify email error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { verifyUserEmail };
