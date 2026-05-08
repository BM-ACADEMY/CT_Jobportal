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
    
    // Refresh user with populated subscription
    const updatedUser = await User.findById(userId).populate('subscription');
    
    res.json({
        msg: 'Profile updated successfully',
        user: {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            profile: updatedUser.profile,
            savedJobs: updatedUser.savedJobs || [],
            subscription: updatedUser.subscription,
            subscriptionExpiry: updatedUser.subscriptionExpiry,
            downloadsUsed: updatedUser.downloadsUsed || 0
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

// @desc    Toggle Save Job
// @route   POST /api/user/save-job/:jobId
const toggleSaveJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Initialize savedJobs if it doesn't exist
    if (!user.savedJobs) user.savedJobs = [];

    const isSaved = user.savedJobs.some(id => id.toString() === jobId);

    if (isSaved) {
      // Unsave
      user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
      await user.save();
      return res.json({ msg: 'Job removed from saved jobs', savedJobs: user.savedJobs });
    } else {
      // Save
      // Optional: Verify job exists
      const Job = require('../models/Job');
      const jobExists = await Job.findById(jobId);
      if (!jobExists) return res.status(404).json({ msg: 'Job not found' });

      user.savedJobs.push(jobId);
      await user.save();
      return res.json({ msg: 'Job saved successfully', savedJobs: user.savedJobs });
    }

  } catch (err) {
    console.error('Toggle Save Job Error:', err.message);
    res.status(500).json({ msg: 'Server error during save job' });
  }
};

// @desc    Get Saved Jobs
// @route   GET /api/user/saved-jobs
const getSavedJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: 'savedJobs',
      populate: {
        path: 'company',
        select: 'name logo'
      }
    });

    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Filter out any nulls in case a job was deleted
    const filteredJobs = user.savedJobs.filter(job => job !== null);

    res.json(filteredJobs);

  } catch (err) {
    console.error('Get Saved Jobs Error:', err.message);
    res.status(500).json({ msg: 'Server error fetching saved jobs' });
  }
};

// @desc    Get Public Profile by ID
// @route   GET /api/user/profile/:id
const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('name email avatar profile role');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Get Public Profile Error:', err.message);
    res.status(500).json({ msg: 'Server error fetching profile' });
  }
};

// @desc    Toggle Block User/Company
// @route   POST /api/user/block/:id
const toggleBlockEntity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // Entity to block/unblock

    if (userId === id) {
      return res.status(400).json({ msg: 'You cannot block yourself' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const isBlocked = user.blockedEntities.includes(id);

    if (isBlocked) {
      // Unblock
      user.blockedEntities = user.blockedEntities.filter(bid => bid.toString() !== id);
      await user.save();
      return res.json({ msg: 'Entity unblocked successfully', blockedEntities: user.blockedEntities });
    } else {
      // Block
      user.blockedEntities.push(id);
      await user.save();
      return res.json({ msg: 'Entity blocked successfully', blockedEntities: user.blockedEntities });
    }

  } catch (err) {
    console.error('Toggle Block Entity Error:', err.message);
    res.status(500).json({ msg: 'Server error during block operation' });
  }
};

// @desc    Track Profile View
// @route   POST /api/user/profile/:id/view
const trackProfileView = async (req, res) => {
  try {
    const { id } = req.params; // Viewed user ID
    const viewerId = req.user.id;
    const viewerModel = req.user.role === 'jobseeker' ? 'User' : 'Company';

    if (viewerId === id) return res.status(200).json({ msg: 'Self view' });

    const ProfileView = require('../models/ProfileView');
    
    // Save the view
    await ProfileView.create({
      viewer: viewerId,
      viewerModel,
      viewed: id,
      timestamp: new Date()
    });

    res.status(200).json({ msg: 'View tracked' });
  } catch (err) {
    console.error('Track Profile View Error:', err.message);
    res.status(500).json({ msg: 'Server error tracking view' });
  }
};

// @desc    Get Profile Viewers
// @route   GET /api/user/profile/viewers
const getProfileViewers = async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    const ProfileView = require('../models/ProfileView');
    
    const user = await User.findById(userId).populate('subscription');
    
    if (!user) return res.status(404).json({ msg: 'User not found' });
    
    // Check if user has access to see viewers
    if (!user.subscription || !user.subscription.hasProfileViewAccess) {
      return res.status(403).json({ 
        msg: 'Subscription required to view profile visitors',
        requiresUpgrade: true 
      });
    }

    const viewers = await ProfileView.find({ viewed: userId })
      .populate('viewer', 'name avatar')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(viewers);
  } catch (err) {
    console.error('Get Profile Viewers Error:', err.message);
    res.status(500).json({ msg: 'Server error fetching viewers' });
  }
};

module.exports = {
  updateProfile,
  uploadResume,
  toggleSaveJob,
  getSavedJobs,
  getPublicProfile,
  toggleBlockEntity,
  trackProfileView,
  getProfileViewers
};
