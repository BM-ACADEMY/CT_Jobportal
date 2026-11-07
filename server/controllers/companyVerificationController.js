// Admin: mark a company as verified, or take the badge back.
//   PATCH /api/admin/companies/:id/verify   body: { verified: boolean, note: string }
// Registered below the admin-only gate in adminRoutes.js. Companies cannot send these fields themselves
// (utils/companyData.js strips them), so this is the only way the badge changes.
const Company = require('../models/Company');

const OBJECT_ID = /^[a-f0-9]{24}$/i;

const setCompanyVerified = async (req, res) => {
  try {
    const { id } = req.params;
    if (!OBJECT_ID.test(String(id || ''))) return res.status(400).json({ msg: 'Invalid company id.' });

    const verified = req.body && req.body.verified;
    if (typeof verified !== 'boolean') return res.status(400).json({ msg: 'Send verified as true or false.' });

    const note = String((req.body && req.body.note) || '').trim().slice(0, 300);
    if (verified && note.length < 5) {
      return res.status(400).json({ msg: 'Write what you checked before verifying (at least 5 characters).' });
    }

    const company = await Company.findById(id);
    if (!company) return res.status(404).json({ msg: 'Company not found.' });

    company.is_verified = verified;
    company.verifiedAt = verified ? new Date() : null;
    company.verifiedBy = verified ? (req.user && (req.user.id || req.user._id)) || null : null;
    company.verification_note = note;
    await company.save();

    res.json({
      msg: verified ? 'Company marked as verified.' : 'Verified badge removed.',
      company: {
        _id: company._id,
        is_verified: company.is_verified,
        verifiedAt: company.verifiedAt,
        verification_note: company.verification_note,
      },
    });
  } catch (err) {
    console.error('Set company verified error:', err.message);
    res.status(500).json({ msg: 'Could not update the verified badge.' });
  }
};

module.exports = { setCompanyVerified };
