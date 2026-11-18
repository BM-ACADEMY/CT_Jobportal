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

    const wasVerified = !!company.is_verified;
    company.is_verified = verified;
    company.verifiedAt = verified ? new Date() : null;
    company.verifiedBy = verified ? (req.user && (req.user.id || req.user._id)) || null : null;
    company.verification_note = note;
    await company.save();

    // Tell the company's people (by email and in the app) the first time it becomes verified. Never blocks the answer.
    if (verified && !wasVerified) {
      try {
        // Loaded here so the badge itself never depends on the notification code.
        const User = require('../models/User');
        const { notifyUsers } = require('../utils/inAppNotifications');
        User.find({ company: company._id }).select('_id').lean()
          .then((people) => notifyUsers({
            io: req.io,
            recipientIds: people.map((p) => p._id),
            title: 'Your company is verified',
            message: `${company.name || 'Your company'} is now verified on Velaivaaipu. Your jobs are visible to job seekers.`,
            type: 'general',
            link: '/company/dashboard',
          }))
          .catch((e) => console.error('Verified notice failed:', e.message));
      } catch (e) { console.error('Verified notice failed:', e.message); }
    }

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

// Admin: "Verified employer" flag, set when a telecaller phoned the company and confirmed it is real.
//   PATCH /api/admin/companies/:id/verified-by-call   body: { value: boolean, note: string }
// Admin only: registered after authorizeRoles('admin') in adminRoutes.js, and checked again here so staff or any other role
// can never set it even if the route is moved. It is separate from is_verified and does not verify the company.
const setVerifiedByCall = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ msg: 'Only the admin can set this.' });
    const { id } = req.params;
    if (!OBJECT_ID.test(String(id || ''))) return res.status(400).json({ msg: 'Invalid company id.' });
    const value = req.body && req.body.value;
    if (typeof value !== 'boolean') return res.status(400).json({ msg: 'Send value as true or false.' });
    const note = String((req.body && req.body.note) || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    if (note.length < 5) return res.status(400).json({ msg: 'Write who called and what they confirmed (at least 5 characters).' });

    const company = await Company.findById(id);
    if (!company) return res.status(404).json({ msg: 'Company not found.' });
    company.verifiedByCall = value;
    company.verifiedByCallAt = value ? new Date() : null;
    company.verifiedByCallBy = value ? (req.user.id || req.user._id) || null : null;
    company.verifiedByCallNote = note;
    await company.save();
    res.json({
      msg: value ? 'Marked as a verified employer.' : 'Verified employer mark removed.',
      company: { _id: company._id, verifiedByCall: company.verifiedByCall, verifiedByCallAt: company.verifiedByCallAt, verifiedByCallNote: company.verifiedByCallNote },
    });
  } catch (err) {
    console.error('Set verified by call error:', err.message);
    res.status(500).json({ msg: 'Could not update the verified employer mark.' });
  }
};

module.exports = { setCompanyVerified, setVerifiedByCall };
