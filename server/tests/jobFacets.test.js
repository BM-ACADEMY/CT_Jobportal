const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const S = require('../utils/jobFacets');
const { guessCategory, cleanCategory } = require('../config/jobCategories');

// The filter and display rules live in the client file; load that same file here.
let C;
test.before(async () => { C = await import(pathToFileURL(path.join(__dirname, '../../client/src/data/jobFacets.js')).href); });

test('education keys: known pass, anything else is empty', () => {
  assert.equal(S.cleanEducation('12th'), '12th');
  assert.equal(S.cleanEducation(' ITI-Diploma '), 'iti-diploma');
  assert.equal(S.cleanEducation('phd'), '');
  assert.equal(S.cleanEducation({ $gt: '' }), '');
  assert.equal(S.cleanEducation(undefined), '');
});

test('pay unit defaults to year, so old jobs and odd values keep working', () => {
  assert.equal(S.cleanPayUnit('day'), 'day');
  assert.equal(S.cleanPayUnit('weekly'), 'year');
  assert.equal(S.cleanPayUnit(undefined), 'year');
  assert.deepEqual(S.cleanSalary({ min: 100, unit: 'hour' }), { min: 100, unit: 'hour' });
  assert.equal(S.cleanSalary({ min: 1 }).unit, 'year');
  assert.equal(S.cleanSalary(undefined), undefined);
});

test('contract length and part-time hours are kept only for their job type', () => {
  const c = S.cleanFacets({ jobType: 'Contract', contractMonths: 6, partTime: { hoursPerDay: 4, schedule: 'evenings' }, education: '10th', freshersWelcome: true });
  assert.equal(c.contractMonths, 6); assert.deepEqual(c.partTime, { hoursPerDay: null, schedule: '' });
  assert.equal(c.education, '10th'); assert.equal(c.freshersWelcome, true);
  const p = S.cleanFacets({ jobType: 'Part-time', contractMonths: 6, partTime: { hoursPerDay: 4, schedule: 'weekends' } });
  assert.equal(p.contractMonths, null); assert.deepEqual(p.partTime, { hoursPerDay: 4, schedule: 'weekends' });
  const f = S.cleanFacets({ jobType: 'Full-time', contractMonths: 6 });
  assert.equal(f.contractMonths, null); assert.equal(f.freshersWelcome, false);
});

test('bad numbers are dropped', () => {
  assert.equal(S.cleanContractMonths(0), null);
  assert.equal(S.cleanContractMonths(37), null);
  assert.equal(S.cleanContractMonths('abc'), null);
  assert.equal(S.cleanContractMonths(12), 12);
  assert.equal(S.cleanPartTime({ hoursPerDay: 12, schedule: 'x' }).hoursPerDay, null);
  assert.equal(S.cleanPartTime('x').schedule, '');
});

test('pay is compared per month whatever unit the job uses', () => {
  assert.equal(C.monthlyPay({ salary: { min: 360000 } }), 30000);               // old job, yearly
  assert.equal(C.monthlyPay({ salary: { min: 18000, unit: 'month' } }), 18000);
  assert.equal(C.monthlyPay({ salary: { min: 600, unit: 'day' } }), 15600);
  assert.equal(C.monthlyPay({ salary: { min: 100, unit: 'hour' }, partTime: { hoursPerDay: 4 } }), 10400);
  assert.equal(C.monthlyPay({ salary: { min: 500000, isRangeHidden: true } }), 0);
  assert.equal(C.monthlyPay({}), 0);
});

test('education filter: accepts this level or lower; unstated jobs only suit graduates', () => {
  assert.equal(C.educationFits({ education: '10th' }, '12th'), true);
  assert.equal(C.educationFits({ education: 'graduate' }, '12th'), false);
  assert.equal(C.educationFits({ education: 'any' }, '10th'), true);
  assert.equal(C.educationFits({}, '12th'), false);          // never claims a job with no stated level is open to non-graduates
  assert.equal(C.educationFits({}, 'graduate'), true);
  assert.equal(C.educationFits({ education: 'postgraduate' }, 'graduate'), false);
  assert.equal(C.educationFits({ education: 'graduate' }, ''), true); // no filter chosen
});

test('posted-within uses the post date', () => {
  const now = Date.parse('2026-11-10T00:00:00Z');
  assert.equal(C.postedWithinDays({ createdAt: '2026-11-09T12:00:00Z' }, 1, now), true);
  assert.equal(C.postedWithinDays({ createdAt: '2026-11-01T00:00:00Z' }, 7, now), false);
  assert.equal(C.postedWithinDays({ createdAt: 'bad' }, 7, now), false);
  assert.equal(C.postedWithinDays({}, 0, now), true);
});

test('pay text', () => {
  assert.equal(C.formatPay({ min: 350000, max: 600000 }), '₹3.5–6.0 LPA');
  assert.equal(C.formatPay({ min: 15000, max: 22000, unit: 'month' }), '₹15,000–22,000 / month');
  assert.equal(C.formatPay({ min: 600, unit: 'day' }), '₹600 / day');
  assert.equal(C.formatPay({ isRangeHidden: true }), 'Not Disclosed');
  assert.equal(C.formatPay({ min: 0, max: 0 }), 'Competitive');
  assert.equal(C.formatPay(undefined), 'Not Disclosed');
});

test('card facts', () => {
  assert.deepEqual(C.jobFacts({ education: '12th', jobType: 'Contract', contractMonths: 6, freshersWelcome: true }), ['12th pass', 'Contract · 6 months', 'Freshers welcome']);
  assert.deepEqual(C.jobFacts({ jobType: 'Part-time', partTime: { hoursPerDay: 4, schedule: 'evenings' } }), ['Part-time · 4 h/day · Evenings']);
  assert.deepEqual(C.jobFacts({ jobType: 'Full-time' }), []);
});

test('skilled trades category', () => {
  assert.equal(guessCategory({ title: 'Electrician' }), 'skilled-trades');
  assert.equal(guessCategory({ title: 'AC Repair Technician' }), 'skilled-trades');
  assert.equal(guessCategory({ title: 'Delivery Executive' }), 'logistics-delivery');
  assert.equal(cleanCategory('skilled-trades'), 'skilled-trades');
});
