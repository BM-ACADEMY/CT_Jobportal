const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');
const Job = require('../models/Job');
const Role = require('../models/Role');

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

module.exports = router;
