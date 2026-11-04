// Super Admin only (routes/adminRoutes.js, behind authorizeRoles('admin')): manage platform staff.
// A staff member is an existing job-seeker account turned into role `subadmin` with a staff role
// preset and a permission list. Removing them turns the account back into a job seeker.
const User = require('../models/User');
const Role = require('../models/Role');
const { STAFF_ROLES, STAFF_ROLE_KEYS, STAFF_PERMISSION_KEYS, STAFF_PERMISSIONS } = require('../config/staffPermissions');

const PUBLIC_FIELDS = 'name email display_id avatar staff createdAt lastLogoutAt';

const roleId = async (name) => {
  const role = await Role.findOne({ name }).select('_id');
  if (!role) throw new Error(`role ${name} not seeded`);
  return role._id;
};

const cleanPermissions = (permissions, fallback) => {
  if (permissions === undefined) return [...fallback];
  if (!Array.isArray(permissions) || permissions.some(p => !STAFF_PERMISSION_KEYS.includes(p))) return null;
  return [...new Set(permissions)];
};

const shape = (u) => ({
  _id: u._id, name: u.name, email: u.email, display_id: u.display_id, avatar: u.avatar,
  staffRole: u.staff?.role || null, permissions: u.staff?.permissions || [],
  grantedAt: u.staff?.grantedAt || null, createdAt: u.createdAt
});

// @route GET /api/admin/staff
const listStaff = async (req, res) => {
  try {
    const subadmin = await roleId('subadmin');
    const staff = await User.find({ role: subadmin, isDeleted: { $ne: true } }).select(PUBLIC_FIELDS).sort({ createdAt: -1 }).lean();
    res.json({ staff: staff.map(shape), roles: STAFF_ROLES, permissions: STAFF_PERMISSIONS });
  } catch (err) {
    console.error('List staff error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route POST /api/admin/staff  Body: { email, staffRole, permissions? }
const addStaff = async (req, res) => {
  try {
    const { email, staffRole, permissions } = req.body || {};
    if (!email || typeof email !== 'string') return res.status(400).json({ msg: 'Email is required.' });
    if (!STAFF_ROLE_KEYS.includes(staffRole)) return res.status(400).json({ msg: `staffRole must be one of ${STAFF_ROLE_KEYS.join(', ')}.` });
    const perms = cleanPermissions(permissions, STAFF_ROLES[staffRole].permissions);
    if (!perms) return res.status(400).json({ msg: 'Invalid permission list.' });

    const user = await User.findOne({ email: email.toLowerCase().trim(), isDeleted: { $ne: true } }).populate('role', 'name');
    if (!user) return res.status(404).json({ msg: 'No account with that email. The person must register as a job seeker first.' });
    const currentRole = user.role?.name;
    if (currentRole === 'subadmin') return res.status(400).json({ msg: 'This account is already staff. Edit their permissions instead.' });
    if (currentRole !== 'jobseeker') {
      return res.status(400).json({ msg: `Only a job seeker account can become staff (this one is ${currentRole}). Ask the person to register a separate account.` });
    }

    user.role = await roleId('subadmin');
    user.staff = { role: staffRole, permissions: perms, grantedBy: req.user.id, grantedAt: new Date() };
    await user.save();
    res.status(201).json({ msg: `${user.name || user.email} is now ${STAFF_ROLES[staffRole].label}. They must sign out and in again.`, staff: shape(user) });
  } catch (err) {
    console.error('Add staff error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route PUT /api/admin/staff/:id  Body: { staffRole?, permissions? }
const updateStaff = async (req, res) => {
  try {
    const { staffRole, permissions } = req.body || {};
    const user = await User.findById(req.params.id).populate('role', 'name');
    if (!user || user.role?.name !== 'subadmin') return res.status(404).json({ msg: 'Staff member not found.' });
    if (staffRole !== undefined && !STAFF_ROLE_KEYS.includes(staffRole)) return res.status(400).json({ msg: 'Unknown staff role.' });

    const nextRole = staffRole || user.staff?.role || 'support';
    // Changing the preset without an explicit list resets to that preset's permissions.
    const fallback = staffRole && staffRole !== user.staff?.role ? STAFF_ROLES[staffRole].permissions : (user.staff?.permissions || []);
    const perms = cleanPermissions(permissions, fallback);
    if (!perms) return res.status(400).json({ msg: 'Invalid permission list.' });

    user.staff = { ...(user.staff?.toObject ? user.staff.toObject() : user.staff), role: nextRole, permissions: perms };
    await user.save();
    res.json({ msg: 'Permissions updated. They apply on the next request.', staff: shape(user) });
  } catch (err) {
    console.error('Update staff error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @route DELETE /api/admin/staff/:id  -> back to a job seeker account
const removeStaff = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('role', 'name');
    if (!user || user.role?.name !== 'subadmin') return res.status(404).json({ msg: 'Staff member not found.' });
    user.role = await roleId('jobseeker');
    user.staff = { role: null, permissions: [], grantedBy: null, grantedAt: null };
    await user.save();
    res.json({ msg: `${user.name || user.email} is no longer staff. Their account is a job seeker account again.` });
  } catch (err) {
    console.error('Remove staff error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { listStaff, addStaff, updateStaff, removeStaff };
