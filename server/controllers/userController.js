const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const { promoteToOrgEmployee, grantRecruiterTeamAccess } = require('../utils/teamMembership');

// Helper to calculate profile completion
const calculateCompletion = (user) => {
  let score = 0;
  const profile = user.profile || {};
  const prefs = profile.jobPreferences || {};

  // Base points
  score += 5; 

  if (user.avatar) score += 5;
  if (profile.headline) score += 10;
  if (profile.phone) score += 5;
  if (profile.location) score += 5;
  if (profile.bio) score += 10;
  
  if (profile.skills && profile.skills.length > 0) score += 15;
  if (profile.qualification && profile.qualification.length > 0) score += 15;
  if (profile.experience && profile.experience.length > 0) score += 10;
  if (profile.resumeUrl) score += 20;
  
  if (profile.preferredRole || (profile.interestedDomain && profile.interestedDomain.length > 0) || (prefs.jobTitles && prefs.jobTitles.length > 0)) {
    score += 10;
  }
  
  if ((prefs.locationTypes && prefs.locationTypes.length > 0) || (prefs.employmentTypes && prefs.employmentTypes.length > 0)) {
    score += 10;
  }

  // Maximum possible is 120, capped at 100 so freshers (no experience) can still reach 100%.
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
       for (const key in updates.profile) {
           user.set(`profile.${key}`, updates.profile[key]);
       }
    }
    
    // Check for direct field updates like name
    if (updates.name) user.name = updates.name;
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    if (updates.coverPic !== undefined) user.coverPic = updates.coverPic;
    if (updates.isPhoneVisible !== undefined) user.isPhoneVisible = updates.isPhoneVisible;

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
            coverPic: updatedUser.coverPic,
            isPhoneVisible: updatedUser.isPhoneVisible,
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

// @desc    Upload Image (Profile/Cover)
// @route   POST /api/user/upload-image
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No image uploaded' });
    }
    
    const type = req.query.type === 'cover' ? 'cover' : 'profile';
    const userId = req.user.id;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    const targetDir = path.join(__dirname, '..', 'uploads', type);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    const targetFilename = `${userId}${ext}`;
    const targetPath = path.join(targetDir, targetFilename);
    const relativeUrl = `/uploads/${type}/${targetFilename}`;
    
    // Find the user to get old image path and delete it
    const user = await User.findById(userId);
    if (user) {
       const oldUrl = type === 'profile' ? user.avatar : user.coverPic;
       if (oldUrl && oldUrl.startsWith(`/uploads/${type}/`)) {
          const oldFilename = oldUrl.split('/').pop();
          if (oldFilename !== targetFilename) {
             const oldPath = path.join(targetDir, oldFilename);
             if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
             }
          }
       }
    }
    
    // Move the uploaded file to targetPath
    fs.renameSync(req.file.path, targetPath);
    
    res.json({ imageUrl: relativeUrl });
  } catch (err) {
    console.error('Image Upload Error:', err.message);
    res.status(500).json({ msg: 'Server error during image upload' });
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

// @desc    Toggle Hide Job
// @route   POST /api/user/hide-job/:jobId
const toggleHideJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!user.hiddenJobs) user.hiddenJobs = [];

    const isHidden = user.hiddenJobs.some(id => id.toString() === jobId);

    if (isHidden) {
      // Unhide
      user.hiddenJobs = user.hiddenJobs.filter(id => id.toString() !== jobId);
      await user.save();
      return res.json({ msg: 'Job unhidden successfully', hiddenJobs: user.hiddenJobs });
    } else {
      // Hide
      const Job = require('../models/Job');
      const jobExists = await Job.findById(jobId);
      if (!jobExists) return res.status(404).json({ msg: 'Job not found' });

      user.hiddenJobs.push(jobId);
      await user.save();
      return res.json({ msg: 'Job hidden successfully', hiddenJobs: user.hiddenJobs });
    }
  } catch (err) {
    console.error('Toggle Hide Job Error:', err.message);
    res.status(500).json({ msg: 'Server error during hide job' });
  }
};

// @desc    Get Hidden Jobs
// @route   GET /api/user/hidden-jobs
const getHiddenJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: 'hiddenJobs',
      populate: {
        path: 'company',
        select: 'name logo'
      }
    });

    if (!user) return res.status(404).json({ msg: 'User not found' });

    const jobs = user.hiddenJobs || [];
    const filteredJobs = jobs.filter(job => job !== null);

    res.json(filteredJobs);

  } catch (err) {
    console.error('Get Hidden Jobs Error:', err.message);
    res.status(500).json({ msg: 'Server error fetching hidden jobs' });
  }
};
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
    const jobs = user.savedJobs || [];
    const filteredJobs = jobs.filter(job => job !== null);

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
    const user = await User.findById(id)
      .select('name email avatar profile role isPhoneVisible subscription purchasedFeatures priorityApplicationsUsed')
      .populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const checkPriorityBadge = require('../utils/checkPriorityBadge');
    const isPriority = checkPriorityBadge(user);

    const userObj = user.toObject();
    userObj.isPriority = isPriority;
    delete userObj.purchasedFeatures;
    delete userObj.priorityApplicationsUsed;

    res.json(userObj);
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
    if (!user.subscription || !user.subscription.hasProfileViewInsights) {
      return res.status(403).json({ 
        msg: 'Subscription required to view profile visitors',
        requiresUpgrade: true 
      });
    }

    const viewers = await ProfileView.find({ viewed: userId })
      .populate({
        path: 'viewer',
        select: 'name avatar logo recruiterProfile companyProfile'
      })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json(viewers);
  } catch (err) {
    console.error('Get Profile Viewers Error:', err.message);
    res.status(500).json({ msg: 'Server error fetching viewers' });
  }
};

// @desc    Toggle auto-renewal preference
// @route   PATCH /api/user/auto-renew
const updateAutoRenew = async (req, res) => {
  try {
    const { autoRenew } = req.body;
    if (typeof autoRenew !== 'boolean') {
      return res.status(400).json({ msg: 'autoRenew must be a boolean' });
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { autoRenew },
      { new: true }
    ).select('autoRenew');
    res.json({ autoRenew: user.autoRenew });
  } catch (err) {
    console.error('Update AutoRenew Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Search user by email
// @route   GET /api/user/search
const searchUser = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('name email avatar role')
      .populate('role', 'name');
    
    if (!user) return res.status(404).json({ msg: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Search User Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Generate AI Resume
// @route   POST /api/user/generate-resume
const generateAIResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { desiredPosition, experienceLevel, skills, additionalInfo } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const prompt = `
      You are an expert ATS-friendly Resume Writer. The user wants to generate a professional resume tailored for the position of "${desiredPosition || 'Professional'}".
      Experience Level: ${experienceLevel || 'Mid-Level'}
      Skills: ${skills || 'Relevant industry skills'}
      Additional Info: ${additionalInfo || 'None'}
      User Name: ${user.name || 'John Doe'}
      User Email: ${user.email || 'email@example.com'}

      Generate a comprehensive, ATS-optimized resume in strictly JSON format. It must have the following structure exactly:
      {
        "personal": { "name": "${user.name || 'John Doe'}", "title": "${desiredPosition || 'Professional'}", "email": "${user.email || 'email@example.com'}", "phone": "", "location": "", "linkedin": "", "website": "" },
        "summary": "A strong 3-4 sentence professional summary focusing on the desired position, optimized for ATS...",
        "experience": [
          { "id": "exp1", "company": "Company Name", "role": "Role", "start": "Jan 2020", "end": "Present", "current": true, "bullets": "• Bullet 1\\n• Bullet 2" }
        ],
        "education": [
          { "id": "edu1", "school": "University Name", "degree": "Degree", "field": "Field of Study", "start": "2015", "end": "2019", "gpa": "" }
        ],
        "skills": ["Skill 1", "Skill 2", "Skill 3"],
        "projects": [
          { "id": "proj1", "name": "Project Name", "tech": "Tech Stack", "link": "", "description": "Project description" }
        ],
        "certifications": []
      }

      Generate realistic placeholder content based on the provided skills and experience level if specific details are not provided. Use strong action verbs and include keywords that will be helpful to find this desired position. Ensure the JSON is perfectly valid. Do not use markdown.
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const resultObj = await model.generateContent(prompt);
    let responseText = resultObj.response.text();
    
    // Strip markdown formatting if present
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(responseText);

    res.json(result);
  } catch (err) {
    console.error('AI Resume Generation Error:', err);
    res.status(500).json({ msg: 'Failed to generate AI resume', error: err.message });
  }
};

// @desc    Analyze AI Resume
// @route   POST /api/user/analyze-resume
const analyzeResume = async (req, res) => {
  try {
    const { jobRole, jobDescription } = req.body;

    if (!req.file) {
      return res.status(400).json({ msg: 'No resume file uploaded' });
    }

    let resumeText = '';

    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      try {
        const data = await pdfParse(dataBuffer);
        resumeText = data.text;
      } catch (parseErr) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ msg: 'Could not parse the PDF file. It might be corrupted or encrypted.' });
      }
    } else {
      // For Word docs or other text formats, fallback to reading as string if possible, or reject.
      // For simplicity, we just read file as utf8, though it might be gibberish for DOCX without Mammoth.
      resumeText = fs.readFileSync(req.file.path, 'utf8');
    }

    // Clean up the uploaded file to save space
    fs.unlinkSync(req.file.path);

    const prompt = `
      You are an expert ATS (Applicant Tracking System) Analyzer and Technical Recruiter.
      I will provide you with a Job Role, a Job Description (JD), and the Text extracted from a Resume.

      Job Role: ${jobRole}
      Job Description: ${jobDescription}
      
      Resume Text:
      ${resumeText}

      Please analyze the resume against the job description.
      Output strictly in JSON format with the following structure:
      {
        "score": <number 0-100 representing the ATS match percentage>,
        "missingKeywords": [<array of strings of important keywords from the JD that are missing in the resume>],
        "instructions": [<array of 3-5 strings with specific, actionable instructions to improve the resume for this role>]
      }

      Do not include any markdown formatting or surrounding text, just the raw JSON object.
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const resultObj = await model.generateContent(prompt);
    let responseText = resultObj.response.text();
    
    // Strip markdown formatting if present
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const result = JSON.parse(responseText);

    res.json(result);
  } catch (err) {
    console.error('AI Resume Analysis Error:', err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ msg: 'Failed to analyze resume', error: err.message });
  }
};

// @desc    Accept company invite
// @route   POST /api/user/accept-company-invite
const acceptCompanyInvite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('pendingCompanyInvite.company');
    if (!user || !user.pendingCompanyInvite?.company) {
      return res.status(400).json({ msg: 'No pending invite found.' });
    }

    const { company, type, permissions } = user.pendingCompanyInvite;

    if (type === 'recruiter') {
      await grantRecruiterTeamAccess(user, company._id, permissions || []);
    } else {
      await promoteToOrgEmployee(user, company._id);
    }

    user.pendingCompanyInvite = undefined;
    await user.save();
    res.json({ msg: 'Invite accepted. Your account is now part of the organization.' });
  } catch (err) {
    console.error('Accept Invite Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Decline company invite
// @route   POST /api/user/decline-company-invite
const declineCompanyInvite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.pendingCompanyInvite?.company) {
      return res.status(400).json({ msg: 'No pending invite found.' });
    }

    user.pendingCompanyInvite = undefined;
    await user.save();
    res.json({ msg: 'Invite declined.' });
  } catch (err) {
    console.error('Decline Invite Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  updateProfile,
  uploadResume,
  toggleSaveJob,
  getSavedJobs,
  toggleHideJob,
  getHiddenJobs,
  getPublicProfile,
  toggleBlockEntity,
  trackProfileView,
  getProfileViewers,
  updateAutoRenew,
  searchUser,
  uploadImage,
  generateAIResume,
  analyzeResume,
  acceptCompanyInvite,
  declineCompanyInvite
};
