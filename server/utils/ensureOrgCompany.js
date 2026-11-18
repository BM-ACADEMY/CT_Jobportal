// Organization accounts (role 'company') must have a Company document, because the public
// Companies page and company profiles are built from the `companies` collection, not from users.
// Recruiters are intentionally NOT given one: they are listed as recruiters.
const Company = require('../models/Company');

// `user` must be a User document with `role` populated (or a role name in `roleName`).
const ensureOrgCompany = async (user, roleName) => {
  const role = roleName || user.role?.name;
  if (role !== 'company' || user.company) return null;
  const company = await Company.create({
    name: (user.name || '').trim() || user.email,
    admin_email: user.email,
    location: user.companyProfile?.location || '',
    description: user.companyProfile?.bio || '',
  });
  user.company = company._id;
  await user.save();
  return company;
};

// The public Companies and Jobs pages only show verified companies (Company.is_verified), while admins
// verify the ACCOUNT (User.profileVerificationStatus). When an admin verifies a recruiter or organization
// account, its company counts as verified too, so its jobs and profile are not left hidden.
const verifyLinkedCompany = async (user, adminId = null) => {
  if (!user || !user.company) return false;
  const res = await Company.updateOne(
    { _id: user.company, is_verified: { $ne: true } },
    { $set: {
      is_verified: true,
      verifiedAt: new Date(),
      verifiedBy: adminId,
      verification_note: 'Verified together with the account by an admin',
    } }
  );
  return res.modifiedCount > 0;
};

module.exports = { ensureOrgCompany, verifyLinkedCompany };
