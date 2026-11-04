// Admin-or-staff gate. `admin` (the Super Admin) always passes, as before. A staff member (role
// `subadmin` with user.staff.permissions) passes only when they hold one of the listed keys. Every
// other role gets the same 403 the old isAdmin gave. Use it ONLY on the routes a staff role is meant
// to reach; every other admin route keeps isAdmin / authorizeRoles('admin').
const User = require('../models/User');
const { STAFF_PERMISSION_KEYS, STAFF_REQUEST_TYPES, labelFor } = require('../config/staffPermissions');

const loadStaff = async (req) => {
  if (req.staff !== undefined) return req.staff;
  const doc = await User.findById(req.user.id).select('staff isAdminBlocked').lean();
  req.staff = doc?.staff || null;
  return req.staff;
};

const requireAdminOr = (...keys) => {
  const unknown = keys.find(k => !STAFF_PERMISSION_KEYS.includes(k));
  if (!keys.length || unknown) throw new Error(`requireAdminOr: unknown staff permission ${unknown || '(none)'}`);

  const middleware = async (req, res, next) => {
    try {
      if (req.user && req.user.role === 'admin') return next();
      if (!req.user || req.user.role !== 'subadmin') return res.status(403).json({ msg: 'Access denied: Admin only' });
      const staff = await loadStaff(req);
      const granted = staff?.permissions || [];
      if (keys.some(k => granted.includes(k))) return next();
      return res.status(403).json({
        msg: `Your staff account does not include "${labelFor(keys[0])}". Ask the Super Admin to add it.`,
        permission: keys[0],
        requiredAnyOf: keys
      });
    } catch (err) {
      console.error('Staff permission check failed:', err.message);
      return res.status(503).json({ msg: 'Service temporarily unavailable' });
    }
  };
  middleware.staffPermissionKeys = keys;
  return middleware;
};

// Request-queue scope for staff: a counsellor only ever sees or touches the counselling-type requests.
const isStaff = (req) => req.user?.role === 'subadmin';
const staffMayTouchRequestType = (req, type) => !isStaff(req) || STAFF_REQUEST_TYPES.includes(type);
// Narrows a Mongo type filter: admin keeps what was asked; staff get the asked type only if allowed, else the allowed set.
const staffRequestTypeFilter = (req, askedType) => {
  if (!isStaff(req)) return askedType && askedType !== 'all' ? askedType : undefined;
  if (askedType && askedType !== 'all') return STAFF_REQUEST_TYPES.includes(askedType) ? askedType : { $in: [] };
  return { $in: STAFF_REQUEST_TYPES };
};

module.exports = { requireAdminOr, isStaff, staffMayTouchRequestType, staffRequestTypeFilter };
