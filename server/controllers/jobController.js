const Job = require('../models/Job');
const User = require('../models/User');

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Recruiter)
const createJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || !user.company) {
      return res.status(400).json({ msg: 'You must be associated with a company to post jobs' });
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
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error('Get All Jobs Error:', err);
    res.status(500).json({ msg: 'Server error while fetching jobs' });
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

    // 1. Match by skills
    if (skills && skills.length > 0) {
      orConditions.push({ skillsRequired: { $in: skills } });
    }

    // 2. Match by Job Titles / Preferred Role
    const titles = [];
    if (jobPreferences?.jobTitles && jobPreferences.jobTitles.length > 0) {
      titles.push(...jobPreferences.jobTitles);
    }
    if (preferredRole) titles.push(preferredRole);
    
    if (titles.length > 0) {
      // Escape special characters for regex
      const escapedTitles = titles.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      orConditions.push({ title: { $regex: escapedTitles.join('|'), $options: 'i' } });
    }

    // 3. Match by Location
    const locations = [];
    if (location) locations.push(location);
    if (jobPreferences?.onSiteLocations && jobPreferences.onSiteLocations.length > 0) {
      jobPreferences.onSiteLocations.forEach(loc => {
        if (loc.city) locations.push(loc.city);
      });
    }
    
    if (locations.length > 0) {
      const escapedLocations = locations.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      orConditions.push({ location: { $regex: escapedLocations.join('|'), $options: 'i' } });
    }

    // 4. Match by Employment Type
    if (jobPreferences?.employmentTypes && jobPreferences.employmentTypes.length > 0) {
      orConditions.push({ jobType: { $in: jobPreferences.employmentTypes } });
    }

    // 5. Match by Work Mode
    if (jobPreferences?.locationTypes && jobPreferences.locationTypes.length > 0) {
      orConditions.push({ workMode: { $in: jobPreferences.locationTypes } });
    }

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

module.exports = {
  createJob,
  getCompanyJobs,
  updateJob,
  deleteJob,
  getAllJobs,
  getMatchingJobs
};

