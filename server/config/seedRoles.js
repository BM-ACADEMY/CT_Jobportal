const Role = require('../models/Role');

const seedRoles = async () => {
  const roles = [
    { name: 'jobseeker', description: 'Regular user looking for jobs', permissions: ['read_jobs', 'apply_jobs'] },
    { name: 'recruiter', description: 'Company HR posting jobs', permissions: ['manage_jobs', 'view_applicants'] },
    { name: 'company', description: 'Direct Corporate Entity', permissions: ['manage_jobs', 'view_applicants', 'manage_company_profile'] },
    { name: 'admin', description: 'Platform Administrator', permissions: ['manage_all'] },
    { name: 'subadmin', description: 'Content Moderator', permissions: ['moderate_jobs', 'moderate_users'] },
    { name: 'org_employee', description: 'Organization Employee with company plan access', permissions: ['read_jobs', 'apply_jobs'] }
  ];

  try {
    for (const roleData of roles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await Role.create(roleData);
        console.log(`Role '${roleData.name}' created.`);
      }
    }
    console.log('Roles initialization checked.');
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

module.exports = seedRoles;
