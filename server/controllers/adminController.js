const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');

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

    const token = generateToken(admin._id, admin.role);

    res.json({
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: '', // Fallback since admins don't currently have avatars
      }
    });
  } catch (err) {
    console.error('Admin Login Error:', err.message);
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
    const jobs = await Job.find().populate('company').sort({ createdAt: -1 });
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
    console.error('Get User Details Error:', err.message);
    res.status(500).send('Server Error');
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
    if (profile) user.profile = { ...user.profile, ...profile };
    if (recruiterProfile) user.recruiterProfile = { ...user.recruiterProfile, ...recruiterProfile };
    if (companyProfile) user.companyProfile = { ...user.companyProfile, ...companyProfile };

    await user.save();
    res.json(user);
  } catch (err) {
    console.error('Update User Error:', err.message);
    res.status(500).send('Server Error');
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
    const Role = require('../models/Role');
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    console.error('Get Roles Error:', err.message);
    res.status(500).send('Server Error');
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
  deleteJob
};
