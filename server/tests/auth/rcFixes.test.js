'use strict';
// Three bugs found in the role-by-role test of release-candidate.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeCompanyData } = require('../../utils/companyData');
const { activeJobCountQuery } = require('../../utils/jobCountQuery');
const { teamMemberFilter } = require('../../utils/teamMembership');

describe('company profile: foundedYear and slug', () => {
  it('drops a missing, empty, null or non-numeric foundedYear instead of producing NaN', () => {
    for (const v of [undefined, null, '', 'abc', ' ']) {
      const out = sanitizeCompanyData({ name: 'ABC', ...(v === undefined ? {} : { foundedYear: v }) });
      assert.equal('foundedYear' in out, false, `foundedYear=${JSON.stringify(v)}`);
      assert.equal(out.name, 'ABC');
    }
  });
  it('keeps a real year as a number', () => {
    assert.equal(sanitizeCompanyData({ foundedYear: '2015' }).foundedYear, 2015);
    assert.equal(sanitizeCompanyData({ foundedYear: 2015 }).foundedYear, 2015);
  });
  it('drops an empty slug and normalises a real one', () => {
    assert.equal('slug' in sanitizeCompanyData({ slug: '  ' }), false);
    assert.equal(sanitizeCompanyData({ slug: ' ABC  Pvt Ltd ' }).slug, 'abc-pvt-ltd');
  });
  it('does not mutate the input', () => {
    const input = { foundedYear: '', slug: '' };
    sanitizeCompanyData(input);
    assert.deepEqual(input, { foundedYear: '', slug: '' });
  });
});

describe('job posting limit: which jobs are counted', () => {
  const base = { status: { $in: ['active', 'closed'] } };
  it('a solo recruiter counts their own jobs', () => {
    assert.deepEqual(activeJobCountQuery({ role: { name: 'recruiter' }, company: 'co1' }, 'u1'), { ...base, recruiter: 'u1' });
  });
  it('a company owner with a company counts the company jobs', () => {
    assert.deepEqual(activeJobCountQuery({ role: { name: 'company' }, company: 'co1' }, 'u1'), { ...base, company: 'co1' });
  });
  it('a company owner with no company yet counts their own jobs, never the whole platform', () => {
    const q = activeJobCountQuery({ role: { name: 'company' }, company: null }, 'u1');
    assert.deepEqual(q, { ...base, recruiter: 'u1' });
    assert.ok(q.recruiter || q.company, 'the query is always narrowed to one person or one company');
  });
  it('an org employee with a company counts the company jobs', () => {
    assert.deepEqual(activeJobCountQuery({ role: { name: 'org_employee' }, company: 'co1' }, 'u9'), { ...base, company: 'co1' });
  });
});

describe('team seats: the owner is not a seat', () => {
  it('the filter used by invite, seat toggle and reconcile excludes the owner', () => {
    assert.deepEqual(teamMemberFilter('co1', 'owner1'), { $or: [{ company: 'co1' }, { employerCompany: 'co1' }], _id: { $ne: 'owner1' } });
  });
  it('a 1-seat plan can therefore take one team member', () => {
    const members = [{ _id: 'owner1', company: 'co1' }];
    const count = (filter) => members.filter(m => (m.company === filter.$or[0].company || m.employerCompany === filter.$or[1].employerCompany) && m._id !== filter._id.$ne).length;
    assert.equal(count(teamMemberFilter('co1', 'owner1')), 0, 'owner alone: 0 seats used');
    members.push({ _id: 'm1', company: 'co1' });
    assert.equal(count(teamMemberFilter('co1', 'owner1')), 1, 'one member: 1 seat used');
  });
});
