// Two kinds of admin login: "owner" (full power, the default for every existing admin) and "limited"
// (the level a newly invited admin gets). A limited admin can do the daily work (review companies and
// jobs, answer WhatsApp, assign requests, read users) but NOT the things that could be misused:
// money and plans, deletions, editing or blocking users, bulk exports, security settings, and who else is admin.
// The check runs inside authorizeRoles('admin') / isAdmin, so every admin route in every router is covered.

// [method, full path after /api]. '*' = any method.
const BLOCKED = [
  ['*', /^\/admin\/(admins|staff)(\/|$)/],                       // adding, removing, changing admins and staff
  ['*', /^\/admin\/job-limits\/grant$/],                          // raising employer limits free of charge
  ['*', /^\/admin\/users\/[^/]+\/(plan|extend-subscription|verify-email|verification-status|block)$/],
  ['PUT', /^\/admin\/users\/[^/]+$/],                             // editing a user
  ['*', /^\/admin\/(2fa|spend)(\/|$)/],                           // 2-step switch and money-spent records
  ['POST', /^\/admin\/colleges\/(merge|[^/]+\/student-pack)$/],
  ['POST', /^\/admin\/drives\/[^/]+\/mark-paid$/],                // payments received
  ['POST', /^\/admin\/jobs\/[^/]+\/(sponsor|unsponsor|urgent)$/], // paid promotions
  ['PUT', /^\/admin\/needs-action\/rules$/],
  ['POST', /^\/payments\/admin\//],                                // refunds, renewal reminders
  ['*', /^\/coupons(\/|$)/],                                       // discount codes
  ['PATCH', /^\/job-fairs\/admin\/stall-price$/],
  ['PATCH', /^\/settings(\/|$)/],                                  // site settings
  ['*', /^\/(subscriptions|pay-per)\//],                           // prices and plan features (only owner-gated routes reach this check)
];

const isBlockedForLimited = (method, path, query = {}) => {
  if (query && String(query.format).toLowerCase() === 'csv') return true; // bulk personal data
  if (method === 'DELETE') return true;                                   // every deletion
  return BLOCKED.some(([m, re]) => (m === '*' || m === method) && re.test(path));
};

const levelOf = (admin) => (admin && admin.level === 'limited' ? 'limited' : 'owner');
const pathOf = (req) => `${req.baseUrl || ''}${req.path || ''}`.replace(/^\/api/, '').replace(/\/+$/, '') || '/';

// Resolves with true when the request may continue.
const checkLimited = async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return true;
  if (!/^[a-f0-9]{24}$/i.test(String(req.user.id))) return true;
  try {
    const Admin = require('../models/Admin'); // loaded on use so the rules can be tested without a database
    const admin = await Admin.findById(req.user.id).select('level').lean();
    req.adminLevel = levelOf(admin);
    if (req.adminLevel === 'limited' && isBlockedForLimited(req.method, pathOf(req), req.query)) {
      res.status(403).json({ msg: 'Your admin access is limited. Ask the Owner (Kamar) to do this.', limited: true });
      return false;
    }
    return true;
  } catch (e) {
    console.error('Admin level check failed:', e.message);
    res.status(503).json({ msg: 'Service temporarily unavailable' });
    return false;
  }
};

module.exports = { checkLimited, isBlockedForLimited, levelOf, pathOf, BLOCKED };
