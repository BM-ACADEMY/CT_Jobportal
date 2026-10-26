const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');
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
const { rateLimit } = require('../middlewares/rateLimit');
const { verifyAlertToken, lifecycleWrapper, button, esc, frontend } = require('../utils/lifecycleEmails');

// @desc  GET /api/public/unsubscribe?token=...
//        One-click unsubscribe from marketing / lifecycle mail (receipts and security mail still arrive).
const handleUnsubscribe = async (req, res) => {
  const page = (msg) => res.status(200).type('html').send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Velaivaaipu</title><body style="font-family:Arial,sans-serif;max-width:480px;margin:15vh auto;padding:0 20px;color:#1e293b;text-align:center"><h2>${msg}</h2><p style="color:#64748b">You can still get payment receipts and account security mail.</p></body>`);
  const payload = verifyAlertToken(req.query.token);
  if (!payload || !mongoose.isValidObjectId(payload.uid)) return page('This link has expired or is not valid.');
  try {
    await User.updateOne({ _id: payload.uid }, { $set: { 'emailPrefs.marketingOptOut': true, 'emailPrefs.optOutAt': new Date() } });
    return page('You have been unsubscribed.');
  } catch (err) {
    console.error('Unsubscribe error:', err.message);
    return page('Something went wrong. Please write to support@velaivaaipu.in.');
  }
};
// GET = the link in the mail footer; POST = the one-click button in Gmail / Yahoo (RFC 8058).
router.get('/unsubscribe', handleUnsubscribe);
router.post('/unsubscribe', handleUnsubscribe);

// @desc  GET /api/public/sitemap-feed
//        Lightweight list of public URLs' data for the dynamic sitemap (jobs + companies).
router.get('/sitemap-feed', async (req, res) => {
  try {
    const now = new Date();
    const [jobs, companies] = await Promise.all([
      Job.find({ status: 'active', $or: [{ validThrough: { $gte: now } }, { validThrough: null }] })
        .select('title location updatedAt').sort({ updatedAt: -1 }).limit(5000).lean(),
      Company.find({}).select('name updatedAt').sort({ updatedAt: -1 }).limit(2000).lean()
    ]);
    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      jobs: jobs.map((j) => ({ id: j._id, title: j.title, location: j.location, updatedAt: j.updatedAt })),
      companies: companies.map((c) => ({ id: c._id, updatedAt: c.updatedAt }))
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

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

    const openJobs = await Job.find({ company: id, status: 'active' })
      .select('title location jobType salary experienceLevel createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Never publish billing / tax / internal fields on a public profile.
    const publicCompany = company.toObject();
    ['tax_id_ein', 'admin_email', 'legal_name', 'razorpaySubscriptionId', 'renewalFailureCount',
      'nextRenewalDate', 'autoRenewEnabled', 'subscriptionExpiry', 'pendingJoinRequests'
    ].forEach((field) => delete publicCompany[field]);

    res.json({ ...publicCompany, openJobs, profileType: 'company' });
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
      ? await Job.find({ company: user.company._id, status: 'active' })
          .select('title location jobType salary experienceLevel createdAt')
          .sort({ createdAt: -1 })
          .limit(10)
      : [];

    res.json({
      _id: user._id,
      name: user.name,
      avatar: user.avatar,
      recruiterProfile: (() => {
        const profile = user.recruiterProfile ? user.recruiterProfile.toObject() : {};
        delete profile.phone; // contact details are unlocked through the platform, never published
        return profile;
      })(),
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
router.post('/contact', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many messages. Please try again later.' }), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        msg: 'Please provide name, email, and message.'
      });
    }

    // Save contact message
    const newContactMessage = new ContactMessage({
      name,
      email,
      subject: subject || 'No Subject',
      message
    });

    await newContactMessage.save();

    // Send admin email
    const emailSubject =
      `New Contact Form Submission: ${subject || 'No Subject'}`;

    const emailHtml = `
      <div style="font-family:sans-serif;max-width:600px;padding:20px;color:#333">
        <h2>New Contact Form Submission</h2>
        <p><strong>Website Enquiry:</strong> velaivaaipu.in</p>
        <p><strong>I am a:</strong> ${esc(String(req.body.segment || 'not said'))}</p>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Subject:</strong> ${esc(subject || 'No Subject')}</p>
        <p><strong>Message:</strong> ${esc(message)}</p>
      </div>
    `;

    const emailSent = await sendEmail({
      email: 'abmvelaivaaipu@gmail.com, admin@bmtechx.in',
      subject: emailSubject,
      html: emailHtml
    });

    if (!emailSent) {
      console.warn('Contact email notification failed.');
    }

    // Instant reply: mirror what they asked and point to the right sign-up (Smart Reply Mail Plan, Day 0).
    const SEGMENTS = {
      jobseeker: { label: 'job seeker', path: '/register?role=jobseeker', cta: 'Create my free profile' },
      company: { label: 'company', path: '/register?role=company', cta: 'Post my first job free' },
      college: { label: 'college', path: '/for-colleges', cta: 'See how campus placement works' },
    };
    const seg = SEGMENTS[req.body.segment] || null;
    const first = esc(String(name).split(' ')[0]);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) sendEmail({
      email: String(email).trim(),
      subject: 'We got your message',
      html: lifecycleWrapper('Thanks for contacting Velaivaaipu', `
        <p>Hi ${first},</p>
        <p>We got your message${seg ? ` as a ${seg.label}` : ''} and our team will reply soon.</p>
        <p>${seg ? 'You can get started right now:' : 'While you wait, you can create a free account:'}</p>
        ${frontend() ? button(`${frontend()}${seg ? seg.path : '/register'}`, seg ? seg.cta : 'Create my free account') : ''}
      `, null),
    }).catch(() => {});

    // Send enquiry to n8n
    try {
      const webhookData = {
        ...req.body,
        website: 'velaivaaipu.in',
        form: 'Contact Form'
      };

      await axios.post(
        'https://leados-n8n.abmgroups.org/webhook/contact-form',
        webhookData
      );
    } catch (webhookError) {
      console.error(
        'n8n webhook error:',
        webhookError.message
      );
    }

    return res.status(201).json({
      msg: 'Message sent successfully.'
    });

  } catch (err) {
    console.error('Public Contact Form Error:', err.message);

    return res.status(500).json({
      msg: 'Server Error'
    });
  }
});

module.exports = router;
