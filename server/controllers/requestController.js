const User = require('../models/User');
const AdminRequest = require('../models/AdminRequest');
const Role = require('../models/Role');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Book a career counselling session
// @route   POST /api/requests/counselling
const submitCounsellingRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let hasFeature = false;
    let limit = 0;
    let source = null;
    let payPerFeatureIndex = -1;
    const plan = user.subscription;
    
    if (plan && plan.hasCareerCounselling) {
      hasFeature = true;
      source = 'plan';
      limit = plan.careerCounsellingCount || 0;
    } else if (plan && Array.isArray(plan.features)) {
      const dynamicFeature = plan.features.find(f => f.isActive && (f.name?.toLowerCase() === 'career counselling' || f.name?.toLowerCase() === 'career counseling'));
      if (dynamicFeature) {
        hasFeature = true;
        source = 'plan';
        limit = parseInt(dynamicFeature.value) || 0;
      }
    }

    if (source === 'plan' && limit > 0) {
      if ((user.counsellingSessionsUsed || 0) >= limit) {
        hasFeature = false;
      }
    }

    if (!hasFeature && Array.isArray(user.purchasedFeatures)) {
      const ppFeatureIndex = user.purchasedFeatures.findIndex(f => 
        f.isActive && 
        f.featureKey === 'hasCareerCounselling' && 
        f.usageLeft > 0 && 
        (!f.expiresAt || new Date(f.expiresAt) > new Date())
      );
      
      if (ppFeatureIndex !== -1) {
        hasFeature = true;
        source = 'payper';
        payPerFeatureIndex = ppFeatureIndex;
      }
    }

    if (!hasFeature) {
      return res.status(403).json({ msg: 'Career counselling limit reached or not included in your active features.' });
    }

    const { bookingName, bookingEmail, bookingPhone, bookingDate, bookingTime } = req.body;
    if (!bookingName || !bookingEmail || !bookingDate || !bookingTime) {
      return res.status(400).json({ msg: 'Name, email, date and time are required.' });
    }

    const request = new AdminRequest({
      user: req.user.id,
      type: 'counselling',
      bookingName,
      bookingEmail,
      bookingPhone,
      bookingDate,
      bookingTime,
    });
    await request.save();

    if (source === 'plan' && limit > 0) {
      user.counsellingSessionsUsed = (user.counsellingSessionsUsed || 0) + 1;
    } else if (source === 'payper' && payPerFeatureIndex !== -1) {
      user.purchasedFeatures[payPerFeatureIndex].usageLeft -= 1;
      if (user.purchasedFeatures[payPerFeatureIndex].usageLeft <= 0) {
        user.purchasedFeatures[payPerFeatureIndex].isActive = false;
      }
      user.markModified('purchasedFeatures');
    }
    await user.save();

    res.status(201).json({ msg: 'Session booked successfully. Our team will confirm shortly.' });
  } catch (err) {
    console.error('Counselling Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Submit interview prep request
// @route   POST /api/requests/interview-prep
const submitInterviewPrepRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let hasFeature = false;
    let limit = 0;
    let source = null;
    let payPerFeatureIndex = -1;

    const plan = user.subscription;
    
    if (plan && plan.hasInterviewPrep) {
      hasFeature = true;
      source = 'plan';
      limit = 0;
    } else if (plan && Array.isArray(plan.features)) {
      const dynamicFeature = plan.features.find(f => f.isActive && (f.name?.toLowerCase() === 'interview prep' || f.name?.toLowerCase() === 'interview preparation'));
      if (dynamicFeature) {
        hasFeature = true;
        source = 'plan';
        limit = parseInt(dynamicFeature.value) || 0;
      }
    }

    if (source === 'plan' && limit > 0) {
      if ((user.interviewPrepUsed || 0) >= limit) {
        hasFeature = false;
      }
    }

    if (!hasFeature && Array.isArray(user.purchasedFeatures)) {
      const ppFeatureIndex = user.purchasedFeatures.findIndex(f => 
        f.isActive && 
        f.featureKey === 'hasInterviewPrep' && 
        f.usageLeft > 0 && 
        (!f.expiresAt || new Date(f.expiresAt) > new Date())
      );
      
      if (ppFeatureIndex !== -1) {
        hasFeature = true;
        source = 'payper';
        payPerFeatureIndex = ppFeatureIndex;
      }
    }

    if (!hasFeature) {
      return res.status(403).json({ msg: 'Interview prep limit reached or not included in your active features.' });
    }

    const { skills, careerGoal } = req.body;
    if (!skills || !careerGoal) {
      return res.status(400).json({ msg: 'Skills and career goal are required.' });
    }

    const request = new AdminRequest({
      user: req.user.id,
      type: 'interview_prep',
      skills,
      careerGoal,
    });
    await request.save();

    if (source === 'plan' && limit > 0) {
      user.interviewPrepUsed = (user.interviewPrepUsed || 0) + 1;
    } else if (source === 'payper' && payPerFeatureIndex !== -1) {
      user.purchasedFeatures[payPerFeatureIndex].usageLeft -= 1;
      if (user.purchasedFeatures[payPerFeatureIndex].usageLeft <= 0) {
        user.purchasedFeatures[payPerFeatureIndex].isActive = false;
      }
      user.markModified('purchasedFeatures');
    }
    await user.save();

    res.status(201).json({ msg: 'Your interview prep request has been submitted. Our team will reach out soon.' });
  } catch (err) {
    console.error('Interview Prep Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Submit AI Resume Review request
// @route   POST /api/requests/ai-resume-review
const submitAiResumeReviewRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let hasFeature = false;
    let limit = 0;
    let source = null;
    let payPerFeatureIndex = -1;

    const plan = user.subscription;
    
    if (plan && plan.hasAiResumeReview) {
      hasFeature = true;
      source = 'plan';
      limit = plan.aiResumeReviewCount || 0;
    } else if (plan && Array.isArray(plan.features)) {
      const dynamicFeature = plan.features.find(f => f.isActive && (f.name?.toLowerCase() === 'ai resume review' || f.name?.toLowerCase() === 'ai resume'));
      if (dynamicFeature) {
        hasFeature = true;
        source = 'plan';
        limit = parseInt(dynamicFeature.value) || 0;
      }
    }

    if (source === 'plan' && limit > 0) {
      if ((user.aiResumeReviewUsed || 0) >= limit) {
        hasFeature = false;
      }
    }

    if (!hasFeature && Array.isArray(user.purchasedFeatures)) {
      const ppFeatureIndex = user.purchasedFeatures.findIndex(f => 
        f.isActive && 
        f.featureKey === 'hasAiResumeReview' && 
        f.usageLeft > 0 && 
        (!f.expiresAt || new Date(f.expiresAt) > new Date())
      );
      
      if (ppFeatureIndex !== -1) {
        hasFeature = true;
        source = 'payper';
        payPerFeatureIndex = ppFeatureIndex;
      }
    }

    if (!hasFeature) {
      return res.status(403).json({ msg: 'AI Resume Review limit reached or not included in your active features.' });
    }

    const { notes, jobRole } = req.body;

    const profileText = JSON.stringify(user.profile);
    const prompt = `
      You are an expert AI Resume Reviewer and ATS System. The candidate has submitted their profile for review.
      Candidate Profile: ${profileText}
      Target Job Role: ${jobRole || 'General/Not Specified'}
      Candidate's Focus Areas/Notes: ${notes || 'None'}
      
      Generate a comprehensive AI resume review report. Provide the response in JSON format with exactly these keys:
      1. "score": An ATS compatibility score out of 100 (e.g. 85).
      2. "summary": A brief 2-3 sentence overview of the resume's strength.
      3. "strengths": An array of 3-4 strings detailing strong points.
      4. "weaknesses": An array of 3-4 strings detailing areas for improvement.
      5. "missingKeywords": An array of important industry keywords missing from their profile.
      6. "actionableSteps": An array of 3-4 specific steps they should take to improve their resume.
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const resultObj = await model.generateContent(prompt);
    let responseText = resultObj.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(responseText);

    const request = new AdminRequest({
      user: req.user.id,
      type: 'ai_resume_review',
      status: 'completed',
      jobRole: jobRole || '',
      adminNotes: JSON.stringify(aiData)
    });
    await request.save();

    if (source === 'plan' && limit > 0) {
      user.aiResumeReviewUsed = (user.aiResumeReviewUsed || 0) + 1;
    } else if (source === 'payper' && payPerFeatureIndex !== -1) {
      user.purchasedFeatures[payPerFeatureIndex].usageLeft -= 1;
      if (user.purchasedFeatures[payPerFeatureIndex].usageLeft <= 0) {
        user.purchasedFeatures[payPerFeatureIndex].isActive = false;
      }
      user.markModified('purchasedFeatures');
    }
    await user.save();

    res.status(201).json({ msg: 'AI Resume Review complete.', reviewData: aiData });
  } catch (err) {
    console.error('AI Resume Review Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Submit salary benchmarking request
// @route   POST /api/requests/salary-benchmark
const submitSalaryBenchmarkRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let hasFeature = false;
    let limit = 0;
    let source = null; // 'plan' or 'payper'
    let payPerFeatureIndex = -1;
    
    const plan = user.subscription;
    
    if (plan && plan.hasSalaryBenchmarking) {
      hasFeature = true;
      source = 'plan';
      limit = 0;
    } else if (plan && Array.isArray(plan.features)) {
      const dynamicFeature = plan.features.find(f => f.isActive && (f.name?.toLowerCase() === 'salary benchmarking' || f.name?.toLowerCase() === 'salary benchmark'));
      if (dynamicFeature) {
        hasFeature = true;
        source = 'plan';
        limit = parseInt(dynamicFeature.value) || 0;
      }
    }

    if (hasFeature && limit > 0 && (user.salaryBenchmarkingUsed || 0) >= limit) {
      hasFeature = false;
    }

    if (!hasFeature && Array.isArray(user.purchasedFeatures)) {
      const ppFeatureIndex = user.purchasedFeatures.findIndex(f => 
        f.isActive && 
        f.featureKey === 'hasSalaryBenchmarking' && 
        f.usageLeft > 0 && 
        (!f.expiresAt || new Date(f.expiresAt) > new Date())
      );
      
      if (ppFeatureIndex !== -1) {
        hasFeature = true;
        source = 'payper';
        payPerFeatureIndex = ppFeatureIndex;
      }
    }

    if (!hasFeature) {
      return res.status(403).json({ msg: 'Salary benchmarking limit reached or not included in your active features.' });
    }

    const { jobRole, companyName } = req.body;
    if (!jobRole || !companyName) {
      return res.status(400).json({ msg: 'Job role and company name are required.' });
    }

    const prompt = `
      You are an expert HR compensation analyst. The candidate has requested a salary benchmarking report for the role "${jobRole}" at the target company "${companyName}" in India.
      
      Generate a realistic, data-driven salary benchmarking report based on current market trends for this specific role and company.
      
      Provide the response in JSON format containing ONLY these exactly named keys:
      1. "minSalary": The minimum expected salary formatted as a string (e.g. "₹5,00,000").
      2. "maxSalary": The maximum expected salary formatted as a string (e.g. "₹15,00,000").
      3. "avgSalary": The average expected salary formatted as a string (e.g. "₹9,00,000").
      4. "marketDemand": A string indicating demand, such as "High", "Medium", or "Very High".
      5. "experienceBased": An array of exactly 3 objects representing experience levels, each with "exp" (e.g. "0-2 Yrs") and "avg" (the average salary for that experience level formatted as a string).
      6. "keyInsights": An array of 2 to 3 strings providing detailed market insights about this role at this company or industry.
      7. "skillsThatBoostSalary": An array of 3 to 4 strings detailing specific skills that can significantly increase compensation for this role.
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const resultObj = await model.generateContent(prompt);
    let responseText = resultObj.response.text();
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(responseText);

    const benchmarkData = {
      jobRole,
      companyName,
      minSalary: aiData.minSalary,
      maxSalary: aiData.maxSalary,
      avgSalary: aiData.avgSalary,
      marketDemand: aiData.marketDemand,
      experienceBased: aiData.experienceBased,
      keyInsights: aiData.keyInsights || [],
      skillsThatBoostSalary: aiData.skillsThatBoostSalary || []
    };

    const request = new AdminRequest({
      user: req.user.id,
      type: 'salary_benchmark',
      jobRole,
      companyName,
      status: 'completed',
      adminNotes: JSON.stringify(benchmarkData)
    });
    await request.save();

    const sendEmail = require('../utils/sendEmail');
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #059669;">Salary Benchmarking Report</h2>
        <p>Hello ${user.name},</p>
        <p>Here is the requested salary benchmarking report for <strong>${jobRole}</strong> at <strong>${companyName}</strong>:</p>
        <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Average Salary:</strong> <span style="font-size: 1.2em; color: #065f46;">${benchmarkData.avgSalary}</span></p>
          <p style="margin: 0 0 10px 0;"><strong>Salary Range:</strong> ${benchmarkData.minSalary} - ${benchmarkData.maxSalary}</p>
          <p style="margin: 0;"><strong>Market Demand:</strong> ${benchmarkData.marketDemand}</p>
        </div>
        <h3>Experience Based Averages</h3>
        <ul style="list-style-type: none; padding: 0;">
          ${benchmarkData.experienceBased.map(e => `<li style="padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;"><strong>${e.exp}:</strong> <span>${e.avg}</span></li>`).join('')}
        </ul>
        <h3>Key Insights</h3>
        <ul style="padding-left: 20px;">
          ${(benchmarkData.keyInsights || []).map(i => `<li>${i}</li>`).join('')}
        </ul>
        <h3>Skills that Boost Salary</h3>
        <ul style="padding-left: 20px;">
          ${(benchmarkData.skillsThatBoostSalary || []).map(s => `<li>${s}</li>`).join('')}
        </ul>
        <p style="margin-top: 30px;">Best regards,<br/><strong>Velaivaaipu Team</strong></p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: `Salary Benchmarking Report: ${jobRole}`,
      html: emailHtml
    });

    if (source === 'plan') {
      if (limit > 0) {
        user.salaryBenchmarkingUsed = (user.salaryBenchmarkingUsed || 0) + 1;
      }
    } else if (source === 'payper') {
      user.purchasedFeatures[payPerFeatureIndex].usageLeft -= 1;
      if (user.purchasedFeatures[payPerFeatureIndex].usageLeft <= 0) {
        user.purchasedFeatures[payPerFeatureIndex].isActive = false;
      }
      user.markModified('purchasedFeatures');
    }
    await user.save();

    res.status(201).json({ msg: 'Salary benchmarking report generated successfully.', benchmarkData });
  } catch (err) {
    console.error('Salary Benchmark Request Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get sessions used by current user (for counselling count display)
// @route   GET /api/requests/my-sessions
const getMySessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('counsellingSessionsUsed');
    const sessions = await AdminRequest.find({ user: req.user.id, type: 'counselling' })
      .sort({ createdAt: -1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counts = { booked: 0, accepted: 0, upcoming: 0, completed: 0, rejected: 0 };
    sessions.forEach(s => {
      if (s.status === 'pending') counts.booked++;
      else if (s.status === 'approved') {
        counts.accepted++;
        if (new Date(s.bookingDate) >= today) counts.upcoming++;
      } else if (s.status === 'completed') counts.completed++;
      else if (s.status === 'cancelled') counts.rejected++;
    });

    res.json({
      counsellingSessionsUsed: user?.counsellingSessionsUsed || 0,
      sessions,
      counts,
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get interview prep requests for current user
// @route   GET /api/requests/my-interview-prep
const getMyInterviewPrep = async (req, res) => {
  try {
    const requests = await AdminRequest.find({ user: req.user.id, type: 'interview_prep' })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get ai resume review requests for current user
// @route   GET /api/requests/my-ai-resume-reviews
const getMyAiResumeReviews = async (req, res) => {
  try {
    const requests = await AdminRequest.find({ user: req.user.id, type: 'ai_resume_review' })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get salary benchmark history for current user
// @route   GET /api/requests/salary-benchmark
const getMySalaryBenchmarks = async (req, res) => {
  try {
    const requests = await AdminRequest.find({ user: req.user.id, type: 'salary_benchmark' })
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Seeker: Cancel own counselling session
// @route   PATCH /api/requests/counselling/:id/cancel
const cancelMySession = async (req, res) => {
  try {
    const session = await AdminRequest.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'counselling',
    });

    if (!session) return res.status(404).json({ msg: 'Session not found' });
    if (session.status === 'completed') return res.status(400).json({ msg: 'Completed sessions cannot be cancelled' });
    if (session.status === 'cancelled') return res.status(400).json({ msg: 'Session is already cancelled' });

    session.status = 'cancelled';
    await session.save();

    await User.findByIdAndUpdate(req.user.id, { $inc: { counsellingSessionsUsed: -1 } });

    res.json({ msg: 'Session cancelled successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Seeker: Cancel own interview prep
// @route   PATCH /api/requests/interview-prep/:id/cancel
const cancelMyInterviewPrep = async (req, res) => {
  try {
    const session = await AdminRequest.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'interview_prep',
    });

    if (!session) return res.status(404).json({ msg: 'Request not found' });
    if (session.status === 'completed') return res.status(400).json({ msg: 'Completed requests cannot be cancelled' });
    if (session.status === 'cancelled') return res.status(400).json({ msg: 'Request is already cancelled' });

    session.status = 'cancelled';
    await session.save();

    res.json({ msg: 'Request cancelled successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Admin: Get all requests (with filters)
// @route   GET /api/requests/admin
const getAdminRequests = async (req, res) => {
  try {
    const { type, status, search, assignedTo } = req.query;
    let query = {};

    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;
    if (assignedTo && assignedTo !== 'all') {
      if (assignedTo === 'unassigned') query.assignedTo = { $exists: false };
      else query.assignedTo = assignedTo;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const users = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { display_id: searchRegex }
        ]
      }).select('_id');
      const userIds = users.map(u => u._id);
      
      query.$or = [
        { user: { $in: userIds } },
        { bookingName: searchRegex },
        { bookingEmail: searchRegex },
      ];
    }

    const requests = await AdminRequest.find(query)
      .populate('user', 'name email phone display_id role')
      .populate('assignedTo', 'name email display_id')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Admin: Update request status and notes
// @route   PATCH /api/requests/admin/:id
const updateRequestStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const request = await AdminRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ msg: 'Request not found' });

    if (status) request.status = status;
    if (adminNotes !== undefined) request.adminNotes = adminNotes;
    request.updatedAt = Date.now();

    await request.save();
    res.json({ msg: 'Request updated successfully', request });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Admin: Assign request to sub-admin/admin
// @route   PATCH /api/requests/admin/:id/assign
const adminAssignRequest = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to assign tasks' });
    }

    const request = await AdminRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ msg: 'Request not found' });

    request.assignedTo = assignedTo || null;
    await request.save();
    
    res.json({ msg: 'Request assigned successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get list of admins/subadmins for assignment
// @route   GET /api/requests/assignees
const getAssignees = async (req, res) => {
  try {
    const roles = await Role.find({ name: { $in: ['admin', 'subadmin'] } }).select('_id');
    const roleIds = roles.map(r => r._id);
    const assignees = await User.find({ role: { $in: roleIds } })
      .select('name email role display_id')
      .populate('role', 'name');
    res.json(assignees);
  } catch (err) {
    console.error('getAssignees Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Subadmin: Get requests assigned to me
// @route   GET /api/requests/assigned
const getAssignedRequests = async (req, res) => {
  try {
    const requests = await AdminRequest.find({ assignedTo: req.user.id })
      .populate('user', 'name email phone display_id')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Subadmin: Update assigned request (progress/notes)
// @route   PATCH /api/requests/assigned/:id
const updateAssignedRequest = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const request = await AdminRequest.findOne({ _id: req.params.id, assignedTo: req.user.id });

    if (!request) return res.status(404).json({ msg: 'Request not found or not assigned to you' });

    if (status) request.status = status;
    if (adminNotes !== undefined) request.adminNotes = adminNotes;
    
    await request.save();
    res.json({ msg: 'Request updated successfully', request });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Submit Bulk Application request (Company feature)
// @route   POST /api/requests/bulk-application
const submitBulkApplicationRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let hasFeature = false;
    const plan = user.subscription;
    
    if (plan && plan.hasBulkApplicantManagement) {
      hasFeature = true;
    } else if (Array.isArray(user.purchasedFeatures) && user.purchasedFeatures.some(f => f.isActive && f.featureKey === 'hasBulkApplicantManagement' && f.usageLeft > 0)) {
      hasFeature = true;
    }

    if (!hasFeature) {
      return res.status(403).json({ msg: 'Bulk Applicant Management is not active on your account.' });
    }

    const { jobId, action, count } = req.body;

    const request = new AdminRequest({
      user: req.user.id,
      type: 'bulk_application',
      adminNotes: `Requested ${action} for ${count} applicants on job ${jobId}`,
    });
    await request.save();

    res.status(201).json({ msg: 'Bulk action requested successfully. Admin will process shortly.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Submit Website request (Company feature)
// @route   POST /api/requests/website-request
const submitWebsiteRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const plan = user.subscription;
    if (!plan || !plan.companyProfileType || plan.companyProfileType === 'No') {
      return res.status(403).json({ msg: 'Website creation feature is not included in your plan. Please upgrade.' });
    }

    const { websiteDetails, websiteGoal, targetAudience, adminNotes } = req.body;

    const request = new AdminRequest({
      user: req.user.id,
      type: 'website_request',
      websiteDetails,
      websiteGoal,
      targetAudience,
      adminNotes
    });
    await request.save();

    res.status(201).json({ msg: 'Website creation request submitted. Our team will review your requirements and reach out shortly.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  submitBulkApplicationRequest,
  submitCounsellingRequest,
  submitInterviewPrepRequest,
  submitSalaryBenchmarkRequest,
  submitAiResumeReviewRequest,
  getMySessions,
  getMyInterviewPrep,
  getMyAiResumeReviews,
  getMySalaryBenchmarks,
  cancelMySession,
  cancelMyInterviewPrep,
  getAdminRequests,
  updateRequestStatus,
  adminAssignRequest,
  getAssignees,
  getAssignedRequests,
  updateAssignedRequest,
  submitWebsiteRequest
};
