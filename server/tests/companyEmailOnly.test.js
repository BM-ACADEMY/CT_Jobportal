const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { blocksCompanySignup, isPersonalEmail, emailKind } = require('../utils/emailKind');
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');

test('free inboxes are refused for companies and recruiters only', () => {
  for (const e of ['a@gmail.com', 'b@yahoo.co.in', 'c@outlook.com', 'd@hotmail.com', 'e@rediffmail.com', 'F@GMAIL.COM ']) {
    assert.strictEqual(blocksCompanySignup('company', e), true, e);
    assert.strictEqual(blocksCompanySignup('recruiter', e), true, e);
    assert.strictEqual(blocksCompanySignup('jobseeker', e), false, e);
    assert.strictEqual(blocksCompanySignup('college', e), false, e);
  }
  assert.strictEqual(blocksCompanySignup('company', 'hr@sritraders.in'), false);
  assert.strictEqual(isPersonalEmail('x@gmail.com.evil.in'), false, 'only the real domain counts');
});
test('both sign-up paths (email and finishing a social sign-up) refuse a free inbox with a clear reason', () => {
  const a = read('../controllers/authController.js');
  assert.strictEqual((a.match(/blocksCompanySignup\(role, /g) || []).length, 2);
  assert.match(a, /code: 'company_email_required'/);
  assert.match(read('../utils/emailKind.js'), /Gmail, Yahoo and other free email addresses are not accepted/);
});
test('auto-verify needs a confirmed email, a new company, and a website on the same domain', () => {
  assert.strictEqual(emailKind('hr@sritraders.in', 'https://www.sritraders.in').matchesWebsite, true);
  assert.strictEqual(emailKind('hr@sritraders.in', 'https://sritraders.com').matchesWebsite, false);
  assert.strictEqual(emailKind('hr@sritraders.in', '').matchesWebsite, false);
  assert.strictEqual(emailKind('a@gmail.com', 'gmail.com').matchesWebsite, false, 'a free inbox never auto-verifies');
  const r = read('../controllers/recruiterController.js');
  const create = r.slice(r.indexOf('company = new Company(sanitizedCompanyData);'), r.indexOf('} else {', r.indexOf('company = new Company(sanitizedCompanyData);')));
  assert.match(create, /user\.isVerified && emailKind\(user\.email, sanitizedCompanyData\.website\)\.matchesWebsite/);
  const upd = r.slice(r.indexOf('// Update existing'));
  assert.ok(!/is_verified = true/.test(upd.slice(0, 400)), 'updating an existing company never verifies it');
});
test('an unverified company is still hidden from the public and the admin can still unverify', () => {
  assert.match(read('../utils/publicVisibility.js'), /is_verified: true/);
  assert.match(read('../controllers/companyVerificationController.js'), /company\.is_verified = verified/);
});
test('the sign-up page tells companies to use a company email', () => {
  const c = read('../../client/src/pages/auth/Register.jsx');
  assert.match(c, /Company Email/);
  assert.match(c, /Gmail, Yahoo and other free email addresses are not accepted here/);
});
