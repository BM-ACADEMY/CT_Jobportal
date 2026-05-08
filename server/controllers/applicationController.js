const Application = require('../models/Application');
const Job = require('../models/Job');

exports.applyJob = async (req, res) => {
  try {
    const { jobId, answers } = req.body;
    const applicantId = req.user.id;

    // Check if already applied
    const existingApplication = await Application.findOne({ job: jobId, applicant: applicantId });
    if (existingApplication) {
      return res.status(400).json({ msg: 'You have already applied for this job' });
    }

    const application = new Application({
      job: jobId,
      applicant: applicantId,
      answers
    });

    await application.save();

    // Increment applicants count in Job model
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    res.status(201).json({ msg: 'Application submitted successfully', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Check if the job belongs to the recruiter/company
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });
    
    // For now, allow recruiters to see their own job applicants
    // In a more complex setup, we'd check req.user.id === job.recruiter
    
    const applicants = await Application.find({ job: jobId })
      .populate('applicant', 'name email profileImage profile')
      .sort({ createdAt: -1 });

    res.json(applicants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await Application.findByIdAndUpdate(id, { status }, { new: true });
    if (!application) return res.status(404).json({ msg: 'Application not found' });

    res.json({ msg: `Application marked as ${status}`, application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.trackDownload = async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    
    const user = await User.findById(userId).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const limit = user.subscription?.applicationDownloadLimit || 0;
    const used = user.downloadsUsed || 0;

    if (limit > 0 && used >= limit) {
      return res.status(403).json({ 
        msg: `Download limit reached! Your plan allows only ${limit} downloads.`,
        requiresUpgrade: true 
      });
    }

    // Increment downloadsUsed
    user.downloadsUsed = used + 1;
    await user.save();

    res.json({ msg: 'Download authorized', downloadsUsed: user.downloadsUsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
