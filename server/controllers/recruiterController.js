const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');
const Company = require('../models/Company');
const TeamActivityLog = require('../models/TeamActivityLog');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const { promoteToOrgEmployee, grantRecruiterTeamAccess } = require('../utils/teamMembership');

const TEAM_PERMISSIONS = [
  'post_job', 'my_jobs', 'candidate_search', 'messages',
  'ats_pipeline', 'analytics', 'bulk_messaging',
  'bulk_applicant_management', 'interview_scheduling', 'ai_candidate_matching'
];

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
      downloadsUsed: user.downloadsUsed || 0,
      joinRequestsUsed: user.joinRequestsUsed || 0
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
      .select('name email avatar recruiterProfile companyProfile role companyHistory createdAt display_id isActiveSeat')
      .populate('role', 'name');

    const mappedMembers = members.map(m => {
      const hist = m.companyHistory?.find(h => h.company && h.company.toString() === user.company.toString());
      return {
        _id: m._id,
        name: m.name,
        email: m.email,
        avatar: m.avatar,
        statusType: hist ? hist.status : 'Current',
        role: m.role,
        display_id: m.display_id,
        isActiveSeat: m.isActiveSeat,
        teamPermissions: m.teamPermissions
      };
    });

    res.json(mappedMembers);
  } catch (err) {
    console.error('Get Team Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Add a team member — Employee or Recruiter, chosen by the admin at invite time.
//          Employees get no permission picker (just marked as working here). Recruiters
//          get admin-granted page-level access, enforced in their own panel once accepted.
//          Requires the invitee to already be registered with role 'recruiter'; sends an
//          invite email, actual attachment happens when they accept (userController.acceptCompanyInvite).
// @route   POST /api/company/team/invite
const addTeamMember = async (req, res) => {
  try {
    const { email, type, permissions } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });
    if (!['employee', 'recruiter'].includes(type)) {
      return res.status(400).json({ msg: 'type must be employee or recruiter' });
    }

    const grantedPermissions = type === 'recruiter' && Array.isArray(permissions) ? permissions : [];
    const invalidPerm = grantedPermissions.find(p => !TEAM_PERMISSIONS.includes(p));
    if (invalidPerm) return res.status(400).json({ msg: `Invalid permission: ${invalidPerm}` });

    const adminUser = await User.findById(req.user.id);
    if (!adminUser) return res.status(404).json({ msg: 'User not found' });

    if (!adminUser.company) {
      const found = await Company.findOne({ admin_email: adminUser.email });
      if (found) {
        adminUser.company = found._id;
        await adminUser.save();
      } else {
        return res.status(400).json({ msg: 'Please complete your company profile in Settings before adding team members.' });
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
      return res.status(400).json({ msg: 'This user already belongs to another organization.' });
    }
    if (existing.pendingCompanyInvite?.company) {
      return res.status(400).json({ msg: 'This user already has a pending invite.' });
    }

    existing.pendingCompanyInvite = { company: adminUser.company, type, permissions: grantedPermissions };
    await existing.save();

    const company = await Company.findById(adminUser.company);
    const roleLabel = type === 'recruiter' ? 'Recruiter' : 'Employee';

    await sendEmail({
      email,
      subject: `Invitation to join ${company?.name || 'an organization'}`,
      html: emailWrapper('Team Invitation', `
        <p>Hi ${existing.name},</p>
        <p><strong>${company?.name || 'An organization'}</strong> has invited you to join their team as a <strong>${roleLabel}</strong> on Velaivaaipu.</p>
        <p>Please log in to your account and accept the invite from your dashboard.</p>
      `)
    });

    res.status(200).json({ msg: `Invite sent to ${email} successfully.` });
  } catch (err) {
    console.error('Add Team Member Error:', err);
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
    member.isTeamManaged = false;
    member.teamPermissions = [];
    await member.save();

    res.json({ msg: 'Team member removed successfully' });
  } catch (err) {
    console.error('Remove Team Member Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Update an existing team-managed recruiter's granted page permissions
// @route   PUT /api/company/team/:memberId/permissions
const updateTeamMemberPermissions = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.some(p => !TEAM_PERMISSIONS.includes(p))) {
      return res.status(400).json({ msg: 'Invalid permissions list' });
    }

    const adminUser = await User.findById(req.user.id);
    if (!adminUser?.company) return res.status(403).json({ msg: 'Not authorized' });

    const member = await User.findById(memberId);
    if (!member) return res.status(404).json({ msg: 'Member not found' });
    if (!member.isTeamManaged || !member.company || member.company.toString() !== adminUser.company.toString()) {
      return res.status(403).json({ msg: 'This user is not a team-managed recruiter in your organization' });
    }

    member.teamPermissions = permissions;
    await member.save();

    res.json({ msg: 'Permissions updated', teamPermissions: member.teamPermissions });
  } catch (err) {
    console.error('Update Team Member Permissions Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Toggle team member seat (activate/deactivate user seat)
// @route   PUT /api/company/team/:memberId/seat
const toggleTeamMemberSeat = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id).populate('subscription');
    if (!adminUser || !adminUser.company) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const { isActiveSeat } = req.body;
    const member = await User.findById(req.params.memberId);
    
    if (!member) {
      return res.status(404).json({ msg: 'Member not found' });
    }

    if (isActiveSeat) {
      const plan = adminUser.subscriptionDetails || adminUser.subscription;
      const userSeatsFeature = plan?.features?.find(f => f.name === 'User seats');
      const limit = userSeatsFeature?.isActive ? Number(userSeatsFeature.value) : 1;

      // Count currently active team members
      const activeMembers = await User.countDocuments({
        $or: [
          { company: adminUser.company },
          { employerCompany: adminUser.company }
        ],
        isActiveSeat: true,
        _id: { $ne: adminUser._id }
      });

      if (activeMembers >= limit) {
        return res.status(400).json({ 
          msg: `Seat limit reached. Your plan allows ${limit} active user seat(s).` 
        });
      }
    }

    member.isActiveSeat = isActiveSeat;
    await member.save();

    res.json({ msg: `Seat ${isActiveSeat ? 'activated' : 'deactivated'} successfully`, isActiveSeat });
  } catch (err) {
    console.error('Toggle Seat Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get activity history for delegated team members (org admin only)
// @route   GET /api/company/team-activity
const getTeamActivity = async (req, res) => {
  try {
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) return res.status(404).json({ msg: 'User not found' });

    if (!adminUser.company) {
      const found = await Company.findOne({ admin_email: adminUser.email });
      if (found) { adminUser.company = found._id; await adminUser.save(); }
      else return res.json({ logs: [], total: 0, page: 1, limit: 10 });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const { memberId } = req.query;

    const filter = { company: adminUser.company };
    if (memberId) filter.actor = memberId;

    const [logs, total] = await Promise.all([
      TeamActivityLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      TeamActivityLog.countDocuments(filter)
    ]);

    res.json({ logs, total, page, limit });
  } catch (err) {
    console.error('Get Team Activity Error:', err);
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
      .select('name email avatar companyProfile createdAt display_id isActiveSeat')
      .lean();

    res.json(employees);
  } catch (err) {
    console.error('Get Org Employees Error:', err);
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
    const userId = req.user.id;
    const { companyId } = req.params;
    const { statusType } = req.body; // 'Current' or 'Previous'

    const user = await User.findById(userId).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const plan = user.subscription;
    const requestsFeature = plan?.features?.find(f => f.name === 'Requests');
    const limit = requestsFeature?.isActive ? Number(requestsFeature.value) : 0;
    
    const used = user.joinRequestsUsed || 0;

    if (limit <= 0 || used >= limit) {
      return res.status(403).json({
        msg: limit <= 0 
          ? 'Join requests are not available in your current plan. Please upgrade to send requests.'
          : `Join request limit reached. Your plan allows ${limit} requests.`,
        requiresUpgrade: true,
        limit,
        used
      });
    }

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    if (!company.pendingJoinRequests) company.pendingJoinRequests = [];
    
    // Check if already requested
    if (company.pendingJoinRequests.some(reqItem => reqItem.user.toString() === userId)) {
      return res.status(400).json({ msg: 'You have already sent a request to this company.' });
    }

    company.pendingJoinRequests.push({
      user: userId,
      statusType: statusType || 'Current'
    });
    await company.save();

    user.joinRequestsUsed = used + 1;
    await user.save();

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

// @desc    Accept a join request from a recruiter — the admin picks Employee or Recruiter
//          (+ permissions if Recruiter) at accept time, same as the invite flow.
// @route   POST /api/company/join-requests/:userId/accept
const acceptJoinRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { userId } = req.params;
    const { type, permissions } = req.body;

    if (!['employee', 'recruiter'].includes(type)) {
      return res.status(400).json({ msg: 'type must be employee or recruiter' });
    }
    const grantedPermissions = type === 'recruiter' && Array.isArray(permissions) ? permissions : [];
    const invalidPerm = grantedPermissions.find(p => !TEAM_PERMISSIONS.includes(p));
    if (invalidPerm) return res.status(400).json({ msg: `Invalid permission: ${invalidPerm}` });

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
      if (requestedStatusType === 'Current') {
        // Active membership — grant the chosen type/permissions via the shared helpers.
        if (type === 'employee') {
          await promoteToOrgEmployee(recruiter, company._id);
        } else {
          await grantRecruiterTeamAccess(recruiter, company._id, grantedPermissions);
        }
      } else {
        // 'Previous' — just record history, no active access grant (matches prior behavior).
        if (!recruiter.companyHistory) recruiter.companyHistory = [];
        recruiter.companyHistory.push({ company: company._id, status: 'Previous', joinedAt: new Date() });
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

// @desc    Toggle auto-renew for the recruiter's company subscription (spec 9.3/9.4)
// @route   PUT /api/company/subscription/auto-renew
const toggleCompanyAutoRenew = async (req, res) => {
  try {
    const { autoRenewEnabled } = req.body;
    if (typeof autoRenewEnabled !== 'boolean') {
      return res.status(400).json({ msg: 'autoRenewEnabled must be a boolean' });
    }

    const user = await User.findById(req.user.id);
    if (!user?.company) return res.status(404).json({ msg: 'No company linked to your account' });

    const company = await Company.findById(user.company);
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    company.autoRenewEnabled = autoRenewEnabled;
    await company.save();

    res.json({ msg: `Auto-renew ${autoRenewEnabled ? 'enabled' : 'disabled'}`, autoRenewEnabled });
  } catch (err) {
    console.error('Toggle Company Auto-Renew Error:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Get sent join requests for a recruiter
// @route   GET /api/recruiter/my-requests
const getMyJoinRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const companies = await Company.find({ 'pendingJoinRequests.user': userId })
      .select('name logo admin_email pendingJoinRequests');
    
    const requests = companies.map(company => {
      const reqInfo = company.pendingJoinRequests.find(r => r.user.toString() === userId);
      return {
        _id: company._id,
        name: company.name,
        logo: company.logo,
        admin_email: company.admin_email,
        statusType: reqInfo?.statusType,
        requestedAt: reqInfo?.requestedAt,
        status: 'pending'
      };
    });
    
    res.json(requests);
  } catch (err) {
    console.error('Get My Join Requests Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Revoke a join request to a company
// @route   DELETE /api/recruiter/request-join/:companyId
const revokeJoinRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.params;
    
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ msg: 'Company not found' });
    
    company.pendingJoinRequests = company.pendingJoinRequests.filter(reqItem => reqItem.user.toString() !== userId);
    await company.save();
    
    const user = await User.findById(userId);
    if (user && user.joinRequestsUsed > 0) {
       user.joinRequestsUsed -= 1;
       await user.save();
    }
    
    res.json({ msg: 'Join request revoked successfully' });
  } catch (err) {
    console.error('Revoke Join Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  getRecruiterProfile,
  updateRecruiterProfile,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberPermissions,
  toggleTeamMemberSeat,
  getTeamActivity,
  getOrgEmployees,
  removeOrgEmployee,
  searchCompanies,
  requestJoinCompany,
  getJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  toggleCompanyAutoRenew,
  getMyJoinRequests,
  revokeJoinRequest
};
