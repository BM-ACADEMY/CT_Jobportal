const Company = require('../models/Company');
const College = require('../models/College');
const Job = require('../models/Job');
const User = require('../models/User');
const { isSafeLogo, buildStrip } = require('../utils/logoStrip');

const HEX = /^[0-9a-fA-F]{24}$/;

// PATCH /api/company/logo-consent {show}   The company agrees (or stops agreeing) to show its logo. Does not publish it: an admin must approve.
const setLogoConsent = async (req, res) => {
  try {
    if (typeof req.body?.show !== 'boolean') return res.status(400).json({ msg: 'Send show as true or false' });
    const user = await User.findById(req.user.id).select('company');
    const company = user?.company ? await Company.findById(user.company) : null;
    if (!company) return res.status(404).json({ msg: 'Company not found' });
    company.showLogo = req.body.show;
    if (!req.body.show) company.logoApproved = false;   // withdrawing consent takes it down (the public strip refreshes within about 10 minutes)
    await company.save();
    res.json({ showLogo: company.showLogo, logoApproved: company.logoApproved });
  } catch (err) { console.error('Logo consent:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

// PATCH /api/admin/companies/:id/logo-approval {approved}   Super Admin. Needs: verified, the company agreed, a safe logo file.
const approveCompanyLogo = async (req, res) => {
  try {
    if (!HEX.test(req.params.id || '')) return res.status(400).json({ msg: 'Invalid company id' });
    if (typeof req.body?.approved !== 'boolean') return res.status(400).json({ msg: 'Send approved as true or false' });
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ msg: 'Company not found' });
    if (req.body.approved) {
      if (!company.is_verified) return res.status(400).json({ msg: 'Verify the company first' });
      if (!company.showLogo) return res.status(400).json({ msg: 'The company has not agreed to show its logo' });
      if (!isSafeLogo(company.logo)) return res.status(400).json({ msg: 'The logo must be a PNG, JPG or WebP file' });
    }
    company.logoApproved = req.body.approved; await company.save();
    res.json({ logoApproved: company.logoApproved });
  } catch (err) { console.error('Approve company logo:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

// PATCH /api/admin/colleges/:id/logo {show, note}   Super Admin, after the college agreed. Sets consent and approval together.
const setCollegeLogo = async (req, res) => {
  try {
    if (!HEX.test(req.params.id || '')) return res.status(400).json({ msg: 'Invalid college id' });
    if (typeof req.body?.show !== 'boolean') return res.status(400).json({ msg: 'Send show as true or false' });
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ msg: 'College not found' });
    const note = String(req.body.note || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    if (req.body.show) {
      if (college.verificationStatus !== 'verified') return res.status(400).json({ msg: 'Verify the college first' });
      if (!isSafeLogo(college.logo)) return res.status(400).json({ msg: 'The logo must be a PNG, JPG or WebP file' });
      if (note.length < 5) return res.status(400).json({ msg: 'Note how the college agreed (for example "agreed by phone, 9 Nov")' });
    }
    college.showLogo = req.body.show; college.logoApproved = req.body.show; college.logoConsentNote = req.body.show ? note : '';
    await college.save();
    res.json({ showLogo: college.showLogo });
  } catch (err) { console.error('College logo:', err.message); res.status(500).json({ msg: 'Server error' }); }
};

// GET /api/public/logos   Real organisations only. Each strip is [] when fewer than 4 qualify.
const publicLogos = async () => {
  const hiringIds = await Job.distinct('company', { status: 'active', company: { $ne: null } });
  const [companies, colleges] = await Promise.all([
    Company.find({ _id: { $in: hiringIds }, is_verified: true, showLogo: true, logoApproved: true }).select('name logo').lean(),
    College.find({ verificationStatus: 'verified', isTest: { $ne: true }, showLogo: true, logoApproved: true }).select('name logo').lean(),
  ]);
  const shape = (rows, base) => buildStrip(rows).map((r) => ({ id: String(r._id), name: r.name, logo: r.logo, link: base ? `${base}/${r._id}` : '' }));
  return { hiring: shape(companies, '/companies'), colleges: shape(colleges, '') };
};

module.exports = { setLogoConsent, approveCompanyLogo, setCollegeLogo, publicLogos };
