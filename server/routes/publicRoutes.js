const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');
const Job = require('../models/Job');
const Role = require('../models/Role');
const Review = require('../models/Review');
const Application = require('../models/Application');
const College = require('../models/College');
const CollegeStudent = require('../models/CollegeStudent');
const PayPerFeature = require('../models/PayPerFeature');
const ContactMessage = require('../models/ContactMessage');
const sendEmail = require('../utils/sendEmail');

// @desc  GET /api/public/stats
//        Real, aggregate platform counts for the public home page.
//        No placement/success-rate figures are returned — the platform
//        has no "hired" status to honestly back that claim.
router.get('/stats', async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const jobseekerRole = await Role.findOne({ name: 'jobseeker' });

    const [
      activeJobsCount,
      companiesCount,
      jobseekersCount,
      jobsPostedToday,
      newJobsThisWeek,
      applicationsToday,
      ratingAgg,
      studentsPlacedCount,
      collegesOnboardedCount,
      placementHighlights,
    ] = await Promise.all([
      Job.countDocuments({ status: 'active' }),
      Company.countDocuments(),
      jobseekerRole ? User.countDocuments({ role: jobseekerRole._id }) : 0,
      Job.countDocuments({ status: 'active', createdAt: { $gte: startOfToday } }),
      Job.countDocuments({ status: 'active', createdAt: { $gte: sevenDaysAgo } }),
      Application.countDocuments({ createdAt: { $gte: startOfToday } }),
      Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      CollegeStudent.countDocuments({ placementStatus: 'placed' }),
      College.countDocuments({ verificationStatus: 'verified', isActive: true }),
      // Anonymized highlights only — company + package, never the student's identity.
      CollegeStudent.aggregate([
        { $match: { placementStatus: 'placed', placedDetails: { $ne: [] } } },
        { $unwind: '$placedDetails' },
        { $sort: { 'placedDetails.placedAt': -1 } },
        { $limit: 6 },
        { $project: {
          _id: 0,
          companyName: '$placedDetails.companyName',
          packageLPA: '$placedDetails.packageLPA',
          tierPolicy: '$placedDetails.tierPolicy',
        } },
      ]),
    ]);

    res.json({
      activeJobsCount,
      companiesCount,
      jobseekersCount,
      jobsPostedToday,
      newJobsThisWeek,
      applicationsToday,
      avgRating: ratingAgg[0]?.avgRating || 0,
      reviewsCount: ratingAgg[0]?.count || 0,
      studentsPlacedCount,
      collegesOnboardedCount,
      placementHighlights,
    });
  } catch (err) {
    console.error('Public Stats Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @desc  GET /api/public/companies
//        Returns paginated Company docs + recruiter users
// @query page, limit, search, industry, type (company|recruiter|all)
router.get('/companies', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(24, Math.max(1, parseInt(req.query.limit) || 9));
    const search = (req.query.search || '').trim();
    const industry = (req.query.industry || '').trim();
    const type = req.query.type || 'all'; // 'company' | 'recruiter' | 'all'

    const skip = (page - 1) * limit;

    let companies = [];
    let recruiters = [];
    let totalCompanies = 0;
    let totalRecruiters = 0;

    // ── Company profiles ──────────────────────────────────────────────────
    if (type === 'all' || type === 'company') {
      const companyQuery = {};
      if (search) {
        companyQuery.$or = [
          { name: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }
      if (industry) companyQuery.industry = { $regex: industry, $options: 'i' };

      [companies, totalCompanies] = await Promise.all([
        Company.find(companyQuery)
          .select('name display_name logo location industry description tagline employeeCount company_size_range foundedYear is_verified social_links work_model perks tech_stack about_us website createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Company.countDocuments(companyQuery),
      ]);

      // Attach open job count per company
      const jobCounts = await Job.aggregate([
        { $match: { company: { $in: companies.map(c => c._id) }, status: { $ne: 'Closed' } } },
        { $group: { _id: '$company', count: { $sum: 1 } } },
      ]);
      const countMap = Object.fromEntries(jobCounts.map(j => [j._id.toString(), j.count]));
      companies = companies.map(c => ({
        ...c.toObject(),
        openPositions: countMap[c._id.toString()] || 0,
        profileType: 'company',
      }));
    }

    // ── Recruiter profiles ────────────────────────────────────────────────
    if (type === 'all' || type === 'recruiter') {
      const recruiterRole = await Role.findOne({ name: 'recruiter' });
      if (recruiterRole) {
        const recruiterQuery = { role: recruiterRole._id, isAdminBlocked: { $ne: true } };
        if (search) {
          recruiterQuery.$or = [
            { name: { $regex: search, $options: 'i' } },
            { 'recruiterProfile.location': { $regex: search, $options: 'i' } },
            { 'recruiterProfile.jobTitle': { $regex: search, $options: 'i' } },
          ];
        }

        [recruiters, totalRecruiters] = await Promise.all([
          User.find(recruiterQuery)
            .select('name avatar recruiterProfile company createdAt')
            .populate('company', 'name logo location industry')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
          User.countDocuments(recruiterQuery),
        ]);

        recruiters = recruiters.map(r => ({
          _id: r._id,
          name: r.name,
          avatar: r.avatar,
          jobTitle: r.recruiterProfile?.jobTitle || '',
          location: r.recruiterProfile?.location || r.company?.location || '',
          bio: r.recruiterProfile?.bio || '',
          skills: r.recruiterProfile?.skills || [],
          experience: r.recruiterProfile?.experience || [],
          company: r.company,
          profileType: 'recruiter',
          createdAt: r.createdAt,
        }));
      }
    }

    // Build unified industries list for filter UI
    const industries = await Company.distinct('industry', { industry: { $ne: null, $ne: '' } });

    res.json({
      companies,
      recruiters,
      totalCompanies,
      totalRecruiters,
      total: totalCompanies + totalRecruiters,
      page,
      pages: Math.ceil((type === 'recruiter' ? totalRecruiters : totalCompanies) / limit),
      industries: industries.filter(Boolean).sort(),
    });
  } catch (err) {
    console.error('Public Companies Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @desc  GET /api/public/companies/:id  — full company detail
router.get('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid ID' });
    }

    const company = await Company.findById(id);
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    const openJobs = await Job.find({ company: id, status: { $ne: 'Closed' } })
      .select('title location jobType salary experienceLevel createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ ...company.toObject(), openJobs, profileType: 'company' });
  } catch (err) {
    console.error('Company Detail Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @desc  GET /api/public/recruiters/:id  — full recruiter detail
router.get('/recruiters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid ID' });
    }

    const user = await User.findById(id)
      .select('name avatar recruiterProfile company createdAt')
      .populate('company', 'name logo location industry description');

    if (!user) return res.status(404).json({ msg: 'Recruiter not found' });

    // Fetch jobs posted by this recruiter's company
    const openJobs = user.company
      ? await Job.find({ company: user.company._id, status: { $ne: 'Closed' } })
          .select('title location jobType salary experienceLevel createdAt')
          .sort({ createdAt: -1 })
          .limit(10)
      : [];

    res.json({
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      recruiterProfile: user.recruiterProfile,
      company: user.company,
      openJobs,
      profileType: 'recruiter',
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('Recruiter Detail Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @desc  GET /api/public/colleges
//        Verified, active colleges onboarded to the platform — for the
//        public college/TPO home page ("colleges already registered").
router.get('/colleges', async (req, res) => {
  try {
    const limit = Math.min(24, Math.max(1, parseInt(req.query.limit) || 12));
    const colleges = await College.find({ verificationStatus: 'verified', isActive: true })
      .select('name logo university location display_id')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(colleges);
  } catch (err) {
    console.error('Public Colleges Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @desc  GET /api/public/pay-per-features?role=recruiter|company|college
//        Real, active pay-per-use add-ons for a given role — a public
//        pricing teaser (no auth), independent of the authenticated
//        `/api/pay-per/features` endpoint used inside the dashboard.
router.get('/pay-per-features', async (req, res) => {
  try {
    const role = (req.query.role || '').trim();
    if (!['jobseeker', 'recruiter', 'company', 'college'].includes(role)) {
      return res.status(400).json({ msg: 'A valid role query param is required' });
    }
    const features = await PayPerFeature.find({ role, isActive: true })
      .select('name description featureKey cost pricingOptions days')
      .sort({ cost: 1 });
    res.json(features);
  } catch (err) {
    console.error('Public Pay-Per Features Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @desc  POST /api/public/contact
//        Saves a contact form submission and sends an email notification.
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ msg: 'Please provide name, email, and message.' });
    }

    // Save to database
    const newContactMessage = new ContactMessage({
      name,
      email,
      subject: subject || 'No Subject',
      message
    });
    await newContactMessage.save();

    // Send email notification
    const emailSubject = `New Contact Form Submission: ${subject || 'No Subject'}`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; padding: 20px; color: #333;">
        <h2 style="color: #1d4ed8;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
        <hr style="border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 5px;">${message}</p>
      </div>
    `;

    const emailSent = await sendEmail({
      email: 'abmvelaivaaipu@gmail.com, admin@bmtechx.in',
      subject: emailSubject,
      html: emailHtml
    });

    if (!emailSent) {
      console.warn('Contact form saved, but email notification failed to send.');
    }

    res.status(201).json({ msg: 'Message sent successfully.' });
  } catch (err) {
    console.error('Public Contact Form Error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
