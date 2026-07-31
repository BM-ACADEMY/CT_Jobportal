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

    const { bookingName, bookingEmail, bookingPhone, bookingDate, bookingTime, qualification, major, workExperience, notes } = req.body;
    if (!bookingName || !bookingEmail || !bookingDate || !bookingTime || !qualification || !major || !workExperience) {
      return res.status(400).json({ msg: 'Please provide all required details (name, email, date, time, qualification, major, work experience).' });
    }

    const request = new AdminRequest({
      user: req.user.id,
      type: 'counselling',
      bookingName,
      bookingEmail,
      bookingPhone,
      bookingDate,
      bookingTime,
      qualification,
      major,
      workExperience,
      notes,
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

// @desc    Submit mock interview request
// @route   POST /api/requests/mock-interview
const submitMockInterviewRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscription');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    let hasFeature = false;
    let limit = 0;
    let source = null;
    let payPerFeatureIndex = -1;

    const plan = user.subscription;
    
    if (plan && plan.hasMockInterviews) {
      hasFeature = true;
      source = 'plan';
      limit = 0;
    } else if (plan && Array.isArray(plan.features)) {
      const dynamicFeature = plan.features.find(f => f.isActive && (f.name?.toLowerCase() === 'mock interviews' || f.name?.toLowerCase() === 'mock interview'));
      if (dynamicFeature) {
        hasFeature = true;
        source = 'plan';
        limit = parseInt(dynamicFeature.value) || 0;
      }
    }

    if (source === 'plan' && limit > 0) {
      if ((user.mockInterviewsUsed || 0) >= limit) {
        hasFeature = false;
      }
    }

    if (!hasFeature && Array.isArray(user.purchasedFeatures)) {
      const ppFeatureIndex = user.purchasedFeatures.findIndex(f => 
        f.isActive && 
        f.featureKey === 'hasMockInterviews' && 
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
      return res.status(403).json({ msg: 'Mock interview limit reached or not included in your active features.' });
    }

    const { skills, careerGoal } = req.body;
    if (!skills || !careerGoal) {
      return res.status(400).json({ msg: 'Skills and career goal are required.' });
    }

    const request = new AdminRequest({
      user: req.user.id,
      type: 'mock_interview',
      skills,
      careerGoal,
    });
    await request.save();

    if (source === 'plan' && limit > 0) {
      user.mockInterviewsUsed = (user.mockInterviewsUsed || 0) + 1;
    } else if (source === 'payper' && payPerFeatureIndex !== -1) {
      user.purchasedFeatures[payPerFeatureIndex].usageLeft -= 1;
      if (user.purchasedFeatures[payPerFeatureIndex].usageLeft <= 0) {
        user.purchasedFeatures[payPerFeatureIndex].isActive = false;
      }
      user.markModified('purchasedFeatures');
    }
    await user.save();

    res.status(201).json({ msg: 'Your mock interview request has been submitted. Our team will reach out soon.' });
  } catch (err) {
    console.error('Mock Interview Request Error:', err);
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

// @desc    Get mock interview requests for current user
// @route   GET /api/requests/my-mock-interviews
const getMyMockInterviews = async (req, res) => {
  try {
    const requests = await AdminRequest.find({ user: req.user.id, type: 'mock_interview' })
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

    const user = await User.findById(req.user.id);
    let refunded = false;
    if (user.counsellingSessionsUsed > 0) {
      user.counsellingSessionsUsed -= 1;
      refunded = true;
    }
    if (!refunded && Array.isArray(user.purchasedFeatures)) {
      const ppIdx = user.purchasedFeatures.findIndex(f => f.featureKey === 'hasCareerCounselling' && (!f.expiresAt || new Date(f.expiresAt) > new Date()));
      if (ppIdx !== -1) {
        user.purchasedFeatures[ppIdx].usageLeft += 1;
        user.purchasedFeatures[ppIdx].isActive = true;
        user.markModified('purchasedFeatures');
        refunded = true;
      }
    }
    if (!refunded) {
      user.counsellingSessionsUsed = (user.counsellingSessionsUsed || 0) - 1;
    }
    await user.save();

    res.json({ msg: 'Session cancelled successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Seeker: Edit own counselling session
// @route   PATCH /api/requests/counselling/:id
const updateMySession = async (req, res) => {
  try {
    const session = await AdminRequest.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'counselling',
    });

    if (!session) return res.status(404).json({ msg: 'Session not found' });
    if (session.status !== 'pending') return res.status(400).json({ msg: 'Only pending sessions can be edited' });

    const { bookingDate, bookingTime, qualification, major, workExperience, notes } = req.body;
    if (bookingDate) session.bookingDate = bookingDate;
    if (bookingTime) session.bookingTime = bookingTime;
    if (qualification) session.qualification = qualification;
    if (major) session.major = major;
    if (workExperience) session.workExperience = workExperience;
    if (notes !== undefined) session.notes = notes;

    await session.save();
    res.json({ msg: 'Session updated successfully', session });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Seeker: Cancel own mock interview
// @route   PATCH /api/requests/mock-interview/:id/cancel
const cancelMyMockInterview = async (req, res) => {
  try {
    const session = await AdminRequest.findOne({
      _id: req.params.id,
      user: req.user.id,
      type: 'mock_interview',
    });

    if (!session) return res.status(404).json({ msg: 'Request not found' });
    if (session.status === 'completed') return res.status(400).json({ msg: 'Completed requests cannot be cancelled' });
    if (session.status === 'cancelled') return res.status(400).json({ msg: 'Request is already cancelled' });

    session.status = 'cancelled';
    await session.save();

    const user = await User.findById(req.user.id);
    let refunded = false;
    if (user.mockInterviewsUsed > 0) {
      user.mockInterviewsUsed -= 1;
      refunded = true;
    }
    if (!refunded && Array.isArray(user.purchasedFeatures)) {
      const ppIdx = user.purchasedFeatures.findIndex(f => f.featureKey === 'hasMockInterviews' && (!f.expiresAt || new Date(f.expiresAt) > new Date()));
      if (ppIdx !== -1) {
        user.purchasedFeatures[ppIdx].usageLeft += 1;
        user.purchasedFeatures[ppIdx].isActive = true;
        user.markModified('purchasedFeatures');
        refunded = true;
      }
    }
    if (!refunded) {
      user.mockInterviewsUsed = (user.mockInterviewsUsed || 0) - 1;
    }
    await user.save();

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
      .populate('assignedTo', 'name email display_id role company companyProfile')
      .populate('assignedToPool', 'name email display_id role company companyProfile')
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

// @desc    Admin: Assign request to sub-admin/admin/recruiter
// @route   PATCH /api/requests/admin/:id/assign
const adminAssignRequest = async (req, res) => {
  try {
    const { assignedToPool } = req.body;
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to assign tasks' });
    }

    const request = await AdminRequest.findById(req.params.id).populate('user', 'name');
    if (!request) return res.status(404).json({ msg: 'Request not found' });

    request.assignedToPool = assignedToPool || [];
    request.assignedTo = null;
    request.status = 'pending';
    request.assignedAt = Date.now();
    await request.save();
    
    if (assignedToPool && assignedToPool.length > 0) {
      const assignees = await User.find({ _id: { $in: assignedToPool } }).select('name email');
      const sendEmail = require('../utils/sendEmail');
      
      for (const assignee of assignees) {
        if (assignee.email) {
          try {
            await sendEmail({
              email: assignee.email,
              subject: 'New Request Assigned to You',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                  <h2 style="color: #059669;">New Request Assigned</h2>
                  <p>Hello ${assignee.name},</p>
                  <p>You have been assigned a new <strong>${request.type.replace('_', ' ')}</strong> request from ${request.user?.name || 'a user'}.</p>
                  <p>Please log in to your dashboard, navigate to <strong>Requests</strong>, and accept the request. Note that this request may have been sent to multiple professionals and will be locked to the first person who accepts it.</p>
                  <p style="margin-top: 30px;">Best regards,<br/><strong>Velaivaaipu Team</strong></p>
                </div>
              `
            });
          } catch (e) {
            console.error('Failed to send assignment notification email:', e);
          }
        }
      }
    }
    
    res.json({ msg: 'Request assigned successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Get list of admins/subadmins for assignment
// @route   GET /api/requests/assignees
const getAssignees = async (req, res) => {
  try {
    const roles = await Role.find({ name: { $in: ['admin', 'subadmin', 'recruiter', 'company'] } }).select('_id');
    const roleIds = roles.map(r => r._id);
    const assignees = await User.find({ role: { $in: roleIds } })
      .select('name email role display_id companyName')
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
    const requests = await AdminRequest.find({
      $or: [
        { assignedToPool: req.user.id, status: 'pending' },
        { assignedTo: req.user.id }
      ]
    })
      .populate('user', 'name email phone display_id')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// @desc    Subadmin/Recruiter: Update assigned request (progress/notes)
// @route   PATCH /api/requests/assigned/:id
const updateAssignedRequest = async (req, res) => {
  try {
    const { status, adminNotes, action, slot1Date, slot1StartTime, slot1EndTime, slot2Date, slot2StartTime, slot2EndTime, meetingLink } = req.body;
    const request = await AdminRequest.findOne({ 
      _id: req.params.id, 
      $or: [
        { assignedToPool: req.user.id, status: 'pending' },
        { assignedTo: req.user.id }
      ]
    }).populate('user', 'name email');

    if (!request) return res.status(404).json({ msg: 'Request not found or no longer available' });

    if (action === 'reject') {
      request.assignedToPool = request.assignedToPool.filter(id => id.toString() !== req.user.id);
      await request.save();
      return res.json({ msg: 'Request rejected' });
    }

    const previousStatus = request.status;

    if (status) request.status = status;
    if (adminNotes !== undefined) request.adminNotes = adminNotes;
    
    if (status === 'approved') {
      if (slot1Date) request.slot1Date = slot1Date;
      if (slot1StartTime) request.slot1StartTime = slot1StartTime;
      if (slot1EndTime) request.slot1EndTime = slot1EndTime;
      if (slot2Date) request.slot2Date = slot2Date;
      if (slot2StartTime) request.slot2StartTime = slot2StartTime;
      if (slot2EndTime) request.slot2EndTime = slot2EndTime;
      
      // Default to native link if not provided
      request.meetingLink = meetingLink ? meetingLink : `http://localhost:5173/meeting/${request._id}`;
    }
    
    if (status === 'approved' && previousStatus === 'pending') {
      request.assignedTo = req.user.id;
    }
    
    await request.save();

    // Send email to user if status changed to approved
    if (status === 'approved' && previousStatus !== 'approved' && request.user?.email) {
      const sendEmail = require('../utils/sendEmail');
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #059669;">Your Request has been Accepted!</h2>
          <p>Hello ${request.user.name},</p>
          <p>Your <strong>${request.type.replace('_', ' ')}</strong> request has been reviewed and accepted by one of our professionals.</p>
          ${adminNotes ? `
          <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #065f46;"><strong>Additional Notes:</strong></p>
            <p style="margin: 5px 0 0 0; white-space: pre-wrap;">${adminNotes}</p>
          </div>
          ` : ''}
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Available Slot 1:</strong> ${request.slot1Date} at ${request.slot1StartTime} - ${request.slot1EndTime}</p>
            <p style="margin: 0 0 10px 0;"><strong>Available Slot 2:</strong> ${request.slot2Date} at ${request.slot2StartTime} - ${request.slot2EndTime}</p>
            <p style="margin: 10px 0 0 0; color: #ef4444; font-weight: bold;">Please log in to your dashboard to confirm your preferred slot.</p>
          </div>
          <p>You can also log in to your dashboard to view the meeting link and instructions.</p>
          <p style="margin-top: 30px;">Best regards,<br/><strong>Velaivaaipu Team</strong></p>
        </div>
      `;
      try {
        await sendEmail({
          email: request.user.email,
          subject: `Update on your ${request.type.replace('_', ' ')} Request`,
          html: emailHtml
        });
      } catch (e) {
        console.error('Failed to send assignment acceptance email:', e);
      }
    }

    res.json({ msg: 'Request updated successfully', request });
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

// @route   PATCH /api/requests/:id/select-slot
const selectSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { slot } = req.body; // '1' or '2'
    
    const request = await AdminRequest.findOne({ _id: id, user: req.user.id });
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (request.status !== 'approved') return res.status(400).json({ msg: 'Request is not approved yet' });

    request.selectedSlot = slot;
    if (slot === '1') {
      request.meetingDate = request.slot1Date;
      request.meetingStartTime = request.slot1StartTime;
      request.meetingEndTime = request.slot1EndTime;
    } else {
      request.meetingDate = request.slot2Date;
      request.meetingStartTime = request.slot2StartTime;
      request.meetingEndTime = request.slot2EndTime;
    }
    
    await request.save();
    res.json({ msg: 'Slot confirmed', request });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = {
  submitCounsellingRequest,
  submitMockInterviewRequest,
  submitAiResumeReviewRequest,
  getMySessions,
  getMyMockInterviews,
  getMyAiResumeReviews,
  cancelMySession,
  cancelMyMockInterview,
  getAdminRequests,
  updateRequestStatus,
  adminAssignRequest,
  getAssignees,
  getAssignedRequests,
  updateAssignedRequest,
  submitWebsiteRequest,
  updateMySession,
  selectSlot
};
