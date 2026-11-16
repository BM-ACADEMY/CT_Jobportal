const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const read = (...p) => fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'src', ...p), 'utf8');

test('brand leads page has status counts, a follow-up filter, WhatsApp and call, and a follow-up date', () => {
  const s = read('pages', 'admin', 'BrandLeads.jsx');
  for (const t of ['lead-filters', 'lead-whatsapp', 'lead-card']) assert.ok(s.includes(`data-testid="${t}"`), t);
  assert.match(s, /Follow up today/); assert.match(s, /type="date"/); assert.match(s, /wa\.me\//);
  assert.match(s, /rel="noopener noreferrer"/);
  assert.match(s, /contacted: true/);
});

test('both brand messages mention the sister-brand relationship and the first name', () => {
  const s = read('pages', 'admin', 'BrandLeads.jsx');
  assert.match(s, /academy: \(r\) => `Hi \$\{firstName\(r\.name\)\}, this is BM Academy, a sister brand of Velaivaaipu/);
  assert.match(s, /coretalents: \(r\) => `Hi \$\{firstName\(r\.name\)\}, this is CoreTalents, a sister brand of Velaivaaipu/);
});

test('the consent nudge shows on My Applications, stays optional, and hides once agreed', () => {
  assert.match(read('pages', 'jobseeker', 'MyApplications.jsx'), /<BrandConsent nudge \/>/);
  const b = read('components', 'profile', 'BrandConsent.jsx');
  assert.match(b, /nudge && on/);
  assert.match(b, /checked=\{on\}/);
  assert.ok(!/useState\(true\)/.test(b), 'never pre-ticked');
});

test('help requests show their message in View and are not assigned to recruiters', () => {
  const s = read('pages', 'admin', 'ManageRequests.jsx');
  assert.match(s, /data-testid="help-request-view"/);
  assert.match(s, /viewReq\.notes/);
  assert.match(s, /r\.type !== 'help_request'/);
});
