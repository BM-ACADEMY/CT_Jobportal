const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');

// Adding another full admin without a server script. The new admin gets a one-time link by email and sets their own
// password; nobody ever sees or sends a password. Login still uses the 2-step email code (switched on at creation).
// Every route here except setPassword sits below the admin gate in routes/adminRoutes.js.
const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
const HEX24 = /^[a-f0-9]{24}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');
const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const baseUrl = () => String(process.env.FRONTEND_URL || 'https://velaivaaipu.in').split(',')[0].trim().replace(/\/$/, '');

const shape = (a) => ({
  _id: a._id, admin_id: a.admin_id, name: a.name, email: a.email, createdAt: a.createdAt, createdBy: a.createdBy || '',
  lastLogin: a.lastLogin || null,
  level: a.level === 'limited' ? 'limited' : 'owner',
  status: a.invite && a.invite.tokenHash ? 'Invite pending' : 'Active',
  inviteExpiresAt: a.invite && a.invite.tokenHash ? a.invite.expiresAt : null,
});

const mailInvite = async (admin, token, invitedBy) => {
  const link = `${baseUrl()}/admin/set-password?id=${admin._id}&token=${token}`;
  const html = emailWrapper('You have been added as an admin', `
    <p>Hi ${esc(admin.name)},</p>
    <p>${esc(invitedBy || 'A Super Admin')} added you as an admin on Velaivaaipu. Choose your password with the button below. The link works once and expires in 24 hours.</p>
    <p style="margin:20px 0;"><a href="${link}" style="background:#10b981;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">Set my password</a></p>
    <p style="font-size:12px;color:#64748b;">Sign in later at ${esc(baseUrl())}/admin/login. A code will be mailed to this address each time you sign in. If you did not expect this, ignore this email.</p>`);
  return sendEmail({ email: admin.email, subject: 'Set your Velaivaaipu admin password', html });
};

const newInvite = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, invite: { tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITE_TTL_MS) } };
};

// GET /api/admin/admins
const listAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}).select('admin_id name email createdAt createdBy lastLogin invite level').sort({ createdAt: 1 }).lean();
    res.json({ admins: admins.map(shape), me: String(req.user.id) });
  } catch (e) { console.error('List admins:', e.message); res.status(500).json({ msg: 'Could not load admins.' }); }
};

// POST /api/admin/admins  Body: { name, email }
const inviteAdmin = async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!name || name.length > 80) return res.status(400).json({ msg: 'Enter the admin\'s name.' });
    if (!EMAIL.test(email)) return res.status(400).json({ msg: 'Enter a valid email address.' });
    if (await Admin.findOne({ email })) return res.status(400).json({ msg: 'An admin with this email already exists.' });

    const me = HEX24.test(String(req.user.id)) ? await Admin.findById(req.user.id).select('name admin_id') : null;
    const { token, invite } = newInvite();
    // The password is random and never shown: the person replaces it through the link.
    const password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const admin = await Admin.create({
      name, email, password, role: 'admin', level: req.body.level === 'owner' ? 'owner' : 'limited', invite, createdBy: me ? me.admin_id : '',
      twoFactorAuth: { enabled: true },
    });
    const sent = await mailInvite(admin, token, me && me.name);
    if (!sent) return res.status(201).json({ admin: shape(admin), mailed: false, msg: 'Admin added, but the invite mail could not be sent. Use "Resend invite" once mail is working.' });
    res.status(201).json({ admin: shape(admin), mailed: true, msg: `Invite sent to ${email}.` });
  } catch (e) { console.error('Invite admin:', e.message); res.status(500).json({ msg: 'Could not add the admin.' }); }
};

// POST /api/admin/admins/:id/resend-invite  (only while the admin has not set a password yet)
const resendInvite = async (req, res) => {
  try {
    if (!HEX24.test(String(req.params.id))) return res.status(400).json({ msg: 'Not a valid admin.' });
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ msg: 'Admin not found.' });
    if (!(admin.invite && admin.invite.tokenHash)) return res.status(400).json({ msg: 'This admin has already set a password.' });
    const { token, invite } = newInvite();
    admin.invite = invite;
    await admin.save();
    const sent = await mailInvite(admin, token);
    res.json({ mailed: !!sent, msg: sent ? `Invite sent again to ${admin.email}.` : 'The invite mail could not be sent. Try again once mail is working.' });
  } catch (e) { console.error('Resend invite:', e.message); res.status(500).json({ msg: 'Could not resend.' }); }
};

// DELETE /api/admin/admins/:id : never yourself, never the last admin.
const removeAdmin = async (req, res) => {
  try {
    if (!HEX24.test(String(req.params.id))) return res.status(400).json({ msg: 'Not a valid admin.' });
    if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ msg: 'You cannot remove your own admin login.' });
    const admin = await Admin.findById(req.params.id).select('_id email');
    if (!admin) return res.status(404).json({ msg: 'Admin not found.' });
    if ((await Admin.countDocuments({})) <= 1) return res.status(400).json({ msg: 'You cannot remove the last admin.' });
    await Admin.deleteOne({ _id: admin._id });
    res.json({ msg: `${admin.email} is no longer an admin.` });
  } catch (e) { console.error('Remove admin:', e.message); res.status(500).json({ msg: 'Could not remove the admin.' }); }
};

// POST /api/admin/set-password (public, rate limited)  Body: { id, token, password }
const setPassword = async (req, res) => {
  const bad = () => res.status(400).json({ msg: 'This link is not valid or has expired. Ask the Super Admin to send a new invite.' });
  try {
    const { id, token, password } = req.body || {};
    if (!HEX24.test(String(id)) || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return bad();
    if (typeof password !== 'string' || password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ msg: 'Use at least 10 characters with letters and numbers.' });
    }
    const admin = await Admin.findById(id);
    const stored = admin && admin.invite && admin.invite.tokenHash;
    if (!stored || !admin.invite.expiresAt || new Date(admin.invite.expiresAt) < new Date()) return bad();
    const a = Buffer.from(hashToken(token), 'hex');
    const b = Buffer.from(stored, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return bad();
    admin.password = await bcrypt.hash(password, 10);
    admin.invite = undefined;
    await admin.save();
    res.json({ msg: 'Password set. You can sign in now.' });
  } catch (e) { console.error('Set admin password:', e.message); res.status(500).json({ msg: 'Could not set the password.' }); }
};

module.exports = { listAdmins, inviteAdmin, resendInvite, removeAdmin, setPassword };
