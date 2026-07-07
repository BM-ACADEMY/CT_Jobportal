const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Recruiter)
const createJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('subscription');

    if (!user || !user.company) {
      return res.status(400).json({ msg: 'You must be associated with a company to post jobs' });
    }

    // Enforce job posting limit
    const plan = user.subscription;
    if (plan && plan.activeJobPostings > 0) {
      const activeCount = await Job.countDocuments({
        company: user.company,
        status: { $in: ['active', 'closed'] }
      });
      if (activeCount >= plan.activeJobPostings) {
        return res.status(403).json({
          msg: `Job posting limit reached. Your plan allows ${plan.activeJobPostings} job postings. Upgrade to post more.`,
          requiresUpgrade: true,
          limit: plan.activeJobPostings,
          used: activeCount
        });
      }
    }

    const {
      title,
      description,
      vacancies,
      experience,
      jobType,
      workMode,
      location,
      salary,
      timings,
      shifts,
      skillsRequired,
      additionalDetails,
      status
    } = req.body;
    
    // Conditional validation: Only require title/description if not a draft
    if (status !== 'draft') {
      if (!title) return res.status(400).json({ msg: 'Job title is required for publishing' });
      if (!description) return res.status(400).json({ msg: 'Job description is required for publishing' });
    }

    const newJob = new Job({
      title,
      description,
      vacancies,
      experience,
      jobType,
      workMode,
      location,
      salary,
      timings,
      shifts,
      skillsRequired,
      additionalDetails,
      status: status || 'active',
      company: user.company,
      recruiter: userId
    });

    const job = await newJob.save();
    res.status(201).json({
      msg: 'Job posted successfully',
      job
    });

  } catch (err) {
    console.error('Create Job Error:', err);
    res.status(500).json({ msg: 'Server error while posting job', error: err.message });
  }
};

// @desc    Clone a job
// @route   POST /api/jobs/:id/clone
// @access  Private (Recruiter)
const cloneJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.company) {
      return res.status(400).json({ msg: 'You must be associated with a company to clone jobs' });
    }

    const jobToClone = await Job.findById(req.params.id);
    if (!jobToClone) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Verify ownership
    if (jobToClone.recruiter.toString() !== userId && (!user.company || jobToClone.company.toString() !== user.company.toString())) {
      return res.status(403).json({ msg: 'Not authorized to clone this job' });
    }

    const newJobData = { ...jobToClone.toObject() };
    delete newJobData._id;
    delete newJobData.display_id;
    delete newJobData.createdAt;
    delete newJobData.updatedAt;
    delete newJobData.__v;
    newJobData.applicantsCount = 0;
    newJobData.status = 'draft';
    newJobData.isCloned = true;

    const newJob = new Job(newJobData);
    const savedJob = await newJob.save();

    res.status(201).json({ msg: 'Job cloned successfully', job: savedJob });
  } catch (err) {
    console.error('Clone Job Error:', err);
    res.status(500).json({ msg: 'Server error while cloning job' });
  }
};

// @desc    Get all jobs for current company
// @route   GET /api/jobs/company
// @access  Private (Recruiter)
const getCompanyJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.company) {
      return res.json([]);
    }

    const jobs = await Job.find({ company: user.company }).sort({ createdAt: -1 });
    res.json(jobs);

  } catch (err) {
    console.error('Get Company Jobs Error:', err);
    res.status(500).json({ msg: 'Server error while fetching jobs' });
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (Recruiter)
const updateJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Verify ownership
    if (job.recruiter.toString() !== userId && (!user.company || job.company.toString() !== user.company.toString())) {
      return res.status(403).json({ msg: 'Not authorized to update this job' });
    }

    // Conditional validation for updates
    const updatedStatus = req.body.status || job.status;
    if (updatedStatus !== 'draft') {
      const updatedTitle = req.body.title || job.title;
      const updatedDesc = req.body.description || job.description;
      if (!updatedTitle) return res.status(400).json({ msg: 'Job title is required for publishing' });
      if (!updatedDesc) return res.status(400).json({ msg: 'Job description is required for publishing' });
    }

    job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ msg: 'Job updated successfully', job });
  } catch (err) {
    console.error('Update Job Error:', err);
    res.status(500).json({ msg: 'Server error while updating job', error: err.message });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private (Recruiter)
const deleteJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Verify ownership
    if (job.recruiter.toString() !== userId && (!user.company || job.company.toString() !== user.company.toString())) {
      return res.status(403).json({ msg: 'Not authorized to delete this job' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Job removed successfully' });
  } catch (err) {
    console.error('Delete Job Error:', err);
    res.status(500).json({ msg: 'Server error while deleting job' });
  }
};

// @desc    Get all active jobs
// @route   GET /api/jobs
// @access  Public
const getAllJobs = async (req, res) => {
  try {
    let blockedIds = [];

    // 1. Get IDs of users blocked by Admin
    const adminBlockedUsers = await User.find({ isAdminBlocked: true }).select('_id');
    blockedIds = adminBlockedUsers.map(u => u._id);

    // 2. If user is logged in, get their personal blocked list
    if (req.user) {
      const currentUser = await User.findById(req.user.id).select('blockedEntities');
      if (currentUser && currentUser.blockedEntities) {
        blockedIds = [...new Set([...blockedIds, ...currentUser.blockedEntities.map(id => id.toString())])];
      }
    }

    // 3. Find jobs where recruiter is NOT in blockedIds and company is NOT in blockedIds
    // Note: We also check if the company exists and status is active
    const jobs = await Job.find({
      status: 'active',
      recruiter: { $nin: blockedIds },
      company: { $nin: blockedIds }
    })
      .populate('company', 'name logo location website')
      .populate({
        path: 'recruiter',
        select: 'subscription',
        populate: { path: 'subscription', select: 'hasPriorityListing' }
      })
      .sort({ createdAt: -1 });

    // Sort: priority listing recruiters first, then by date
    const prioritized = jobs.filter(j => j.recruiter?.subscription?.hasPriorityListing);
    const regular = jobs.filter(j => !j.recruiter?.subscription?.hasPriorityListing);
    const sorted = [...prioritized, ...regular];

    // Add isPriority flag
    const result = sorted.map(j => ({
      ...j.toObject(),
      isPriority: !!j.recruiter?.subscription?.hasPriorityListing
    }));

    res.json(result);
  } catch (err) {
    console.error('Get All Jobs Error:', err);
    res.status(500).json({ msg: 'Server error while fetching jobs' });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public (conditionally shows inactive jobs to admins/owners)
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('company', 'name logo location website')
      .populate('recruiter', 'name email');

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Allow viewing inactive/closed jobs if user is admin, subadmin, or the recruiter who posted it
    const isOwner = req.user && req.user.id === job.recruiter?._id?.toString();
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'subadmin');

    if (job.status !== 'active' && !isOwner && !isAdmin) {
      return res.status(404).json({ msg: 'Job is no longer active' });
    }

    res.json(job);
  } catch (err) {
    console.error('Get Job By ID Error:', err);
    res.status(500).json({ msg: 'Server error while fetching job' });
  }
};

// @desc    Get matching jobs for current seeker
// @route   GET /api/jobs/matching
// @access  Private (Jobseeker)
const getMatchingJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const { profile } = user;
    if (!profile) {
      return res.json([]); // Return empty if no profile
    }

    const { jobPreferences, skills, location, preferredRole } = profile;

    // Build the query
    let query = { status: 'active' };
    let orConditions = [];

    // 1. Match by skills (flexible regex match)
    if (skills && skills.length > 0) {
      const skillRegexes = skills.map(skill => new RegExp(skill.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
      orConditions.push({ skillsRequired: { $in: skillRegexes } });
    }

    // 2. Match by Job Titles / Preferred Role (flexible keyword match)
    const titles = [];
    if (jobPreferences?.jobTitles && jobPreferences.jobTitles.length > 0) {
      titles.push(...jobPreferences.jobTitles);
    }
    if (preferredRole) titles.push(preferredRole);
    
    if (titles.length > 0) {
      const keywords = new Set();
      titles.forEach(t => {
        t.split(/\s+/).forEach(word => {
          // Only use significant keywords
          if (word.length > 2 && !['and', 'the', 'for', 'with'].includes(word.toLowerCase())) {
            keywords.add(word);
          }
        });
      });
      
      if (keywords.size > 0) {
        const escapedKeywords = Array.from(keywords).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        orConditions.push({ title: { $regex: escapedKeywords.join('|'), $options: 'i' } });
      }
    }

    // 3. (Removed Location, Employment Type, and Work Mode from $or conditions)
    // Using them as $or conditions was causing irrelevant jobs (like Accountant) 
    // to match a Developer just because they both shared "Full-time" or "Remote".
    // A true match should be based primarily on Skills or Job Title.

    if (orConditions.length > 0) {
      query.$or = orConditions;
    } else {
        // If no preferences, return most recent active jobs as "recommendations"
        // or we could return nothing. Let's return recent jobs.
    }

    // Handle blocking
    let blockedIds = [];
    const adminBlockedUsers = await User.find({ isAdminBlocked: true }).select('_id');
    blockedIds = adminBlockedUsers.map(u => u._id);
    if (user.blockedEntities) {
      blockedIds = [...new Set([...blockedIds, ...user.blockedEntities.map(id => id.toString())])];
    }
    
    query.recruiter = { $nin: blockedIds };
    query.company = { $nin: blockedIds };

    const matchingJobs = await Job.find(query)
      .populate('company', 'name logo location website')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(matchingJobs);

  } catch (err) {
    console.error('Get Matching Jobs Error:', err);
    res.status(500).json({ msg: 'Server error while fetching matching jobs' });
  }
};

// @desc    Get company jobs with applicant counts
// @route   GET /api/jobs/company-jobs-stats
// @access  Private (Recruiter/Company)
const getCompanyJobsWithStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || !user.company) return res.json([]);

    const jobs = await Job.find({ company: user.company })
      .populate('company', 'name logo')
      .sort({ createdAt: -1 });

    const jobsWithStats = await Promise.all(jobs.map(async (job) => {
      const appCount = await Application.countDocuments({ job: job._id });
      const shortlisted = await Application.countDocuments({ job: job._id, status: 'shortlisted' });
      const rejected = await Application.countDocuments({ job: job._id, status: 'rejected' });
      return {
        ...job.toObject(),
        applicantsCount: appCount,
        shortlistedCount: shortlisted,
        rejectedCount: rejected
      };
    }));

    res.json(jobsWithStats);
  } catch (err) {
    console.error('Get Company Jobs Stats Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get hiring analytics for recruiter/company
// @route   GET /api/jobs/analytics
// @access  Private (Recruiter/Company)
const getRecruiterAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || !user.company) return res.json({ totalJobs: 0, totalApplicants: 0, shortlisted: 0, rejected: 0, activeJobs: 0, monthlyData: [] });

    const jobs = await Job.find({ company: user.company });
    const jobIds = jobs.map(j => j._id);

    const [totalApplicants, shortlisted, rejected, reviewed] = await Promise.all([
      Application.countDocuments({ job: { $in: jobIds } }),
      Application.countDocuments({ job: { $in: jobIds }, status: 'shortlisted' }),
      Application.countDocuments({ job: { $in: jobIds }, status: 'rejected' }),
      Application.countDocuments({ job: { $in: jobIds }, status: 'reviewed' }),
    ]);

    const activeJobs = jobs.filter(j => j.status === 'active').length;

    // Monthly breakdown for the last 12 months
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = await Application.countDocuments({ job: { $in: jobIds }, createdAt: { $gte: start, $lte: end } });
      monthlyData.push({ month: start.toLocaleString('default', { month: 'short' }), count });
    }

    res.json({ totalJobs: jobs.length, activeJobs, totalApplicants, shortlisted, rejected, reviewed, monthlyData });
  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Search candidates (jobseekers) with daily limit enforcement
// @route   GET /api/jobs/candidates/search
// @access  Private (Recruiter/Company)
const searchCandidates = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const plan = user.subscription;
    const limit = plan?.candidateSearchPerDay || 0;

    // Reset daily counter if date has changed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastSearchDate = user.searchUsedDate ? new Date(user.searchUsedDate) : null;
    if (lastSearchDate) lastSearchDate.setHours(0, 0, 0, 0);

    if (!lastSearchDate || lastSearchDate < today) {
      user.searchUsed = 0;
      user.searchUsedDate = new Date();
    }

    if (limit > 0 && user.searchUsed >= limit) {
      return res.status(403).json({
        msg: `Daily search limit reached. Your plan allows ${limit} candidate profile views per day. Resets at midnight.`,
        requiresUpgrade: true,
        limit,
        used: user.searchUsed
      });
    }

    const { 
      q = '', qReq = 'false', 
      skills = '', skillsReq = 'false', 
      location = '', locationReq = 'false', 
      degree = '', degreeReq = 'false', 
      experienceRole = '', experienceRoleReq = 'false', 
      page = 1 
    } = req.query;
    
    const perPage = 20;
    const skip = (parseInt(page) - 1) * perPage;

    const query = { 'role': { $exists: true } };
    const compulsory = [];
    const optional = [];

    if (q) {
      const cond = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { 'profile.headline': { $regex: q, $options: 'i' } },
          { 'profile.preferredRole': { $regex: q, $options: 'i' } },
          { 'profile.experience.company': { $regex: q, $options: 'i' } },
          { 'profile.experience.role': { $regex: q, $options: 'i' } },
          { 'profile.qualification.degree': { $regex: q, $options: 'i' } },
          { 'profile.qualification.institution': { $regex: q, $options: 'i' } }
        ]
      };
      if (qReq === 'true') compulsory.push(cond); else optional.push(cond);
    }
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
      const cond = { 'profile.skills': { $all: skillList.map(s => new RegExp(s, 'i')) } };
      if (skillsReq === 'true') compulsory.push(cond); else optional.push(cond);
    }
    if (location) {
      const cond = { 'profile.location': { $regex: location, $options: 'i' } };
      if (locationReq === 'true') compulsory.push(cond); else optional.push(cond);
    }
    if (degree) {
      const cond = { 'profile.qualification.degree': { $regex: degree, $options: 'i' } };
      if (degreeReq === 'true') compulsory.push(cond); else optional.push(cond);
    }
    if (experienceRole) {
      const cond = { 'profile.experience.role': { $regex: experienceRole, $options: 'i' } };
      if (experienceRoleReq === 'true') compulsory.push(cond); else optional.push(cond);
    }

    const finalAnd = [];
    if (compulsory.length > 0) {
      finalAnd.push(...compulsory);
    }
    if (optional.length > 0) {
      finalAnd.push({ $or: optional });
    }

    if (finalAnd.length > 0) query.$and = finalAnd;

    // Only search jobseekers
    const Role = require('../models/Role');
    const seekerRole = await Role.findOne({ name: 'jobseeker' });
    if (seekerRole) query.role = seekerRole._id;

    const candidates = await User.find(query)
      .select('name avatar profile.headline profile.skills profile.location profile.preferredRole profile.experience profile.qualification')
      .skip(skip)
      .limit(perPage)
      .lean();

    const total = await User.countDocuments(query);

    res.json({ candidates, total, limit, used: user.searchUsed, remaining: limit === 0 ? null : limit - user.searchUsed });
  } catch (err) {
    console.error('Search Candidates Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    View a candidate profile (counts as one search)
// @route   GET /api/jobs/candidates/:candidateId/profile
// @access  Private (Recruiter/Company)
const viewCandidateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const plan = user.subscription;
    const limit = plan?.candidateSearchPerDay || 0;

    // Reset daily counter if date has changed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastSearchDate = user.searchUsedDate ? new Date(user.searchUsedDate) : null;
    if (lastSearchDate) lastSearchDate.setHours(0, 0, 0, 0);

    if (!lastSearchDate || lastSearchDate < today) {
      user.searchUsed = 0;
      user.searchUsedDate = new Date();
    }

    if (limit > 0 && user.searchUsed >= limit) {
      return res.status(403).json({
        msg: `Daily search limit reached. Your plan allows ${limit} candidate profile views per day.`,
        requiresUpgrade: true,
        limit,
        used: user.searchUsed
      });
    }

    const candidate = await User.findById(req.params.candidateId)
      .select('name avatar email profile recruiterProfile')
      .lean();

    if (!candidate) return res.status(404).json({ msg: 'Candidate not found' });

    // Increment search count
    user.searchUsed = (user.searchUsed || 0) + 1;
    user.searchUsedDate = new Date();
    await user.save();

    res.json({ candidate, used: user.searchUsed, limit, remaining: limit === 0 ? null : limit - user.searchUsed });
  } catch (err) {
    console.error('View Candidate Profile Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    AI candidate matching for a job
// @route   GET /api/jobs/:jobId/matched-candidates
// @access  Private (Recruiter/Company)
const getAICandidateMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const plan = user.subscription;
    if (!plan?.hasAICandidateMatching) {
      return res.status(403).json({ msg: 'AI candidate matching requires a paid plan.', requiresUpgrade: true });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    // Fetch jobseekers who applied for this job
    const applications = await Application.find({ job: job._id })
      .populate({
        path: 'applicant',
        select: 'name avatar profile'
      });

    const jobSkills = (job.skillsRequired || []).map(s => s.toLowerCase());
    const jobLocation = (job.location || '').toLowerCase();
    const jobType = (job.jobType || '').toLowerCase();
    const jobWorkMode = (job.workMode || '').toLowerCase();
    const jobExperience = job.experience || '';

    const scored = applications.map(app => {
      const candidate = app.applicant;
      if (!candidate) return null;

      const profile = candidate.profile || {};
      const candidateSkills = (profile.skills || []).map(s => s.toLowerCase());
      const candidateLocation = (profile.location || '').toLowerCase();

      let score = 0;
      const breakdown = {};

      // Skills match (up to 50 points)
      if (jobSkills.length > 0) {
        const matchedSkills = jobSkills.filter(s => candidateSkills.includes(s));
        const skillScore = Math.round((matchedSkills.length / jobSkills.length) * 50);
        score += skillScore;
        breakdown.skills = { matched: matchedSkills, total: jobSkills.length, score: skillScore };
      }

      // Location match (20 points)
      if (jobLocation && candidateLocation) {
        const locationMatch = candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation);
        if (locationMatch) { score += 20; breakdown.location = true; }
        else breakdown.location = false;
      }

      // Work mode match (15 points)
      const candidatePrefs = profile.jobPreferences || {};
      if (jobWorkMode && candidatePrefs.locationTypes) {
        const modeMatch = candidatePrefs.locationTypes.some(m => m.toLowerCase() === jobWorkMode);
        if (modeMatch) { score += 15; breakdown.workMode = true; }
        else breakdown.workMode = false;
      }

      // Job type match (15 points)
      if (jobType && candidatePrefs.employmentTypes) {
        const typeMatch = candidatePrefs.employmentTypes.some(t => t.toLowerCase() === jobType);
        if (typeMatch) { score += 15; breakdown.jobType = true; }
        else breakdown.jobType = false;
      }

      return {
        applicationId: app._id,
        applicationStatus: app.status,
        candidate: {
          _id: candidate._id,
          name: candidate.name,
          avatar: candidate.avatar,
          headline: profile.headline,
          skills: profile.skills,
          location: profile.location,
          experience: profile.experience,
          qualification: profile.qualification
        },
        matchScore: Math.min(score, 100),
        breakdown
      };
    }).filter(Boolean).sort((a, b) => b.matchScore - a.matchScore);

    res.json({ job: { title: job.title, skillsRequired: job.skillsRequired }, matches: scored });
  } catch (err) {
    console.error('AI Match Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get job posting quota for current recruiter
// @route   GET /api/jobs/quota
// @access  Private (Recruiter/Company)
const getJobQuota = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('subscription');
    if (!user || !user.company) return res.json({ limit: 0, used: 0 });

    const plan = user.subscription;
    const limit = plan?.activeJobPostings || 0;
    const used = await Job.countDocuments({ company: user.company, status: { $in: ['active', 'closed'] } });

    res.json({ limit, used, unlimited: limit === 0 });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Calculate match score before applying
// @route   GET /api/jobs/:jobId/pre-match
// @access  Private (Jobseeker)
const calculatePreMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    const candidate = await User.findById(userId);
    const job = await Job.findById(jobId);

    if (!candidate || !job) {
      return res.status(404).json({ msg: 'Candidate or Job not found' });
    }

    const candidateProfile = {
      name: candidate.name || 'Unknown Candidate',
      skills: candidate.profile?.skills || [],
      experience: candidate.profile?.experience || [],
      education: candidate.profile?.education || [],
      headline: candidate.profile?.headline || '',
    };

    const jobRequirement = {
      title: job.title,
      description: job.description,
      skillsRequired: job.skillsRequired || [],
      experienceLevel: job.experienceLevel || '',
      jobType: job.jobType || ''
    };

    const prompt = `
      You are an expert HR recruitment AI. Analyze the match compatibility between the candidate profile and the job description provided below.
      
      Candidate Profile:
      ${JSON.stringify(candidateProfile)}
      
      Job Description:
      ${JSON.stringify(jobRequirement)}
      
      Provide a match analysis in JSON format containing ONLY these exactly named keys:
      1. "matchPercentage": A number between 0 and 100.
      2. "matchedSkills": Array of strings of skills the candidate has that match the job.
      3. "missingSkills": Array of strings of critical skills the job requires but the candidate lacks.
      4. "verdict": A short summary justifying the score.
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
    const responseText = resultObj.response.text();
    const result = JSON.parse(responseText);

    res.json({ matchAnalysis: result });
  } catch (err) {
    console.error('Pre-Match Calculation Error:', err);
    if (err.status === 503) {
      return res.status(503).json({ msg: 'AI service is currently experiencing high demand. Please try again in a few moments.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ msg: 'AI service quota exceeded or rate limited. Please try again later.' });
    }
    res.status(500).json({ msg: 'Failed to process match analysis' });
  }
};

module.exports = {
  createJob,
  getCompanyJobs,
  getCompanyJobsWithStats,
  updateJob,
  deleteJob,
  getAllJobs,
  getJobById,
  getMatchingJobs,
  getRecruiterAnalytics,
  searchCandidates,
  viewCandidateProfile,
  getAICandidateMatches,
  getJobQuota,
  calculatePreMatch,
  cloneJob
};
