const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Role = require('../models/Role');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id, roleName) => {
  return jwt.sign(
    { id, role: roleName },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

// @desc    Authenticate admin & get token
// @route   POST /api/admin/login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    if (admin.twoFactorAuth && admin.twoFactorAuth.enabled) {
      // Generate 4-digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      
      admin.twoFactorAuth.otp = otp;
      admin.twoFactorAuth.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await admin.save();

      // Send Email
      const emailOptions = {
        email: admin.email,
        subject: 'Admin Login 2FA OTP',
        html: `<p>Your 4-digit Admin Login OTP is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
      };
      await sendEmail(emailOptions);

      return res.json({ require2FA: true, adminId: admin._id });
    }

    const token = generateToken(admin._id, admin.role);
    admin.lastLogin = new Date();
    await admin.save();

    res.json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.profilePicture,
        admin_id: admin.admin_id,
        twoFactorAuth: admin.twoFactorAuth
      }
    });
  } catch (err) {
    console.error('Admin Login Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Verify Admin OTP
// @route   POST /api/admin/login-verify-otp
const verifyAdminLoginOTP = async (req, res) => {
  try {
    const { adminId, otp } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(400).json({ msg: 'Invalid Admin' });
    }

    if (!admin.twoFactorAuth || admin.twoFactorAuth.otp !== otp || admin.twoFactorAuth.otpExpires < new Date()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // Clear OTP
    admin.twoFactorAuth.otp = undefined;
    admin.twoFactorAuth.otpExpires = undefined;
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken(admin._id, admin.role);

    res.json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.profilePicture,
        admin_id: admin.admin_id,
        twoFactorAuth: admin.twoFactorAuth
      }
    });
  } catch (err) {
    console.error('Verify Admin OTP Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get counts for dashboard
// @route   GET /api/admin/dashboard-stats
const getDashboardStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const companyCount = await Company.countDocuments();
    const jobCount = await Job.countDocuments();

    res.json({
      users: userCount,
      companies: companyCount,
      jobs: jobCount,
      // For demonstration, you could add daily traffic or other metrics here
    });
  } catch (err) {
    console.error('Stats Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('role', 'name').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Get Users Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete User Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all companies
// @route   GET /api/admin/companies
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(companies);
  } catch (err) {
    console.error('Get Companies Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Delete a company
// @route   DELETE /api/admin/companies/:id
const deleteCompany = async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Company deleted successfully' });
  } catch (err) {
    console.error('Delete Company Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all jobs
// @route   GET /api/admin/jobs
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('company')
      .populate('recruiter', 'name email')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error('Get Jobs Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get user details
// @route   GET /api/admin/users/:id
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('role', 'name')
      .populate('company');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Get User Details Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Get user applications
// @route   GET /api/admin/users/:id/applications
const getUserApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.params.id })
      .populate({
        path: 'job',
        select: 'title display_id location workMode jobType status',
        populate: {
          path: 'company',
          select: 'name logo_url'
        }
      })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error('Get User Applications Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { name, email, role, profile, recruiterProfile, companyProfile } = req.body;
    
    // Check if role exists if it's being updated
    // For now, we assume role ID is passed correctly

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (role) user.role = role;
    
    // Update profiles safely
    if (profile) {
      Object.keys(profile).forEach(key => {
        if (profile[key] !== undefined) {
          user.profile[key] = profile[key];
        }
      });
    }
    if (recruiterProfile) {
      Object.keys(recruiterProfile).forEach(key => {
        if (recruiterProfile[key] !== undefined) {
          user.recruiterProfile[key] = recruiterProfile[key];
        }
      });
    }
    if (companyProfile) {
      Object.keys(companyProfile).forEach(key => {
        if (companyProfile[key] !== undefined) {
          user.companyProfile[key] = companyProfile[key];
        }
      });
    }

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Toggle block user
// @route   PATCH /api/admin/users/:id/block
const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.isAdminBlocked = !user.isAdminBlocked;
    await user.save();

    res.json({ msg: `User ${user.isAdminBlocked ? 'blocked' : 'unblocked'} successfully`, isAdminBlocked: user.isAdminBlocked });
  } catch (err) {
    console.error('Block User Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get all roles
// @route   GET /api/admin/roles
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    console.error('Get Roles Error:', err);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
};

// @desc    Delete a job
// @route   DELETE /api/admin/jobs/:id
const deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Job deleted successfully' });
  } catch (err) {
    console.error('Delete Job Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update Admin Profile
// @route   PUT /api/admin/profile
const updateAdminProfile = async (req, res) => {
  try {
    const { name, email, profilePicture } = req.body;
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) return res.status(404).json({ msg: 'Admin not found' });
    
    if (name) admin.name = name;
    if (profilePicture) admin.profilePicture = profilePicture;
    
    if (email && email.toLowerCase() !== admin.email) {
      const existing = await Admin.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(400).json({ msg: 'Email already in use' });
      
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      admin.pendingEmail = email.toLowerCase();
      
      if (!admin.twoFactorAuth) admin.twoFactorAuth = {};
      admin.twoFactorAuth.otp = otp;
      admin.twoFactorAuth.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      
      await sendEmail({
        email: email.toLowerCase(),
        subject: 'Admin Email Change OTP',
        html: `<p>Your 4-digit OTP to confirm email change is: <strong>${otp}</strong>. Expires in 10 mins.</p>`
      });
      
      await admin.save();
      return res.json({ msg: 'OTP sent to new email', requireEmailOTP: true });
    }
    
    await admin.save();
    res.json(admin);
  } catch (err) {
    console.error('Update Admin Profile Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Verify Admin Email OTP
// @route   POST /api/admin/verify-email-otp
const verifyAdminEmailOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const admin = await Admin.findById(req.user.id);
    
    if (!admin || !admin.pendingEmail) return res.status(400).json({ msg: 'No pending email change' });
    if (!admin.twoFactorAuth || admin.twoFactorAuth.otp !== otp || admin.twoFactorAuth.otpExpires < new Date()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }
    
    admin.email = admin.pendingEmail;
    admin.pendingEmail = undefined;
    admin.twoFactorAuth.otp = undefined;
    admin.twoFactorAuth.otpExpires = undefined;
    await admin.save();
    
    res.json({ msg: 'Email updated successfully', admin });
  } catch (err) {
    console.error('Verify Admin Email OTP Error:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Toggle Admin 2FA
// @route   PATCH /api/admin/2fa
const toggleAdmin2FA = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) return res.status(404).json({ msg: 'Admin not found' });
    
    if (!admin.twoFactorAuth) admin.twoFactorAuth = { enabled: false };
    admin.twoFactorAuth.enabled = !admin.twoFactorAuth.enabled;
    admin.markModified('twoFactorAuth');
    await admin.save();
    
    res.json({ enabled: admin.twoFactorAuth.enabled, msg: `2FA ${admin.twoFactorAuth.enabled ? 'enabled' : 'disabled'}` });
  } catch (err) {
    console.error('Toggle Admin 2FA Error:', err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  loginAdmin,
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  toggleBlockUser,
  getRoles,
  getCompanies,
  deleteCompany,
  getJobs,
  deleteJob,
  verifyAdminLoginOTP,
  updateAdminProfile,
  verifyAdminEmailOTP,
  toggleAdmin2FA,
  getUserApplications
};
