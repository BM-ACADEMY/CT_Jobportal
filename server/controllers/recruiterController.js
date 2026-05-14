const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');
const Company = require('../models/Company');
const sendEmail = require('../utils/sendEmail');

// @desc    Get Recruiter Profile and Company Details
// @route   GET /api/recruiter/profile
const getRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate(['company', 'subscription']);

    if (!user) {
      return res.status(404).json({ msg: 'Recruiter not found' });
    }

    res.json({
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      recruiterProfile: user.recruiterProfile,
      company: user.company,
      subscription: user.subscription,
      downloadsUsed: user.downloadsUsed || 0
    });
  } catch (err) {
    console.error('Get Recruiter Profile Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update Recruiter Profile and Company Details
// @route   PUT /api/recruiter/profile
const updateRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, recruiterProfile, companyData } = req.body;

    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Recruiter not found' });
    }

    // 1. Update User Basic Info
    if (name) user.name = name;
    
    // Handle avatar from file upload if exists
    if (req.files && req.files['avatar']) {
        user.avatar = `/uploads/${req.files['avatar'][0].filename}`;
    }

    // 2. Update Recruiter Personal Info
    if (recruiterProfile) {
      const current = Number(recruiterProfile.currentExp) || 0;
      const previous = Number(recruiterProfile.previousExp) || 0;
      
      user.recruiterProfile = {
        ...user.recruiterProfile,
        ...recruiterProfile,
        currentExp: current,
        previousExp: previous,
        totalExp: current + previous
      };
    }

    // 3. Update or Create Company Info
    if (companyData && companyData.name && companyData.name.trim() !== '') {
      let company;
      if (user.company) {
        company = await Company.findById(user.company);
      }

      // Convert foundedYear to number or null to prevent CastError
      const sanitizedCompanyData = { ...companyData };
      if (sanitizedCompanyData.foundedYear === '') {
        delete sanitizedCompanyData.foundedYear;
      } else {
        sanitizedCompanyData.foundedYear = Number(sanitizedCompanyData.foundedYear);
      }

      // Remove empty slug so the sparse unique index is not triggered
      if (!sanitizedCompanyData.slug || sanitizedCompanyData.slug.trim() === '') {
        delete sanitizedCompanyData.slug;
      } else {
        sanitizedCompanyData.slug = sanitizedCompanyData.slug.trim().toLowerCase().replace(/\s+/g, '-');
      }

      if (!company) {
        // Create new company
        company = new Company(sanitizedCompanyData);
      } else {
        // Update existing
        Object.keys(sanitizedCompanyData).forEach(key => {
          company[key] = sanitizedCompanyData[key];
        });
      }

      // Handle logo upload
      if (req.files && req.files['logo']) {
        company.logo = `/uploads/${req.files['logo'][0].filename}`;
      }

      await company.save();
      user.company = company._id;
    }

    await user.save();
    
    // Fetch updated user with populated company and subscription
    const updatedUser = await User.findById(userId).populate(['company', 'subscription']);

    res.json({
      msg: 'Recruiter profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        recruiterProfile: updatedUser.recruiterProfile,
        company: updatedUser.company,
        subscription: updatedUser.subscription,
        downloadsUsed: updatedUser.downloadsUsed || 0
      }
    });

  } catch (err) {
    console.error('Update Recruiter Profile Error:', err);
    res.status(500).json({ 
        msg: 'Server error during profile update',
        error: err.message 
    });
  }
};

// @desc    Get team members for a company org
// @route   GET /api/company/team
const getTeamMembers = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.json([]);

    if (!user.company) {
      const found = await Company.findOne({ admin_email: user.email });
      if (found) { user.company = found._id; await user.save(); }
      else return res.json([]);
    }

    const members = await User.find({ company: user.company, _id: { $ne: userId } })
      .select('name email avatar recruiterProfile companyProfile role createdAt')
      .populate('role', 'name');

    res.json(members);
  } catch (err) {
    console.error('Get Team Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Invite a team member by email (send invite / update their company)
// @route   POST /api/company/team/invite
const inviteTeamMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, role: memberRole } = req.body;

    if (!email) return res.status(400).json({ msg: 'Email is required' });

    const currentUser = await User.findById(userId).populate('role');
    if (!currentUser) return res.status(404).json({ msg: 'User not found' });

    if (!currentUser.company) {
      const found = await Company.findOne({ admin_email: currentUser.email });
      if (found) {
        currentUser.company = found._id;
        await currentUser.save();
      } else {
        return res.status(400).json({ msg: 'Please complete your company profile in Settings before inviting members.' });
      }
    }

    const invitee = await User.findOne({ email });
    if (!invitee) return res.status(404).json({ msg: 'No user found with that email. They must register first.' });

    invitee.company = currentUser.company;
    invitee.companyProfile = { ...invitee.companyProfile, adminRole: memberRole || 'Member' };
    await invitee.save();

    res.json({ msg: `${email} has been added to your team.` });
  } catch (err) {
    console.error('Invite Team Member Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Remove a team member
// @route   DELETE /api/company/team/:memberId
const removeTeamMember = async (req, res) => {
  try {
    const userId = req.user.id;
    const { memberId } = req.params;

    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ msg: 'User not found' });

    if (!currentUser.company) {
      const found = await Company.findOne({ admin_email: currentUser.email });
      if (found) { currentUser.company = found._id; await currentUser.save(); }
      else return res.status(403).json({ msg: 'Please complete your company profile in Settings first.' });
    }

    const member = await User.findById(memberId);
    if (!member) return res.status(404).json({ msg: 'Member not found' });

    if (!member.company || member.company.toString() !== currentUser.company.toString()) {
      return res.status(403).json({ msg: 'This user is not part of your team' });
    }

    member.company = undefined;
    await member.save();

    res.json({ msg: 'Team member removed successfully' });
  } catch (err) {
    console.error('Remove Team Member Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get org employees for a company
// @route   GET /api/company/employees
const getOrgEmployees = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) return res.json([]);

    const employees = await User.find({ employerCompany: user.company })
      .select('name email avatar companyProfile createdAt')
      .lean();

    res.json(employees);
  } catch (err) {
    console.error('Get Org Employees Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Add an org employee by email (creates account if needed)
// @route   POST /api/company/employees
const addOrgEmployee = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) return res.status(404).json({ msg: 'User not found' });

    if (!adminUser.company) {
      const found = await Company.findOne({ admin_email: adminUser.email });
      if (found) {
        adminUser.company = found._id;
        await adminUser.save();
      } else {
        return res.status(400).json({ msg: 'Please complete your company profile in Settings before adding employees.' });
      }
    }

    const { email, name, designation } = req.body;
    if (!email || !name) return res.status(400).json({ msg: 'Email and name are required' });

    const orgEmployeeRole = await Role.findOne({ name: 'org_employee' });
    if (!orgEmployeeRole) {
      return res.status(500).json({ msg: 'org_employee role not found. Please run role seeder.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() }).populate('role');
    if (existing) {
      if (existing.role.name !== 'org_employee') {
        return res.status(400).json({ msg: `This email is already registered as a ${existing.role.name}. Use a different email.` });
      }
      if (existing.employerCompany && existing.employerCompany.toString() !== adminUser.company.toString()) {
        return res.status(400).json({ msg: 'This employee already belongs to another organization.' });
      }
      existing.employerCompany = adminUser.company;
      existing.companyProfile = { ...existing.companyProfile, adminRole: designation || 'Employee' };
      await existing.save();
      return res.json({ msg: `${email} has been added to your organization.` });
    }

    const tempPassword = crypto.randomBytes(8).toString('hex') + 'A1!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const company = await Company.findById(adminUser.company);

    const employee = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: orgEmployeeRole._id,
      isVerified: true,
      employerCompany: adminUser.company,
      companyProfile: { adminRole: designation || 'Employee' },
    });
    await employee.save();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #1d4ed8;">You've been added to ${company?.name || 'your organization'} on CT Portal</h2>
        <p>Hi ${name},</p>
        <p>${company?.name || 'Your organization'} has added you to their team on CT Portal. You can now browse jobs, track applications, and use your organization's tools.</p>
        <div style="background:#f3f4f6; border-radius:8px; padding:20px; margin:20px 0;">
          <p style="margin:0;"><strong>Email:</strong> ${email}</p>
          <p style="margin:8px 0 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p style="color:#6b7280; font-size:13px;">Please log in and change your password from Settings.</p>
      </div>
    `;

    await sendEmail({ email, subject: `You've been added to ${company?.name || 'your organization'} on CT Portal`, html: htmlContent });

    res.status(201).json({ msg: `${name} has been added. An invite email with login credentials has been sent.` });
  } catch (err) {
    console.error('Add Org Employee Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Remove an org employee
// @route   DELETE /api/company/employees/:employeeId
const removeOrgEmployee = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser || !adminUser.company) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const employee = await User.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    if (!employee.employerCompany || employee.employerCompany.toString() !== adminUser.company.toString()) {
      return res.status(403).json({ msg: 'This user is not part of your organization' });
    }

    employee.employerCompany = undefined;
    await employee.save();

    res.json({ msg: 'Employee removed from organization successfully' });
  } catch (err) {
    console.error('Remove Org Employee Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  getRecruiterProfile,
  updateRecruiterProfile,
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  getOrgEmployees,
  addOrgEmployee,
  removeOrgEmployee,
};
