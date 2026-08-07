const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const Role = require('../models/Role');
const { getEffectivePlanLimit } = require('../utils/getEffectivePlanLimit');
const { logTeamActivity } = require('../utils/teamActivityLog');
const { parse } = require('csv-parse/sync');
const crypto = require('crypto');

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Recruiter)
const createJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('subscription').populate('role');

    const { postedAs } = req.body;
    const finalPostedAs = postedAs || (user?.company ? 'company' : 'recruiter');

    if (['company', 'both'].includes(finalPostedAs) && (!user || !user.company)) {
      return res.status(400).json({ msg: 'You must be associated with a company to post jobs as a company' });
    }

    // Enforce job posting limit
    const roleName = user.role?.name || 'recruiter';

    // 1. Get limit from active plan (falls back to Free plan if paid plan expired)
    const planLimit = await getEffectivePlanLimit(user, roleName);

    // 2. Add limits from Pay-Per-Feature add-ons
    let payPerLimit = 0;
    if (Array.isArray(user.purchasedFeatures)) {
      user.purchasedFeatures.forEach(f => {
        if (f.isActive && f.featureKey === 'activeJobPostings' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > new Date())) {
          payPerLimit += f.usageLeft;
        }
      });
    }

    const isUnlimited = planLimit === 0;
    const totalAllowed = planLimit + payPerLimit;

    if (!isUnlimited && totalAllowed <= 0) {
      return res.status(403).json({
        msg: "You don't have active plan to post the job. Please purchase a plan or add-on.",
        requiresUpgrade: true,
        limit: 0,
        used: 0
      });
    }

    let activeCountQuery = { status: { $in: ['active', 'closed'] } };
    if (user.role && user.role.name === 'recruiter') {
      activeCountQuery.recruiter = userId;
    } else if (user.company) {
      activeCountQuery.company = user.company;
    }

    const activeCount = await Job.countDocuments(activeCountQuery);

    if (!isUnlimited && activeCount >= totalAllowed) {
      return res.status(403).json({
        msg: `Job posting limit reached. Your allowed limit is ${totalAllowed} job postings. Please upgrade your plan or purchase an add-on to post more.`,
        requiresUpgrade: true,
        limit: totalAllowed,
        used: activeCount
      });
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
      postedAs: finalPostedAs,
      company: user.company || undefined,
      recruiter: userId
    });

    const job = await newJob.save();

    logTeamActivity({
      actor: { _id: user._id, name: user.name, company: user.company, role: user.role?.name },
      action: 'job_posted',
      description: `Posted a new job: ${job.title}`,
      entity: job._id,
      entityModel: 'Job'
    });

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

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const jobToClone = await Job.findById(req.params.id);
    if (!jobToClone) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Verify ownership
    if (jobToClone.recruiter.toString() !== userId && (!user.company || !jobToClone.company || jobToClone.company.toString() !== user.company.toString())) {
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

    if (!user) return res.json([]);

    let query = { recruiter: userId };
    if (user.company) {
      query = { $or: [{ company: user.company }, { recruiter: userId }] };
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });
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
    if (job.recruiter.toString() !== userId && (!user.company || !job.company || job.company.toString() !== user.company.toString())) {
      return res.status(403).json({ msg: 'Not authorized to update this job' });
    }

    // Conditional validation for updates
    const updatedStatus = req.body.status || job.status;
    
    // Check limit if moving from draft/inactive to active/closed
    const currentIsCounting = ['active', 'closed'].includes(job.status);
    const newIsCounting = ['active', 'closed'].includes(updatedStatus);

    if (!currentIsCounting && newIsCounting) {
      const fullUser = await User.findById(userId).populate('subscription').populate('role');
      const fullRoleName = fullUser.role?.name || 'recruiter';
      const planLimit = await getEffectivePlanLimit(fullUser, fullRoleName);
      let payPerLimit = 0;
      if (Array.isArray(fullUser.purchasedFeatures)) {
        fullUser.purchasedFeatures.forEach(f => {
          if (f.isActive && f.featureKey === 'activeJobPostings' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > new Date())) {
            payPerLimit += f.usageLeft;
          }
        });
      }
      const totalAllowed = planLimit + payPerLimit;

      let activeCountQuery = { company: fullUser.company, status: { $in: ['active', 'closed'] } };
      if (fullUser.role && fullUser.role.name === 'recruiter') {
        activeCountQuery.recruiter = userId;
      }
      const activeCount = await Job.countDocuments(activeCountQuery);

      if (activeCount >= totalAllowed) {
        return res.status(403).json({
          msg: `Job posting limit reached. Your allowed limit is ${totalAllowed} job postings. Please upgrade your plan or purchase an add-on to post more.`,
          requiresUpgrade: true,
          limit: totalAllowed,
          used: activeCount
        });
      }
    }

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
    if (job.recruiter.toString() !== userId && (!user.company || !job.company || job.company.toString() !== user.company.toString())) {
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
      $or: [
        { company: null },
        { company: { $exists: false } },
        { company: { $nin: blockedIds } }
      ]
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

    if (user.hiddenJobs && user.hiddenJobs.length > 0) {
      query._id = { $nin: user.hiddenJobs };
    }

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
    if (!user) return res.json([]);

    let query = { recruiter: userId };
    if (user.company) {
      query = { $or: [{ company: user.company }, { recruiter: userId }] };
    }

    const jobs = await Job.find(query)
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
    if (!user) return res.json({ totalJobs: 0, totalApplicants: 0, shortlisted: 0, rejected: 0, activeJobs: 0, monthlyData: [] });

    let query = { recruiter: userId };
    if (user.company) {
      query = { $or: [{ company: user.company }, { recruiter: userId }] };
    }

    const jobs = await Job.find(query);
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

    const candidatesData = await User.find(query)
      .select('name avatar profile.headline profile.skills profile.location profile.preferredRole profile.experience profile.qualification subscription purchasedFeatures priorityApplicationsUsed')
      .populate('subscription')
      .skip(skip)
      .limit(perPage)
      .lean();

    const checkPriorityBadge = require('../utils/checkPriorityBadge');

    const candidates = candidatesData.map(c => {
      const isPriority = checkPriorityBadge(c);
      delete c.subscription;
      delete c.purchasedFeatures;
      delete c.priorityApplicationsUsed;
      return { ...c, isPriority };
    });

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

    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    // Check if AI Matching has already been run for this job
    const isAlreadyMatched = (user.aiMatchedJobs || []).some(id => id.toString() === jobId);

    if (!isAlreadyMatched) {
      // 1. Check if the user has an active subscription that enables AI Candidate Matching
      const plan = user.subscription;
      const isPlanValid = plan && (plan.price === 0 || plan.duration === 'Lifetime' || !user.subscriptionExpiry || new Date(user.subscriptionExpiry) > new Date());
      
      let hasPlanAccess = false;
      let isPlanUnlimited = false;
      let planLimit = 0;

      if (isPlanValid) {
        if (plan.hasAICandidateMatching === true) {
          hasPlanAccess = true;
          const dynamicFeature = plan.features?.find(f => 
            f.isActive && 
            ['ai candidate matching', 'ai candidate matching', 'ai matching'].includes(f.name?.toLowerCase())
          );
          if (!dynamicFeature || !dynamicFeature.value || dynamicFeature.value === 'unlimited' || Number(dynamicFeature.value) === 0) {
            isPlanUnlimited = true;
          } else {
            planLimit = Number(dynamicFeature.value) || 0;
          }
        }
      }

      let authorized = false;

      if (hasPlanAccess) {
        if (isPlanUnlimited) {
          authorized = true;
        } else {
          // Check if unique jobs matched is less than limit
          const uniqueJobsCount = user.aiMatchedJobs ? user.aiMatchedJobs.length : 0;
          if (uniqueJobsCount < planLimit) {
            authorized = true;
          }
        }
      }

      if (authorized) {
        // Enrolling this job into matched list
        if (!user.aiMatchedJobs) user.aiMatchedJobs = [];
        user.aiMatchedJobs.push(jobId);
        await user.save();
      } else {
        // 2. Check purchasedFeatures (Pay-per-feature credit)
        const now = new Date();
        const purchasedMatch = user.purchasedFeatures.find(f => 
          f.featureKey === 'hasAICandidateMatching' && 
          f.isActive && 
          f.usageLeft > 0 && 
          (!f.expiresAt || new Date(f.expiresAt) > now)
        );

        if (purchasedMatch) {
          // Decrement usage credit
          purchasedMatch.usageLeft -= 1;
          if (purchasedMatch.usageLeft <= 0) {
            purchasedMatch.isActive = false;
          }
          if (!user.aiMatchedJobs) user.aiMatchedJobs = [];
          user.aiMatchedJobs.push(jobId);
          // Mark modified because it is a subdocument inside an array
          user.markModified('purchasedFeatures');
          await user.save();
        } else {
          return res.status(403).json({ 
            msg: 'You do not have any active AI Candidate Matching credits left. Please upgrade your plan or purchase more credits.', 
            requiresUpgrade: true 
          });
        }
      }
    }

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
    const user = await User.findById(userId).populate('subscription').populate('role');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const roleName = user.role?.name || 'recruiter';
    const planLimit = await getEffectivePlanLimit(user, roleName);

    let payPerLimit = 0;
    if (Array.isArray(user.purchasedFeatures)) {
      user.purchasedFeatures.forEach(f => {
        if (f.isActive && f.featureKey === 'activeJobPostings' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > new Date())) {
          payPerLimit += f.usageLeft;
        }
      });
    }

    const isUnlimited = planLimit === 0;
    const totalLimit = planLimit + payPerLimit;

    let activeCountQuery = { status: { $in: ['active', 'closed'] } };
    if (user.role && user.role.name === 'recruiter') {
      activeCountQuery.recruiter = userId;
    } else if (user.company) {
      activeCountQuery.company = user.company;
    }

    const used = await Job.countDocuments(activeCountQuery);

    res.json({ limit: totalLimit, planLimit, payPerLimit, used, unlimited: isUnlimited });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

const { GoogleGenerativeAI } = require('../utils/aiHelper');

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

    const genAI = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const resultObj = await model.generateContent(prompt);
    let responseText = resultObj.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
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

// @desc    Import Pipeline from CSV
// @route   POST /api/jobs/import-pipeline
// @access  Private (Recruiter/Company)
const importPipeline = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('subscription');
    
    if (!req.file) return res.status(400).json({ msg: 'CSV file required' });

    // Enforce Plan Limits
    let limit = 0;
    if (user.subscription && user.subscription.features) {
      const feature = user.subscription.features.find(f => 
        f.name.toLowerCase().includes('bulk applicantion') || 
        f.name.toLowerCase().includes('bulk application')
      );
      if (feature && feature.isActive) {
        limit = parseInt(feature.value) || 0;
      }
    }

    const csvData = req.file.buffer.toString();
    const records = parse(csvData, { columns: true, skip_empty_lines: true, trim: true });

    if (limit > 0 && records.length > limit) {
      return res.status(400).json({ msg: `Your plan allows a maximum of ${limit} candidates per bulk import. Your file has ${records.length} candidates.` });
    }

    let job;
    if (req.body.jobId && req.body.jobId !== 'new') {
      job = await Job.findById(req.body.jobId);
      if (!job) return res.status(404).json({ msg: 'Selected job pipeline not found' });
      // Ensure authorization
      if (job.recruiter.toString() !== userId && job.company?.toString() !== user.company?.toString()) {
        return res.status(403).json({ msg: 'Not authorized to import into this pipeline' });
      }
    } else {
      const roleName = req.body.role || 'Imported Role';
      // Create Dummy Job
      job = new Job({
        title: roleName,
        description: 'Imported via CSV Pipeline',
        skillsRequired: [],
        experienceLevel: 'Entry',
        jobType: 'Full-time',
        workMode: 'On-site',
        vacancies: 1,
        salary: { min: 0, max: 0, isRangeHidden: true },
        experience: { min: 0, max: 0 },
        location: 'Various',
        applicationQuestions: [],
        additionalDetails: [],
        recruiter: userId,
        company: user.company || undefined,
        postedAs: user.company ? 'company' : 'recruiter',
        status: 'active'
      });
      await job.save();
    }

    let defaultRole = await Role.findOne({ name: 'jobseeker' });

    // Process each record
    for (const record of records) {
      const email = record.email || record.Email || `imported_${crypto.randomBytes(4).toString('hex')}@example.com`;
      const name = record.name || record.Name || record.Candidate || 'Imported Candidate';
      const statusRaw = (record.status || record.Status || 'pending').toLowerCase();
      let status = 'pending';
      if (statusRaw.includes('screen') || statusRaw.includes('review')) status = 'reviewed';
      if (statusRaw.includes('interview') || statusRaw.includes('shortlist')) status = 'shortlisted';
      if (statusRaw.includes('offer') || statusRaw.includes('hire') || statusRaw.includes('accept')) status = 'accepted';
      if (statusRaw.includes('reject')) status = 'rejected';

      // Find or create a dummy user
      let applicantUser = await User.findOne({ email });
      if (!applicantUser) {
        applicantUser = new User({
          name,
          email,
          password: crypto.randomBytes(16).toString('hex'),
          role: defaultRole ? defaultRole._id : null,
          profile: { headline: record.headline || record.Headline || record.role || record.Role || 'Imported Candidate' }
        });
        await applicantUser.save();
      }
      
      const app = new Application({
        job: job._id,
        applicant: applicantUser._id,
        display_id: 'IMP-' + Math.floor(1000 + Math.random() * 9000),
        status,
        answers: [],
        resumeUrl: ''
      });
      await app.save();
    }
    
    // Return job with accurate stats
    const totalApplicants = await Application.countDocuments({ job: job._id });
    res.json({ job: { ...job.toObject(), applicantsCount: totalApplicants } });
  } catch (err) {
    console.error('Import Pipeline Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Generate AI match for all applications in a job pipeline
// @route   POST /api/jobs/:jobId/bulk-ai-match
// @access  Private (Recruiter/Company)
const bulkAiMatch = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;
    
    // Authorization
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    const user = await User.findById(userId);
    if (job.recruiter.toString() !== userId && job.company?.toString() !== user.company?.toString()) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const applications = await Application.find({ job: jobId }).populate('applicant');
    const appsToProcess = applications.filter(app => !app.matchAnalysis || app.matchAnalysis.matchPercentage == null);
    
    if (appsToProcess.length === 0) {
      return res.json({ msg: 'All applications already have AI match scores.' });
    }
    
    res.json({ msg: `AI bulk match processing started for ${appsToProcess.length} candidates. It may take a few moments. Refresh the page soon to see the updated scores.` });

    const genAI = new GoogleGenerativeAI(process.env.OPENROUTER_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    });

    const delay = ms => new Promise(res => setTimeout(res, ms));
    
    const jobRequirement = {
      title: job.title,
      description: job.description,
      skillsRequired: job.skillsRequired || [],
      experienceLevel: job.experienceLevel || '',
      jobType: job.jobType || ''
    };

    // Background processing
    (async () => {
       for (let i = 0; i < appsToProcess.length; i++) {
         const app = appsToProcess[i];
         if (!app.applicant) continue;
         const candidate = app.applicant;
         const candidateProfile = {
           name: candidate.name || 'Unknown Candidate',
           skills: candidate.profile?.skills || [],
           experience: candidate.profile?.experience || [],
           education: candidate.profile?.education || [],
           headline: candidate.profile?.headline || '',
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
          try {
             const resultObj = await model.generateContent(prompt);
             let responseText = resultObj.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
             const result = JSON.parse(responseText);
             app.matchAnalysis = {
               matchPercentage: result.matchPercentage || 0,
               matchedSkills: result.matchedSkills || [],
               missingSkills: result.missingSkills || [],
               verdict: result.verdict || '',
               lastCalculated: new Date()
             };
             await app.save();
             await delay(1000); // 1 sec delay to avoid rate limiting
          } catch(err) {
             console.error('Bulk Match Error:', err);
             await delay(2000);
          }
       }
    })();

  } catch (err) {
    if (!res.headersSent) res.status(500).json({ msg: 'Server error' });
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
  cloneJob,
  importPipeline,
  bulkAiMatch
};
