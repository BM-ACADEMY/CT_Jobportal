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

module.exports = { ensureOrgCompany };
