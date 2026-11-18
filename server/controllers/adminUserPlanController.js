// Admin: change ONE person's plan benefits and validity (see utils/planEntitlements.js for how it works).
//   GET   /api/admin/users/:id/plan    what the person has now, what can be changed, and the change history
//   PATCH /api/admin/users/:id/plan    { changes: {resumeBuilderCount: 5}, expiry | extendDays, resetUsage: [...], note }
// Both are registered below the admin-only gate in routes/adminRoutes.js. Every change is saved with who made it, when and why
// (collection planadjustments), and the person gets an email and a bell message saying what changed.
const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Subscription = require('../models/Subscription');
const { notifyUser } = require('../utils/inAppNotifications');
const { FEATURE_FIELDS, USAGE_FIELDS, readFields, buildChanges, computeExpiry, checkUsageReset } = require('../utils/planEntitlements');

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const NOT_EDITABLE_ROLES = ['admin', 'subadmin'];
const escapeHtml = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'no end date');
const planLink = (role) => (role === 'jobseeker' ? '/candidate/subscription' : ['recruiter', 'company', 'org_employee'].includes(role) ? '/company/subscription' : '');

// The person's own copy of the plan. Someone who never bought anything is on the Free plan; their copy is made from it
// the first time they are edited. Returns { details, planName, hasOwnCopy } or { error }.
const loadDetails = async (user, roleName) => {
  if (user.subscriptionDetails && typeof user.subscriptionDetails === 'object') {
    return { details: user.subscriptionDetails, hasOwnCopy: true };
  }
  const free = await Subscription.findOne({ price: 0, isActive: true, role: roleName === 'org_employee' ? 'company' : roleName });
  if (!free) return { error: 'This person has no plan and there is no Free plan for their account type, so there is nothing to edit.' };
  const plain = free.toObject();
  delete plain.razorpayPlanId; delete plain.razorpayPlanMeta;
  return { details: plain, hasOwnCopy: false };
};

const actorLabel = async (id) => {
  const admin = await Admin.findById(id).select('email name');
  if (admin) return admin.email || admin.name;
  const user = await User.findById(id).select('email name');
  return user?.email || user?.name || String(id);
};

// @route GET /api/admin/users/:id/plan
const getUserPlan = async (req, res) => {
  try {
    const { id } = req.params;
    if (!OBJECT_ID.test(String(id || ''))) return res.status(400).json({ msg: 'Invalid account id.' });
    const user = await User.findById(id).populate('role', 'name');
    if (!user) return res.status(404).json({ msg: 'Account not found.' });
    const roleName = user.role?.name || 'jobseeker';
    if (NOT_EDITABLE_ROLES.includes(roleName)) return res.status(400).json({ msg: 'Admin and staff accounts do not have a plan.' });

    const loaded = await loadDetails(user, roleName);
    if (loaded.error) return res.status(400).json({ msg: loaded.error });
    const d = loaded.details;
    const history = await mongoose.connection.db.collection('planadjustments').find({ user: user._id }).sort({ at: -1 }).limit(10).toArray();

    res.json({
      user: { _id: user._id, name: user.name, email: user.email, role: roleName },
      plan: { name: d.name, price: d.price, duration: d.duration },
      hasOwnCopy: loaded.hasOwnCopy,
      expiry: user.subscriptionExpiry || null,
      fields: readFields(d),
      usage: USAGE_FIELDS.map((u) => ({ key: u.key, label: u.label, value: Number(user[u.key] || 0) })),
      history: history.map((h) => ({ at: h.at, by: h.by, note: h.note, changes: h.changes, expiry: h.expiry || null, reset: h.reset || [] })),
    });
  } catch (err) {
    console.error('Get user plan error:', err.message);
    res.status(500).json({ msg: 'Could not load this person\'s plan.' });
  }
};

// @route PATCH /api/admin/users/:id/plan
const updateUserPlan = async (req, res) => {
  try {
    const { id } = req.params;
    if (!OBJECT_ID.test(String(id || ''))) return res.status(400).json({ msg: 'Invalid account id.' });
    const body = req.body || {};
    const note = String(body.note || '').trim().slice(0, 300);
    if (note.length < 3) return res.status(400).json({ msg: 'Please write a short reason for the change. It is saved with your name.' });

    const user = await User.findById(id).populate('role', 'name');
    if (!user) return res.status(404).json({ msg: 'Account not found.' });
    const roleName = user.role?.name || 'jobseeker';
    if (NOT_EDITABLE_ROLES.includes(roleName)) return res.status(400).json({ msg: 'Admin and staff accounts do not have a plan.' });

    const loaded = await loadDetails(user, roleName);
    if (loaded.error) return res.status(400).json({ msg: loaded.error });

    const built = buildChanges(loaded.details, body.changes);
    if (built.errors.length) return res.status(400).json({ msg: built.errors.join(' '), errors: built.errors });
    const exp = computeExpiry({ currentExpiry: user.subscriptionExpiry, expiry: body.expiry, extendDays: body.extendDays });
    if (exp.error) return res.status(400).json({ msg: exp.error });
    const reset = checkUsageReset(body.resetUsage);
    if (reset.error) return res.status(400).json({ msg: reset.error });
    const resetKeys = reset.keys.filter((k) => Number(user[k] || 0) !== 0);

    if (!built.diff.length && !exp.changed && !resetKeys.length) return res.status(400).json({ msg: 'Nothing to change: the values are the same as now.' });

    const beforeExpiry = user.subscriptionExpiry || null;
    user.subscriptionDetails = built.next;
    user.markModified('subscriptionDetails');
    if (exp.changed) user.subscriptionExpiry = exp.expiry;
    resetKeys.forEach((k) => { user[k] = 0; });
    await user.save();

    const by = await actorLabel(req.user.id);
    const at = new Date();
    await mongoose.connection.db.collection('planadjustments').insertOne({
      user: user._id, email: user.email, plan: built.next.name, by, note, at,
      changes: built.diff.map(({ key, label, beforeText, afterText }) => ({ key, label, before: beforeText, after: afterText })),
      expiry: exp.changed ? { before: beforeExpiry, after: exp.expiry } : null,
      reset: resetKeys,
    });

    // Tell the person exactly what changed.
    const lines = [
      ...built.diff.map((c) => `<li><strong>${escapeHtml(c.label)}:</strong> ${escapeHtml(c.beforeText)} &rarr; ${escapeHtml(c.afterText)}</li>`),
      ...(exp.changed ? [`<li><strong>Valid until:</strong> ${escapeHtml(formatDate(beforeExpiry))} &rarr; ${escapeHtml(formatDate(exp.expiry))}</li>`] : []),
      ...resetKeys.map((k) => `<li><strong>${escapeHtml(USAGE_FIELDS.find((u) => u.key === k).label)}:</strong> reset to 0</li>`),
    ];
    notifyUser({
      io: req.io,
      recipientId: user._id,
      title: 'Your plan was updated',
      message: `The Velaivaaipu team updated your ${built.next.name} plan benefits.`,
      type: 'plan_adjusted',
      link: planLink(roleName),
      metadata: { userId: user._id },
      emailSubject: 'Your Velaivaaipu plan was updated',
      emailBody: `<p>The Velaivaaipu team updated your <strong>${escapeHtml(built.next.name)}</strong> plan. Here is what changed:</p><ul>${lines.join('')}</ul><p>Reason: ${escapeHtml(note)}</p><p>If anything looks wrong, reply to this email.</p>`,
    }).catch((e) => console.error('Plan adjustment notification failed:', e.message));

    res.json({
      success: true,
      msg: 'Saved. The person has been told by email.',
      changes: built.diff.map(({ key, label, beforeText, afterText }) => ({ key, label, before: beforeText, after: afterText })),
      expiry: exp.changed ? exp.expiry : beforeExpiry,
      reset: resetKeys,
    });
  } catch (err) {
    console.error('Update user plan error:', err.message);
    res.status(500).json({ msg: 'Could not save the change.' });
  }
};

module.exports = { getUserPlan, updateUserPlan, FEATURE_FIELDS };
