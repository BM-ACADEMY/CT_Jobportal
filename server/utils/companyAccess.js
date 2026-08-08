// True when a user may see/manage their company's SHARED resources (jobs, applicants, etc.)
// beyond their own individually-posted content. A solo recruiter (not team-managed) always has
// access to their own company profile; a delegated team member only while their seat is active —
// e.g. after a plan downgrade trims their seat, they keep working as a normal solo recruiter on
// their own postings but lose visibility into the company's shared postings/management.
const hasCompanyAccess = (user) => {
  if (!user) return false;
  return !user.isTeamManaged || !!user.isActiveSeat;
};

module.exports = { hasCompanyAccess };
