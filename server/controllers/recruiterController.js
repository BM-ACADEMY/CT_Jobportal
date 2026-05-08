const User = require('../models/User');
const Company = require('../models/Company');

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

module.exports = {
  getRecruiterProfile,
  updateRecruiterProfile
};
