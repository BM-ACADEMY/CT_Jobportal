// Cleans the company fields sent from the profile form before they reach the Company model.
// The web client always sends foundedYear ('' when empty); an API caller may omit it or send text.
// Anything that is not a whole number is dropped instead of becoming NaN (which failed validation
// with a 500). An empty slug is dropped so the sparse unique index is not hit.
const sanitizeCompanyData = (companyData = {}) => {
  const out = { ...companyData };
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

module.exports = { sanitizeCompanyData };
