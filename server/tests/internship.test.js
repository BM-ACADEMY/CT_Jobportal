const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanInternship, freeInternshipSlot, FREE_LIVE_INTERNSHIPS } = require('../utils/internship');

const good = { durationMonths: 3, stipendType: 'paid', stipendAmount: 5000, mode: 'remote', certificate: true, ppo: false };

test('a good internship passes; stipend rules are strict', () => {
  assert.deepEqual(cleanInternship(good).data, { durationMonths: 3, stipendType: 'paid', stipendAmount: 5000, mode: 'remote', certificate: true, ppo: false });
  assert.deepEqual(cleanInternship({ ...good, stipendType: 'unpaid', stipendAmount: 999 }).data.stipendAmount, 0, 'unpaid always stores zero');
  for (const bad of [null, 'x', { ...good, durationMonths: 0 }, { ...good, durationMonths: 13 }, { ...good, durationMonths: 2.5 }, { ...good, stipendType: '' }, { ...good, stipendType: 'paid', stipendAmount: 0 }, { ...good, stipendType: 'paid', stipendAmount: 'lots' }, { ...good, stipendType: 'paid', stipendAmount: 999999 }, { ...good, mode: 'moon' }]) assert.ok(cleanInternship(bad).error, JSON.stringify(bad));
});

test('certificate and pre-placement offer are only true when sent as true', () => {
  const r = cleanInternship({ ...good, certificate: 'yes', ppo: 1 });
  assert.equal(r.data.certificate, false); assert.equal(r.data.ppo, false);
});

test('free only for verified companies, up to three live', () => {
  assert.equal(FREE_LIVE_INTERNSHIPS, 3);
  assert.equal(freeInternshipSlot({ isInternship: true, companyVerified: true, liveFree: 2 }), true);
  assert.equal(freeInternshipSlot({ isInternship: true, companyVerified: true, liveFree: 3 }), false);
  assert.equal(freeInternshipSlot({ isInternship: true, companyVerified: false, liveFree: 0 }), false);
  assert.equal(freeInternshipSlot({ isInternship: false, companyVerified: true, liveFree: 0 }), false);
});

const { summariseInternshipApps } = require('../utils/internship');
test('college summary counts applications, distinct students and outcomes', () => {
  const rows = [{ student: 'a', status: 'pending' }, { student: 'a', status: 'shortlisted' }, { student: 'b', status: 'accepted' }, { student: 'c', status: 'rejected' }];
  assert.deepEqual(summariseInternshipApps(rows), { applications: 4, students: 3, shortlisted: 1, selected: 1, rejected: 1 });
  assert.deepEqual(summariseInternshipApps([]), { applications: 0, students: 0, shortlisted: 0, selected: 0, rejected: 0 });
});
