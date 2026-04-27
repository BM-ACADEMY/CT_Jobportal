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
      return res.status(400).json({ msg: 'No company association found' });
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

module.exports = {
  createJob,
  getCompanyJobs,
  updateJob,
  deleteJob
};
