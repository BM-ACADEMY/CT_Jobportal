const Role = require('../models/Role');

// Shared by every acceptance path (invite-accept and join-request-accept) so the two ways
// someone can end up attached to a company don't duplicate this logic.

const promoteToOrgEmployee = async (user, companyId) => {
  const orgEmployeeRole = await Role.findOne({ name: 'org_employee' });
  if (!orgEmployeeRole) throw new Error('org_employee role not found');

  user.employerCompany = companyId;
  user.company = companyId; // Sync it for recruiter role logic
  user.role = orgEmployeeRole._id;

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

module.exports = { promoteToOrgEmployee, grantRecruiterTeamAccess };
