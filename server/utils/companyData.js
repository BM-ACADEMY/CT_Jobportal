// Cleans the company fields sent from the profile form before they reach the Company model.
// The web client always sends foundedYear ('' when empty); an API caller may omit it or send text.
// Anything that is not a whole number is dropped instead of becoming NaN (which failed validation
// with a 500). An empty slug is dropped so the sparse unique index is not hit.
// Fields only an admin may change. A company must never be able to send these from its own profile form.
const ADMIN_ONLY_FIELDS = ['is_verified', 'verifiedAt', 'verifiedBy', 'verification_note', 'logoApproved'];

const sanitizeCompanyData = (companyData = {}) => {
  const out = { ...companyData };
  ADMIN_ONLY_FIELDS.forEach((key) => { delete out[key]; });
  const year = out.foundedYear;
  if (year === null || year === undefined || String(year).trim() === '' || Number.isNaN(Number(year))) {
    delete out.foundedYear;
  } else {
    out.foundedYear = Number(year);
  }
  if (!out.slug || String(out.slug).trim() === '') {
    delete out.slug;
  } else {
    out.slug = String(out.slug).trim().toLowerCase().replace(/\s+/g, '-');
  }
  return out;
};

module.exports = { sanitizeCompanyData, ADMIN_ONLY_FIELDS };
