const Application = require('../models/Application');
const Job = require('../models/Job');
const sendEmail = require('../utils/sendEmail');
const { emailWrapper } = require('../utils/emailTemplates');
const { sendWhatsAppTemplate, getUserPhone } = require('../utils/whatsapp');

const FRONTEND_URL = process.env.FRONTEND_URL;

const STATUS_LABELS = {
  pending: 'Pending Review',
  reviewed: 'Reviewed',
  shortlisted: 'Shortlisted',
  rejected: 'Not Selected',
  accepted: 'Offer Extended',
  withdrawn: 'Withdrawn'
};

exports.getMyApplications = async (req, res) => {
  try {
    const applicantId = req.user.id;
    const applications = await Application.find({ applicant: applicantId })
      .populate({
        path: 'job',
        select: 'title location jobType workMode salary status createdAt',
        populate: { path: 'company', select: 'name logo' }
      })
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.applyJob = async (req, res) => {
  try {
    const { jobId, answers } = req.body;
    const applicantId = req.user.id;
    const User = require('../models/User');

    // Check if already applied
    let existingApplication = await Application.findOne({ job: jobId, applicant: applicantId });
    if (existingApplication) {
      if (existingApplication.status === 'withdrawn') {
        // Reactivate withdrawn application
        existingApplication.status = 'pending';
        existingApplication.answers = answers;
        existingApplication.createdAt = Date.now();
        await existingApplication.save();
        
        await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });
        
        return res.status(200).json({ msg: 'Application re-submitted successfully', application: existingApplication });
      }
      return res.status(400).json({ msg: 'You have already applied for this job' });
    }

    const user = await User.findById(applicantId).populate('subscription');
    
    let isPriority = false;
    let limit = 0;
    let source = null;
    let payPerFeatureIndex = -1;

    const plan = user.subscription;
    
    if (plan && plan.hasPriorityBadge) {
      isPriority = true;
      source = 'plan';
      limit = 0;
    } else if (plan && Array.isArray(plan.features)) {
      const dynamicFeature = plan.features.find(f => f.isActive && (f.name?.toLowerCase() === 'priority badge' || f.name?.toLowerCase() === 'priority application badge'));
      if (dynamicFeature) {
        isPriority = true;
        source = 'plan';
        limit = parseInt(dynamicFeature.value) || 0;
      }
    }

    if (source === 'plan' && limit > 0) {
      if ((user.priorityApplicationsUsed || 0) >= limit) {
        isPriority = false;
      }
    }

    if (!isPriority && Array.isArray(user.purchasedFeatures)) {
      const ppFeatureIndex = user.purchasedFeatures.findIndex(f => 
        f.isActive && 
        f.featureKey === 'hasPriorityBadge' && 
        f.usageLeft > 0 && 
        (!f.expiresAt || new Date(f.expiresAt) > new Date())
      );
      
      if (ppFeatureIndex !== -1) {
        isPriority = true;
        source = 'payper';
        payPerFeatureIndex = ppFeatureIndex;
      }
    }

    const application = new Application({
      job: jobId,
      applicant: applicantId,
      answers,
      isPriority
    });

    await application.save();

    if (isPriority) {
      if (source === 'plan' && limit > 0) {
        user.priorityApplicationsUsed = (user.priorityApplicationsUsed || 0) + 1;
      } else if (source === 'payper' && payPerFeatureIndex !== -1) {
        user.purchasedFeatures[payPerFeatureIndex].usageLeft -= 1;
        if (user.purchasedFeatures[payPerFeatureIndex].usageLeft <= 0) {
          user.purchasedFeatures[payPerFeatureIndex].isActive = false;
        }
      }
      await user.save();
    }

    // Increment applicants count in Job model
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    if (isPriority) {
      const jobWithRecruiter = await Job.findById(jobId).select('title recruiter').populate('recruiter', 'name email recruiterProfile.phone companyProfile.phone');
      if (jobWithRecruiter?.recruiter?.email) {
        sendEmail({
          email: jobWithRecruiter.recruiter.email,
          subject: `High-Priority Application — ${jobWithRecruiter.title}`,
          html: emailWrapper('New High-Priority Application', `
            <p>Hi ${jobWithRecruiter.recruiter.name || 'there'},</p>
            <p><strong>${user.name || 'A candidate'}</strong> just applied to <strong>${jobWithRecruiter.title}</strong> using a Priority Application badge — this application is flagged for your immediate attention.</p>
            <p><a href="${FRONTEND_URL}/company/jobs" style="color:#059669;">Review applicants</a></p>
          `)
        }).catch(() => {});
      }
      const recruiterPhone = getUserPhone(jobWithRecruiter?.recruiter);
      if (recruiterPhone) {
        sendWhatsAppTemplate({
          to: recruiterPhone,
          template: 'application_resume_unlockalert',
          params: [
            jobWithRecruiter.recruiter.name || 'there',
            '1',
            jobWithRecruiter.title,
            '0',
            `${FRONTEND_URL}/company/jobs`
          ]
        }).catch(() => {});
      }
    }

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
    const { status, isPriority } = req.body;

    const existing = await Application.findById(id).select('status');
    if (!existing) return res.status(404).json({ msg: 'Application not found' });
    const statusChanged = status !== undefined && status !== existing.status;

    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (isPriority !== undefined) updateFields.isPriority = isPriority;

    const application = await Application.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).populate('applicant', 'name email profileImage profile').populate({ path: 'job', select: 'title company', populate: { path: 'company', select: 'name' } });

    if (!application) return res.status(404).json({ msg: 'Application not found' });

    if (statusChanged && status !== 'withdrawn' && application.applicant?.email) {
      const label = STATUS_LABELS[status] || status;
      sendEmail({
        email: application.applicant.email,
        subject: `Your application for ${application.job?.title || 'a job'} — ${label}`,
        html: emailWrapper('Application Status Update', `
          <p>Hi ${application.applicant.name || 'there'},</p>
          <p>Your application for <strong>${application.job?.title || 'the role'}</strong> has been updated to:</p>
          <p style="font-size:18px;font-weight:800;color:#059669;">${label}</p>
          ${status === 'accepted' ? '<p>Congratulations! The recruiter will be in touch with next steps.</p>' : ''}
          <p><a href="${FRONTEND_URL}/jobseeker/applications" style="color:#059669;">View your applications</a></p>
        `)
      }).catch(() => {});
    }

    const applicantPhone = getUserPhone(application.applicant);
    if (statusChanged && status !== 'withdrawn' && applicantPhone) {
      const label = STATUS_LABELS[status] || status;
      const companyName = application.job?.company?.name || 'the company';
      const link = `${FRONTEND_URL}/jobseeker/applications`;
      if (status === 'accepted') {
        sendWhatsAppTemplate({
          to: applicantPhone,
          template: 'offer_letter_document_delivery',
          params: [application.applicant.name || 'there', companyName, 'Offer Letter', link]
        }).catch(() => {});
      } else {
        sendWhatsAppTemplate({
          to: applicantPhone,
          template: 'job_application_status_update',
          params: [application.applicant.name || 'there', application.job?.title || 'the role', companyName, label, link]
        }).catch(() => {});
      }
    }

    res.json({ msg: 'Application updated successfully', application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.revokeApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, applicant: req.user.id });
    if (!application) return res.status(404).json({ msg: 'Application not found' });

    const revocable = ['pending', 'reviewed'];
    if (!revocable.includes(application.status)) {
      return res.status(400).json({ msg: `Applications with status "${application.status}" cannot be revoked` });
    }

    application.status = 'withdrawn';
    await application.save();

    await Job.findByIdAndUpdate(application.job, { $inc: { applicantsCount: -1 } });

    res.json({ msg: 'Application revoked successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.exportApplicants = async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    const user = await User.findById(userId).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let hasAccess = false;
    let isPayPer = false;
    let purchasedFeatureIndex = -1;

    if (user.role === 'admin' || user.role === 'subadmin') {
      hasAccess = true;
    } else {
      // 1. Check pay-per-feature purchasedFeatures first
      const now = new Date();
      if (Array.isArray(user.purchasedFeatures)) {
        purchasedFeatureIndex = user.purchasedFeatures.findIndex(
          f => f.featureKey === 'hasCandidateDBExport' && 
               f.isActive && 
               f.usageLeft > 0 && 
               (!f.expiresAt || new Date(f.expiresAt) > now)
        );
        if (purchasedFeatureIndex !== -1) {
          hasAccess = true;
          isPayPer = true;
        }
      }

      // 2. If no pay-per-feature credit, check subscription plan
      if (!hasAccess) {
        let plan = user.subscription;
        if (user.subscriptionDetails) {
          const details = user.subscriptionDetails;
          const expiry = user.subscriptionExpiry;
          const isSnapshotValid = details.price === 0 || details.duration === 'Lifetime' || !expiry || new Date(expiry) > now;
          if (isSnapshotValid) {
            plan = details;
          }
        }

        const isPlanValid = plan && (
          plan.price === 0 ||
          plan.duration === 'Lifetime' ||
          !user.subscriptionExpiry ||
          new Date(user.subscriptionExpiry) > now
        );

        if (isPlanValid && plan.hasCandidateDBExport) {
          const used = user.candidateDBExportsUsed || 0;
          if (used < 1) {
            hasAccess = true;
          }
        }
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        msg: 'Candidate DB export limit reached. Your plan or add-on allows only 1 export.', 
        requiresUpgrade: true 
      });
    }

    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ msg: 'Job not found' });

    const applications = await Application.find({ job: jobId })
      .populate('applicant', 'name email profile')
      .sort({ createdAt: -1 });

    // Build CSV
    const rows = [['Name', 'Email', 'Location', 'Skills', 'Status', 'Applied Date']];
    for (const app of applications) {
      const c = app.applicant;
      rows.push([
        c?.name || '',
        c?.email || '',
        c?.profile?.location || '',
        (c?.profile?.skills || []).join('; '),
        app.status,
        new Date(app.createdAt).toLocaleDateString('en-IN')
      ]);
    }

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    // Decrement the quota or increment the plan used counter
    if (user.role !== 'admin' && user.role !== 'subadmin') {
      if (isPayPer && purchasedFeatureIndex !== -1) {
        user.purchasedFeatures[purchasedFeatureIndex].usageLeft -= 1;
        if (user.purchasedFeatures[purchasedFeatureIndex].usageLeft <= 0) {
          user.purchasedFeatures[purchasedFeatureIndex].isActive = false;
        }
        user.markModified('purchasedFeatures');
      } else {
        user.candidateDBExportsUsed = (user.candidateDBExportsUsed || 0) + 1;
      }
      await user.save();
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="applicants-${jobId}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('Export Error:', err);
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

    if (user.role !== 'admin' && limit > 0 && used >= limit) {
      return res.status(403).json({ 
        msg: `Download limit reached! Your plan allows only ${limit} downloads.`,
        requiresUpgrade: true 
      });
    }

    // Increment downloadsUsed
    user.downloadsUsed = used + 1;
    await user.save();

    if (user.email) {
      const remaining = limit > 0 ? Math.max(0, limit - user.downloadsUsed) : null;
      sendEmail({
        email: user.email,
        subject: 'Resume Unlock Credit Used',
        html: emailWrapper('Resume Download Confirmed', `
          <p>Hi ${user.name || 'there'},</p>
          <p>You just used 1 resume unlock/download credit.</p>
          ${remaining !== null ? `<p>Remaining this cycle: <strong>${remaining}</strong></p>` : '<p>Your plan includes unlimited downloads.</p>'}
        `)
      }).catch(() => {});
    }
    const downloaderPhone = getUserPhone(user);
    if (downloaderPhone) {
      sendWhatsAppTemplate({
        to: downloaderPhone,
        template: 'application_resume_unlockalert',
        params: [user.name || 'there', '0', 'a candidate profile', '1', `${FRONTEND_URL}/company/applicants`]
      }).catch(() => {});
    }

    res.json({ msg: 'Download authorized', downloadsUsed: user.downloadsUsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Invite one or more candidates to take a skill assessment (single or bulk)
// @route   POST /api/applications/invite-assessment
// @access  Private (Recruiter/Company/Admin)
exports.inviteToAssessment = async (req, res) => {
  try {
    const { applicationIds, skill, date, deadline, link } = req.body;
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ msg: 'No candidates selected' });
    }
    if (!skill || !link) {
      return res.status(400).json({ msg: 'Skill/role and test link are required' });
    }

    const applications = await Application.find({ _id: { $in: applicationIds } })
      .populate('applicant', 'name email profile.phone')
      .populate({ path: 'job', select: 'title recruiter company', populate: { path: 'company', select: 'name' } });

    let sent = 0;
    let failed = 0;

    for (const application of applications) {
      if (!application.job || application.job.recruiter.toString() !== req.user.id) {
        failed++;
        continue;
      }

      const applicant = application.applicant;
      const companyName = application.job.company?.name || 'the company';
      const deadlineLabel = deadline ? new Date(deadline).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Not specified';

      let notified = false;
      const applicantPhone = getUserPhone(applicant);
      if (applicantPhone) {
        const result = await sendWhatsAppTemplate({
          to: applicantPhone,
          template: 'assessment_testinvite',
          params: [applicant.name || 'there', skill, companyName, deadlineLabel, link]
        });
        if (result?.ok) notified = true;
      }
      if (applicant?.email) {
        sendEmail({
          email: applicant.email,
          subject: `You're invited to a ${skill} assessment — ${companyName}`,
          html: emailWrapper('Assessment Invitation', `
            <p>Hi ${applicant.name || 'there'},</p>
            <p>${companyName} has invited you to complete the <strong>${skill}</strong> assessment for <strong>${application.job.title}</strong>.</p>
            ${date ? `<p><strong>Test Date:</strong> ${new Date(date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>` : ''}
            <p><strong>Deadline:</strong> ${deadlineLabel}</p>
            <p><a href="${link}" style="color:#059669;">Take the assessment</a></p>
          `)
        }).catch(() => {});
        notified = true;
      }

      if (notified) sent++; else failed++;
    }

    res.json({ msg: `Invited ${sent} candidate(s)`, sent, failed });
  } catch (err) {
    console.error('Invite To Assessment Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.calculateApplicationMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id).populate('applicant job');
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    const job = application.job;
    const candidate = application.applicant;

    if (!job || !candidate) {
      return res.status(400).json({ msg: 'Missing job or applicant data for this application.' });
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
    
    application.matchAnalysis = {
      matchPercentage: result.matchPercentage || 0,
      matchedSkills: result.matchedSkills || [],
      missingSkills: result.missingSkills || [],
      verdict: result.verdict || '',
      lastCalculated: new Date()
    };
    
    await application.save();

    res.json({ msg: 'Match calculation complete', matchAnalysis: application.matchAnalysis });
  } catch (err) {
    console.error('Gemini Integration Error:', err);
    if (err.status === 503) {
      return res.status(503).json({ msg: 'AI service is currently experiencing high demand. Please try again in a few moments.' });
    }
    if (err.status === 429) {
      return res.status(429).json({ msg: 'AI service quota exceeded or rate limited. Please try again later.' });
    }
    res.status(500).json({ msg: 'Failed to process matching analysis.' });
  }
};
