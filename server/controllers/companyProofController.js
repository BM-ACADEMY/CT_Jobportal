// Proof of business for companies that signed up with a free email (Gmail, Yahoo...) and are not verified yet.
//   POST /api/company/verification-proof      (company role, multipart: proofType, proofValue, optional proofFile PDF)
//   GET  /api/admin/company-proofs            (admin)  pending proofs
//   POST /api/admin/company-proofs/:id/approve|reject  (admin, note required)
// A submitted proof is an AdminRequest (type 'company_proof') so it shows in the Admin Needs-action inbox as a "request".
// Nothing here verifies a company by itself: only an admin approving does, with a written note, exactly like
// PATCH /api/admin/companies/:id/verify. Models are loaded inside the functions so the pure helpers load anywhere.
const fs = require('fs');
const path = require('path');

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const PROOF_TYPES = ['gst', 'registration', 'website', 'linkedin'];
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/;

const isHttpUrl = (v) => { try { const u = new URL(String(v)); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; } };

// Pure: checks what the company typed. Returns { error } or { proofType, proofValue }.
const checkProofInput = (body = {}, hasFile = false) => {
  const proofType = String(body.proofType || '').trim().toLowerCase();
  if (!PROOF_TYPES.includes(proofType)) return { error: 'Choose what you are sending: GST, registration, website or LinkedIn.' };
  const proofValue = String(body.proofValue || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!proofValue && !hasFile) return { error: 'Add the number or link, or upload a PDF.' };
  if (proofType === 'gst' && proofValue && !GSTIN.test(proofValue.toUpperCase())) return { error: 'That does not look like a 15-character GST number.' };
  if (proofType === 'registration' && proofValue && proofValue.length < 4) return { error: 'Enter the registration number as printed on your certificate.' };
  if (proofType === 'website' || proofType === 'linkedin') {
    if (!isHttpUrl(proofValue)) return { error: 'Enter the full link, starting with https://' };
    if (proofType === 'linkedin' && !/(^|\.)linkedin\.com$/i.test(new URL(proofValue).hostname)) return { error: 'Enter a linkedin.com link to your company page.' };
  }
  return { proofType, proofValue: proofType === 'gst' ? proofValue.toUpperCase() : proofValue };
};

const dropFile = (file) => { try { if (file && file.path) fs.unlinkSync(file.path); } catch { /* already gone */ } };

const submitProof = async (req, res) => {
  const file = req.file || null;
  try {
    const User = require('../models/User');
    const Company = require('../models/Company');
    const AdminRequest = require('../models/AdminRequest');

    const user = await User.findById(req.user.id).select('company email');
    const company = user && user.company ? await Company.findById(user.company).select('name is_verified') : null;
    if (!company) { dropFile(file); return res.status(404).json({ msg: 'Company not found.' }); }
    if (company.is_verified) { dropFile(file); return res.status(400).json({ msg: 'Your company is already verified.' }); }

    // Documents must be PDFs: PDFs stay behind signed links, while image files are public by address.
    if (file && path.extname(file.filename || file.originalname || '').toLowerCase() !== '.pdf') {
      dropFile(file); return res.status(400).json({ msg: 'Upload the document as a PDF, or paste a link instead.' });
    }
    const checked = checkProofInput(req.body, !!file);
    if (checked.error) { dropFile(file); return res.status(400).json({ msg: checked.error }); }

    if (await AdminRequest.exists({ company: company._id, type: 'company_proof', status: 'pending' })) {
      dropFile(file); return res.status(409).json({ msg: 'Your proof is already with our team. We will email you once it is checked.' });
    }

    const request = await AdminRequest.create({
      user: req.user.id, type: 'company_proof', company: company._id,
      bookingName: company.name || '', bookingEmail: user.email || '',
      proofType: checked.proofType, proofValue: checked.proofValue,
      proofFile: file ? `/uploads/${file.filename}` : '',
    });
    res.status(201).json({ msg: 'Thanks. Our team will check your proof, usually within one working day.', requestId: request._id });
  } catch (err) {
    dropFile(file);
    console.error('Company proof error:', err.message);
    res.status(500).json({ msg: 'Could not send your proof. Please try again.' });
  }
};

const adminOnly = (req, res) => {
  if (!req.user || req.user.role !== 'admin') { res.status(403).json({ msg: 'Only the admin can do this.' }); return false; }
  return true;
};

const listProofs = async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    const AdminRequest = require('../models/AdminRequest');
    const rows = await AdminRequest.find({ type: 'company_proof', status: 'pending' }).sort({ createdAt: 1 }).limit(100)
      .populate('company', 'name website is_verified').lean();
    let sign = (p) => p;
    try { sign = require('../utils/signedUploads').signUploadPath; } catch { /* links stay unsigned */ }
    res.json(rows.map((r) => ({
      _id: r._id, createdAt: r.createdAt, company: r.company, email: r.bookingEmail,
      proofType: r.proofType, proofValue: r.proofValue, proofFile: r.proofFile ? sign(r.proofFile) : '',
    })));
  } catch (err) {
    console.error('List proofs error:', err.message);
    res.status(500).json({ msg: 'Could not load proofs.' });
  }
};

const decide = (approve) => async (req, res) => {
  try {
    if (!adminOnly(req, res)) return;
    if (!OBJECT_ID.test(String(req.params.id || ''))) return res.status(400).json({ msg: 'Invalid id.' });
    const note = String((req.body && req.body.note) || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    if (note.length < 5) return res.status(400).json({ msg: 'Write what you checked (at least 5 characters).' });

    const AdminRequest = require('../models/AdminRequest');
    const Company = require('../models/Company');
    const request = await AdminRequest.findById(req.params.id);
    if (!request || request.type !== 'company_proof') return res.status(404).json({ msg: 'Proof not found.' });
    if (request.status !== 'pending') return res.status(409).json({ msg: 'This proof was already handled.' });

    if (approve) {
      const company = await Company.findById(request.company);
      if (!company) return res.status(404).json({ msg: 'Company not found.' });
      const was = !!company.is_verified;
      company.is_verified = true;
      company.verifiedAt = new Date();
      company.verifiedBy = req.user.id || req.user._id || null;
      company.verification_note = `Proof (${request.proofType}) checked: ${note}`.slice(0, 300);
      await company.save();
      if (!was) {
        try {
          const User = require('../models/User');
          const { notifyUsers } = require('../utils/inAppNotifications');
          User.find({ company: company._id }).select('_id').lean()
            .then((people) => notifyUsers({ io: req.io, recipientIds: people.map((p) => p._id), title: 'Your company is verified',
              message: `${company.name || 'Your company'} is now verified on Velaivaaipu. Your jobs are visible to job seekers.`, type: 'general', link: '/company/dashboard' }))
            .catch((e) => console.error('Verified notice failed:', e.message));
        } catch (e) { console.error('Verified notice failed:', e.message); }
      }
    }
    request.status = approve ? 'approved' : 'cancelled';
    request.adminNotes = note;
    await request.save();
    res.json({ msg: approve ? 'Proof approved. The company is verified.' : 'Proof rejected.', status: request.status });
  } catch (err) {
    console.error('Decide proof error:', err.message);
    res.status(500).json({ msg: 'Could not save the decision.' });
  }
};

module.exports = { submitProof, listProofs, approveProof: decide(true), rejectProof: decide(false), checkProofInput, PROOF_TYPES };
