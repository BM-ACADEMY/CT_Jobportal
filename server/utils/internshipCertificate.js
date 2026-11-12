// Application status side effects: first-response time (for "Usually responds in...") and the internship
// completion certificate. Pure functions; no database access, so they load and test without mongoose.
const crypto = require('crypto');

// Statuses that count as "the company has looked at it". 'withdrawn' is the applicant's own move, so it never counts.
const RESPONSE_STATUSES = ['reviewed', 'shortlisted', 'rejected', 'accepted'];
// No 0/O/1/I/L so a code read out over the phone is not misheard.
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_RE = /^VV-[A-HJKMNP-Z2-9]{10}$/;

const generateCertificateCode = (randomBytes = crypto.randomBytes) => {
  const bytes = randomBytes(10);
  let out = '';
  for (let i = 0; i < 10; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return `VV-${out}`;
};
const isValidCode = (code) => CODE_RE.test(String(code || '').trim().toUpperCase());

// What to save besides `status` when a company changes an application's status.
// existing = { status, createdAt, firstResponseAt, certificateCode }; job = { jobType, internship }.
// Returns { error } (nothing may be saved) or { set } (extra fields for $set).
const statusUpdateExtras = ({ existing, job, status, now = new Date(), makeCode = generateCertificateCode }) => {
  const set = {};
  if (status === undefined || status === existing.status) return { set };
  if (status === 'completed') {
    if (job?.jobType !== 'Internship') return { error: 'Only an internship application can be marked completed' };
    if (existing.status !== 'accepted') return { error: 'Select the intern first, then mark the internship completed' };
    set.completedAt = now;
    if (job.internship?.certificate === true && !existing.certificateCode) set.certificateCode = makeCode();
    return { set };
  }
  if (RESPONSE_STATUSES.includes(status) && !existing.firstResponseAt && existing.status === 'pending') {
    // Never store a negative interval (clock skew or a back-dated record).
    if (!existing.createdAt || now.getTime() >= new Date(existing.createdAt).getTime()) set.firstResponseAt = now;
  }
  return { set };
};

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const asDate = (d) => (d && !Number.isNaN(new Date(d).getTime()) ? new Date(d).toISOString().slice(0, 10) : null);

// The only things a certificate says. Anything missing is left out rather than guessed.
const buildCertificate = ({ application, applicant, job, company }) => {
  if (!application?.certificateCode || application.status !== 'completed' || !application.completedAt) return null;
  return {
    code: application.certificateCode,
    name: applicant?.name || '',
    company: company?.name || '',
    role: job?.title || '',
    appliedOn: asDate(application.createdAt),
    completedOn: asDate(application.completedAt),
  };
};

module.exports = { RESPONSE_STATUSES, generateCertificateCode, isValidCode, statusUpdateExtras, buildCertificate, esc };
