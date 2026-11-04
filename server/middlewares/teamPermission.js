// Server side of the team permission gate.
//
// A company admin invites a recruiter and ticks the pages that person may use (post_job, my_jobs, ...).
// Until now only the browser enforced that (PrivateRoute / Sidebar), so a team member who typed an API
// URL, or used the app's own calls from another page, could reach everything the company owns. This
// middleware applies the same rule on the server for every route behind those pages.
//
// Scope is exactly the client's: only a `recruiter` who is team-managed (added by a company admin) is
// gated. Company owners, solo recruiters, org employees, colleges and admins pass straight through,
// so no existing flow changes for them.
//
// requireTeamPermission('a', 'b') passes when the member holds ANY of the listed keys.
const User = require('../models/User');
const { TEAM_PERMISSION_KEYS, labelFor } = require('../config/teamPermissions');

const loadMember = async (req) => {
  if (req.teamMember !== undefined) return req.teamMember;
  const doc = await User.findById(req.user.id).select('isTeamManaged teamPermissions').lean();
  req.teamMember = doc || null;
  return req.teamMember;
};

const requireTeamPermission = (...keys) => {
  const unknown = keys.find(k => !TEAM_PERMISSION_KEYS.includes(k));
  if (!keys.length || unknown) throw new Error(`requireTeamPermission: unknown permission ${unknown || '(none)'}`);

  const middleware = async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== 'recruiter') return next();
      const member = await loadMember(req);
      if (!member || !member.isTeamManaged) return next();
      const granted = member.teamPermissions || [];
      if (keys.some(k => granted.includes(k))) return next();
      return res.status(403).json({
        msg: `Your company admin has not given you access to ${labelFor(keys[0])}. Ask them to update your permissions.`,
        permission: keys[0],
        requiredAnyOf: keys
      });
    } catch (err) {
      console.error('Team permission check failed:', err.message);
      return res.status(503).json({ msg: 'Service temporarily unavailable' });
    }
  };
  // Lets tests (and anyone reading router.stack) see which keys guard a route.
  middleware.teamPermissionKeys = keys;
  return middleware;
};

module.exports = { requireTeamPermission };
