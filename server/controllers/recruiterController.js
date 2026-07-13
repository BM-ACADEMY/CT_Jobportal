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
    const user = await User.findById(userId)
      .populate(['company', 'subscription'])
      .populate('companyHistory.company');

    if (!user) {
      return res.status(404).json({ msg: 'Recruiter not found' });
    }

    res.json({
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      coverPic: user.coverPic,
      isPhoneVisible: user.isPhoneVisible,
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
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;
    if (req.body.coverPic !== undefined) user.coverPic = req.body.coverPic;
    if (req.body.isPhoneVisible !== undefined) user.isPhoneVisible = req.body.isPhoneVisible;
    
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

      // Handle gallery images from companyData
      if (companyData.gallery_images && Array.isArray(companyData.gallery_images)) {
        company.gallery_images = companyData.gallery_images;
      }

      if (companyData.norms_conditions !== undefined) {
        company.norms_conditions = companyData.norms_conditions;
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
        coverPic: updatedUser.coverPic,
        isPhoneVisible: updatedUser.isPhoneVisible,
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

    const members = await User.find({ 
      $or: [
        { 'companyHistory.company': user.company },
        { company: user.company }
      ],
      _id: { $ne: userId } 
    })
      .select('name email avatar recruiterProfile companyProfile role companyHistory createdAt')
      .populate('role', 'name');

    const mappedMembers = members.map(m => {
      const hist = m.companyHistory?.find(h => h.company && h.company.toString() === user.company.toString());
      return {
        _id: m._id,
        name: m.name,
        email: m.email,
        avatar: m.avatar,
        statusType: hist ? hist.status : 'Current',
        role: m.role
      };
    });

    res.json(mappedMembers);
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

    // Check user seats limit
    const subscription = currentUser.subscription;
    if (subscription) {
      const currentMemberCount = await User.countDocuments({ 
        $or: [
          { company: currentUser.company },
          { employerCompany: currentUser.company }
        ]
      });
      
      if (currentMemberCount >= subscription.userSeats) {
        return res.status(400).json({ 
          msg: `Seat limit reached. Your plan allows only ${subscription.userSeats} seat(s). Please upgrade your subscription.` 
        });
      }
    }

    const invitee = await User.findOne({ email }).populate('role');
    if (!invitee) return res.status(404).json({ msg: 'No recruiter found with that email. They must register as a recruiter first.' });
    if (invitee.role?.name !== 'recruiter') {
      return res.status(400).json({ msg: 'No recruiter found with that email. Please ensure the user is registered as a recruiter.' });
    }

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

// @desc    Send an invite to an existing user to join as an org employee
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

    // Check user seats limit
    const userWithSub = await User.findById(req.user.id).populate('subscription');
    const subscription = userWithSub?.subscription;
    if (subscription) {
      const currentMemberCount = await User.countDocuments({ 
        $or: [
          { company: adminUser.company },
          { employerCompany: adminUser.company }
        ]
      });
      
      if (currentMemberCount >= subscription.userSeats) {
        return res.status(400).json({ 
          msg: `Seat limit reached. Your plan allows only ${subscription.userSeats} seat(s). Please upgrade your subscription.` 
        });
      }
    }

    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    const existing = await User.findOne({ email: email.toLowerCase() }).populate('role');
    if (!existing) {
      return res.status(404).json({ msg: 'No recruiter found with that email. They must be registered first.' });
    }

    if (existing.role?.name !== 'recruiter') {
      return res.status(400).json({ msg: 'No recruiter found with that email. Please ensure the user is registered as a recruiter.' });
    }

    if (existing.employerCompany && existing.employerCompany.toString() === adminUser.company.toString()) {
        return res.status(400).json({ msg: 'This user is already a part of your team.' });
    }

    if (existing.employerCompany) {
      return res.status(400).json({ msg: 'This employee already belongs to another organization.' });
    }

    // Set the invite
    existing.pendingCompanyInvite = adminUser.company;
    await existing.save();

    const company = await Company.findById(adminUser.company);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #1d4ed8;">You have been invited to join ${company?.name || 'an organization'}</h2>
        <p>Hi ${existing.name},</p>
        <p>${company?.name || 'An organization'} has invited you to join their team on CT Portal.</p>
        <p>Please log in to your account and accept the invite from your dashboard.</p>
      </div>
    `;

    await sendEmail({ email, subject: `Invitation to join ${company?.name || 'an organization'}`, html: htmlContent });

    res.status(200).json({ msg: `Invite sent to ${email} successfully.` });
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

// @desc    Search companies by name or email
// @route   GET /api/recruiter/search-companies
const searchCompanies = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const regex = new RegExp(query, 'i');
    const companies = await Company.find({
      $or: [{ name: regex }, { admin_email: regex }]
    }).select('name logo admin_email display_id');

    res.json(companies);
  } catch (err) {
    console.error('Search Companies Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Request to join a company
// @route   POST /api/recruiter/request-join/:companyId
const requestJoinCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { statusType } = req.body; // 'Current' or 'Previous'
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    if (!company.pendingJoinRequests) company.pendingJoinRequests = [];
    
    // Check if already requested
    if (company.pendingJoinRequests.some(reqItem => reqItem.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'You have already sent a request to this company.' });
    }

    company.pendingJoinRequests.push({
      user: req.user.id,
      statusType: statusType || 'Current'
    });
    await company.save();

    res.json({ msg: 'Join request sent successfully.' });
  } catch (err) {
    console.error('Request Join Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get pending join requests for a company
// @route   GET /api/company/join-requests
const getJoinRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.company) return res.json([]);

    const company = await Company.findById(user.company).populate('pendingJoinRequests.user', 'name email avatar recruiterProfile display_id');
    if (!company) return res.json([]);

    // Format response to flat objects for frontend
    const requests = company.pendingJoinRequests.map(reqItem => ({
      _id: reqItem.user?._id,
      name: reqItem.user?.name,
      email: reqItem.user?.email,
      avatar: reqItem.user?.avatar,
      statusType: reqItem.statusType,
      requestedAt: reqItem.requestedAt
    })).filter(r => r._id);

    res.json(requests);
  } catch (err) {
    console.error('Get Join Requests Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Accept a join request from a recruiter
// @route   POST /api/company/join-requests/:userId/accept
const acceptJoinRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { userId } = req.params;

    const company = await Company.findById(user.company);
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    // Find the request to get the statusType
    const joinRequest = company.pendingJoinRequests.find(reqItem => reqItem.user.toString() === userId);
    const requestedStatusType = joinRequest ? joinRequest.statusType : 'Current';

    // Remove from pending
    company.pendingJoinRequests = company.pendingJoinRequests.filter(reqItem => reqItem.user.toString() !== userId);
    await company.save();

    // Update the recruiter
    const recruiter = await User.findById(userId);
    if (recruiter) {
      if (!recruiter.companyHistory) recruiter.companyHistory = [];
      
      if (requestedStatusType === 'Current') {
        // Mark existing current as previous
        recruiter.companyHistory.forEach(h => {
          if (h.status === 'Current') {
            h.status = 'Previous';
            h.leftAt = new Date();
          }
        });
      }
      
      // Add new company
      recruiter.companyHistory.push({
        company: company._id,
        status: requestedStatusType,
        joinedAt: new Date()
      });

      if (requestedStatusType === 'Current') {
        recruiter.company = company._id;
        if (!recruiter.companyProfile) recruiter.companyProfile = {};
        recruiter.companyProfile.adminRole = 'Member';
      }
      
      await recruiter.save();
    }

    res.json({ msg: 'Request accepted successfully.' });
  } catch (err) {
    console.error('Accept Join Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Reject a join request from a recruiter
// @route   POST /api/company/join-requests/:userId/reject
const rejectJoinRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { userId } = req.params;

    const company = await Company.findById(user.company);
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    // Remove from pending
    company.pendingJoinRequests = company.pendingJoinRequests.filter(reqItem => reqItem.user.toString() !== userId);
    await company.save();

    res.json({ msg: 'Request rejected successfully.' });
  } catch (err) {
    console.error('Reject Join Request Error:', err);
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
  searchCompanies,
  requestJoinCompany,
  getJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest
};
