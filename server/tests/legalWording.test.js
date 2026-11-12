const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8');
const { REFUND_WINDOW_DAYS } = require('../utils/refundPolicy');

test('every refund mention uses the real window, and the contact email is one address', () => {
  assert.strictEqual(REFUND_WINDOW_DAYS, 10);
  assert.ok(!/24 hours, nothing used/.test(read('server/utils/lifecycleEmails.js')));
  assert.ok(!/within 24 hours/.test(read('server/utils/assistant.js')));
  for (const f of ['client/src/components/legal/LegalPage.jsx', 'client/src/pages/TermsAndConditions.jsx', 'server/utils/accountDeletion.js', 'server/utils/lifecycleEmails.js']) {
    assert.ok(!/support@velaivaaipu\.in/.test(read(f)), f);
  }
  assert.ok(/hello@velaivaaipu\.in/.test(read('client/src/components/legal/LegalPage.jsx')));
});

test('terms and privacy explain jobs applied for on the employer site', () => {
  assert.ok(/Apply on company site/.test(read('client/src/pages/TermsAndConditions.jsx')));
  assert.ok(/Apply on company site/.test(read('client/src/pages/PrivacyPolicy.jsx')));
});

test('home stat says Job Seekers, not Students', () => {
  const s = read('client/src/pages/home/HomeGuest.jsx');
  assert.ok(!/label: 'Students'/.test(s) && /label: 'Job Seekers'/.test(s));
});

test('terms: Puducherry courts, GST line, college pack rules, grievance officer, new date', () => {
  const t = read('client/src/pages/TermsAndConditions.jsx');
  assert.ok(/courts of Puducherry/.test(t) && !/courts of Chennai/.test(t));
  assert.ok(/GST at 18% is added at checkout/.test(t));
  assert.ok(/250 student places/.test(t) && /at most 2 packs/.test(t));
  assert.ok(/Grievance Officer/.test(t) && /November 16, 2026/.test(t));
  const p = read('client/src/pages/PrivacyPolicy.jsx');
  assert.ok(/Grievance Officer/.test(p) && /November 16, 2026/.test(p));
});

test('job page shows company size only when the company entered it; no "calls" promise', () => {
  const j = read('client/src/pages/JobDetails.jsx');
  assert.ok(!/500\+ Employees/.test(j) && /company_size_range/.test(j));
  assert.ok(/company_size_range/.test(read('server/controllers/jobController.js')));
  assert.ok(!/our team calls and checks every company/.test(read('client/src/pages/AudienceLanding.jsx')));
});
