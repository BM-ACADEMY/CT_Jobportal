// Roles a visitor may pick for themselves at sign-up (email or social).
// Privileged roles (admin, subadmin, drive_incharge, org_employee) are only ever
// assigned by an admin, a college invite, or a company team invite.
const SELF_SERVE_ROLES = ['jobseeker', 'recruiter', 'company', 'college'];

const isSelfServeRole = (role) => typeof role === 'string' && SELF_SERVE_ROLES.includes(role);

module.exports = { SELF_SERVE_ROLES, isSelfServeRole };
