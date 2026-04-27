const User = require('../models/User');

// Helper to calculate profile completion
const calculateCompletion = (user) => {
  let score = 0;
  const profile = user.profile || {};

  // Basic info (name is always there)
  score += 10; 

  if (user.avatar) score += 5;
  if (profile.headline) score += 10;
  if (profile.phone) score += 5;
  if (profile.location) score += 5;
  if (profile.bio) score += 10;
  if (profile.skills && profile.skills.length > 0) score += 10;
  if (profile.qualification && profile.qualification.length > 0) score += 10;
  if (profile.experience && profile.experience.length > 0) score += 15;
  if (profile.resumeUrl) score += 10;
  if (profile.preferredRole || (profile.interestedDomain && profile.interestedDomain.length > 0)) score += 10;

  return Math.min(score, 100);
};

// @desc    Update User Profile
// @route   PUT /api/user/profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Merge profile updates
    if (updates.profile) {
       user.profile = { ...user.profile.toObject(), ...updates.profile };
    }
    
    // Check for direct field updates like name
    if (updates.name) user.name = updates.name;
    if (updates.avatar) user.avatar = updates.avatar;

    // Recalculate completion
    user.profile.profileCompletion = calculateCompletion(user);

    await user.save();
    
    res.json({
        msg: 'Profile updated successfully',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            profile: user.profile
        }
    });

  } catch (err) {
    console.error('Update Profile Error:', err.message);
    res.status(500).json({ msg: 'Server error during profile update' });
  }
};

// @desc    Upload Resume
// @route   POST /api/user/resume
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);
    
    // Construct URL (In production this might be S3, here it's local)
    const resumeUrl = `/uploads/${req.file.filename}`;
    
    user.profile.resumeUrl = resumeUrl;
    user.profile.resumeName = req.file.originalname;
    
    // Recalculate completion
    user.profile.profileCompletion = calculateCompletion(user);

    await user.save();

    res.json({
      msg: 'Resume uploaded successfully',
      resumeUrl: resumeUrl,
      resumeName: req.file.originalname,
      profileCompletion: user.profile.profileCompletion
    });

  } catch (err) {
    console.error('Resume Upload Error:', err.message);
    res.status(500).json({ msg: 'Server error during resume upload' });
  }
};

module.exports = {
  updateProfile,
  uploadResume
};
