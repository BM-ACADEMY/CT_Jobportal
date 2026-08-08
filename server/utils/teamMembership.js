const Role = require('../models/Role');
const User = require('../models/User');

// Shared by every acceptance path (invite-accept and join-request-accept) so the two ways
// someone can end up attached to a company don't duplicate this logic.

const promoteToOrgEmployee = async (user, companyId) => {
  const orgEmployeeRole = await Role.findOne({ name: 'org_employee' });
  if (!orgEmployeeRole) throw new Error('org_employee role not found');

  user.employerCompany = companyId;
  user.company = companyId; // Sync it for recruiter role logic
  user.role = orgEmployeeRole._id;
  // Needed so hasCompanyAccess()'s seat check (server/utils/companyAccess.js) applies to
  // org_employees too — without this they'd always be treated as having full company access
  // regardless of isActiveSeat, since that check keys off isTeamManaged.
  user.isTeamManaged = true;

  if (!user.companyHistory) user.companyHistory = [];
  user.companyHistory.forEach(h => {
    if (h.status === 'Current') {
      h.status = 'Previous';
      h.leftAt = new Date();
    }
  });
  user.companyHistory.push({ company: companyId, status: 'Current', joinedAt: new Date() });

  if (!user.companyProfile) user.companyProfile = {};
  if (!user.companyProfile.adminRole) user.companyProfile.adminRole = 'Employee';
};

const grantRecruiterTeamAccess = async (user, companyId, permissions = []) => {
  if (!user.companyHistory) user.companyHistory = [];
  user.companyHistory.forEach(h => {
    if (h.status === 'Current') {
      h.status = 'Previous';
      h.leftAt = new Date();
    }
  });
  user.companyHistory.push({ company: companyId, status: 'Current', joinedAt: new Date() });

  user.company = companyId;
  user.isTeamManaged = true;
  user.teamPermissions = permissions;

  if (!user.companyProfile) user.companyProfile = {};
  user.companyProfile.adminRole = 'Member';
};

// Deactivates the newest active team-member seats in excess of a plan's userSeats limit —
// called whenever an org owner's effective plan changes (upgrade/downgrade/cancel/expiry) so
// seat activations stay in sync instead of only being enforced going forward on new activations.
// Mirrors the $or company/employerCompany query used by addTeamMember/toggleTeamMemberSeat.
const reconcileTeamSeats = async (ownerUser, plan) => {
  if (!ownerUser?.company) return;

  const limit = Number(plan?.userSeats) || 0;

  const activeMembers = await User.find({
    $or: [
      { company: ownerUser.company },
      { employerCompany: ownerUser.company }
    ],
    isActiveSeat: true,
    _id: { $ne: ownerUser._id }
  }).sort({ createdAt: 1 });

  if (activeMembers.length <= limit) return;

  const toDeactivate = activeMembers.slice(limit).map(m => m._id);
  await User.updateMany(
    { _id: { $in: toDeactivate } },
    { $set: { isActiveSeat: false } }
  );
};

module.exports = { promoteToOrgEmployee, grantRecruiterTeamAccess, reconcileTeamSeats };
