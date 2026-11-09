// A person agrees to be contacted by BM Academy only by ticking the box. Unticked, missing or "true" as text never counts.
const grantFromForm = (user, body, source = 'counselling', now = new Date()) => {
  if (body?.brandContact !== true || user?.brandConsent?.contact) return false;
  user.brandConsent = { contact: true, at: now, withdrawnAt: null, source };
  return true;
};
module.exports = { grantFromForm };
