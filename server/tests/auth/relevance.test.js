const test = require('node:test');
const assert = require('node:assert/strict');
const { canonicalSkill } = require('../../utils/skillAliases');
const { scoreJobForSeeker, rankJobsForSeeker, isExcluded, isThinProfile, experienceYears } = require('../../utils/relevance');

const NOW = new Date('2026-11-01T10:00:00Z');
const daysAgo = (d) => new Date(NOW.getTime() - d * 86400000);

const student = (over = {}) => ({
  name: 'Priya', gender: 'female',
  profile: {
    skills: ['MS Excel', 'Tally Prime', 'Typing'], preferredRole: 'Accounts Assistant', headline: 'Commerce graduate',
    location: 'Pondicherry', profileCompletion: 80, qualification: [{ degree: 'B.Com' }], experience: [],
    jobPreferences: { jobTitles: ['Accountant'], locationTypes: ['On-site'], onSiteLocations: [{ city: 'Pondicherry' }] },
    ...over,
  },
});
const job = (over = {}) => ({
  _id: 'j1', title: 'Accounts Assistant', status: 'active', skillsRequired: ['Excel', 'Tally', 'GST'], location: 'Pondicherry',
  workMode: 'On-site', experience: { min: 0, max: 2 }, createdAt: daysAgo(1), validThrough: daysAgo(-20), ...over,
});
const welder = (over = {}) => job({ title: 'Welder', skillsRequired: ['Welding', 'Fabrication'], location: 'Delhi', ...over });

test('skill aliases: spellings and level words reduce to one name', () => {
  assert.equal(canonicalSkill('MS Excel'), 'excel');
  assert.equal(canonicalSkill('Microsoft Excel (Advanced)'), 'excel');
  assert.equal(canonicalSkill('excel advanced'), 'excel');
  assert.equal(canonicalSkill('Tally ERP 9'), 'tally');
  assert.equal(canonicalSkill('Basic Computer Knowledge'), 'computer basics');
  assert.equal(canonicalSkill('ReactJS'), 'react');
  assert.equal(canonicalSkill('Welding'), 'welding');
  assert.equal(canonicalSkill(''), '');
});

test('a strong match scores high and explains why', () => {
  const r = scoreJobForSeeker(student(), job(), { now: NOW });
  assert.ok(r.score >= 80, `score ${r.score}`);
  assert.deepEqual([...r.matchedSkills].sort(), ['excel', 'tally']);
  assert.ok(r.reasons.some((x) => /Excel/.test(x) && /Tally/.test(x)));
  assert.ok(r.reasons.includes('In Pondicherry'));
  assert.ok(r.reasons.includes('Open to freshers'));
});

test('several matching skills beat a one-skill match', () => {
  const many = scoreJobForSeeker(student(), job({ skillsRequired: ['Excel', 'Tally', 'Typing'] }), { now: NOW });
  const one = scoreJobForSeeker(student(), job({ skillsRequired: ['Excel', 'Welding', 'Driving', 'SQL', 'Java'], title: 'Machine Operator' }), { now: NOW });
  assert.ok(many.score > one.score + 20, `${many.score} vs ${one.score}`);
});

test('an unrelated job stays low even though it is brand new', () => {
  const r = scoreJobForSeeker(student(), welder({ createdAt: daysAgo(0) }), { now: NOW });
  assert.ok(r.score <= 20, `score ${r.score}`);
});

test('freshness decays over 30 days', () => {
  const fresh = scoreJobForSeeker(student(), job({ createdAt: daysAgo(0) }), { now: NOW });
  const old = scoreJobForSeeker(student(), job({ createdAt: daysAgo(30) }), { now: NOW });
  assert.ok(fresh.score > old.score);
  assert.equal(old.parts.freshness, 0);
});

test('priority adds at most 5, only to a job that already matches, and never lifts an unrelated job', () => {
  const plain = scoreJobForSeeker(student(), job(), { now: NOW });
  const boosted = scoreJobForSeeker(student(), job({ isPriority: true }), { now: NOW });
  assert.ok(boosted.score - plain.score <= 5 && boosted.score >= plain.score);
  assert.equal(boosted.priority, true);
  const unrelated = scoreJobForSeeker(student(), welder({ isPriority: true }), { now: NOW });
  assert.equal(unrelated.score, unrelated.base);
  const ranked = rankJobsForSeeker(student(), [welder({ _id: 'p', isPriority: true }), job({ _id: 'good' })], { now: NOW });
  assert.equal(ranked[0].job._id, 'good');
});

test('freshers still see entry-level jobs; a senior role ranks below for them but is not hidden', () => {
  const entry = scoreJobForSeeker(student(), job({ experience: { min: 0, max: 1 } }), { now: NOW });
  const senior = scoreJobForSeeker(student(), job({ experience: { min: 6, max: 10 } }), { now: NOW });
  assert.ok(entry.score > senior.score);
  assert.equal(rankJobsForSeeker(student(), [job({ experience: { min: 6, max: 10 } })], { now: NOW }).length, 1);
});

test('experience years are read from durations', () => {
  assert.equal(experienceYears({ experience: [{ duration: '2 years' }, { duration: '6 months' }] }), 2.5);
  assert.equal(experienceYears({ experience: [{ duration: 'a long time' }] }), 0);
});

test('remote jobs fit a person who accepts remote work, in any city', () => {
  const u = student({ jobPreferences: { locationTypes: ['Remote'], onSiteLocations: [] }, location: 'Chennai' });
  const r = scoreJobForSeeker(u, job({ workMode: 'Remote', location: 'Bengaluru' }), { now: NOW });
  assert.equal(r.parts.location, 15);
  assert.ok(r.reasons.includes('Remote, as you prefer'));
});

test('applied, closed, expired, draft and blocked jobs are never shown', () => {
  const u = { ...student(), blockedEntities: ['co-bad'] };
  const jobs = [
    job({ _id: 'ok' }), job({ _id: 'applied' }), job({ _id: 'closed', status: 'closed' }), job({ _id: 'draft', status: 'draft' }),
    job({ _id: 'old', validThrough: daysAgo(1) }), job({ _id: 'blocked', company: 'co-bad' }),
  ];
  const ids = rankJobsForSeeker(u, jobs, { appliedJobIds: ['applied'], now: NOW }).map((r) => r.job._id);
  assert.deepEqual(ids, ['ok']);
  assert.equal(isExcluded(job({ status: 'inactive' }), u, { now: NOW }), true);
});

test('thin profile: nearby jobs first, newest first, no scores', () => {
  const thin = { profile: { location: 'Pondicherry', profileCompletion: 10, skills: [], jobPreferences: {} } };
  assert.equal(isThinProfile(thin), true);
  assert.equal(isThinProfile(student()), false);
  const ranked = rankJobsForSeeker(thin, [
    job({ _id: 'far-new', location: 'Chennai', createdAt: daysAgo(0) }),
    job({ _id: 'near-old', location: 'Pondicherry', createdAt: daysAgo(10) }),
    job({ _id: 'near-new', location: 'Pondicherry', createdAt: daysAgo(2) }),
  ], { now: NOW });
  assert.deepEqual(ranked.map((r) => r.job._id), ['near-new', 'near-old', 'far-new']);
  assert.ok(ranked.every((r) => r.thin === true));
});

test('personal fields never change the score (fairness)', () => {
  const a = student();
  const b = { ...student(), name: 'Mohammed Imran', gender: 'male', age: 52, religion: 'x', caste: 'y', maritalStatus: 'married', avatar: 'photo.png', dateOfBirth: '1970-01-01' };
  b.profile = { ...b.profile, photo: 'x.png' };
  const j = job();
  assert.deepEqual(scoreJobForSeeker(a, j, { now: NOW }), scoreJobForSeeker(b, j, { now: NOW }));
});

test('ranking is deterministic: score, then newest', () => {
  const jobs = [job({ _id: 'a', createdAt: daysAgo(5) }), job({ _id: 'b', createdAt: daysAgo(1) })];
  const first = rankJobsForSeeker(student(), jobs, { now: NOW }).map((r) => r.job._id);
  const second = rankJobsForSeeker(student(), [...jobs].reverse(), { now: NOW }).map((r) => r.job._id);
  assert.deepEqual(first, second);
  assert.equal(first[0], 'b');
});

test('minScore and limit are honoured', () => {
  const jobs = [job({ _id: 'good' }), welder({ _id: 'bad' })];
  assert.deepEqual(rankJobsForSeeker(student(), jobs, { now: NOW, minScore: 40 }).map((r) => r.job._id), ['good']);
  assert.equal(rankJobsForSeeker(student(), jobs, { now: NOW, limit: 1 }).length, 1);
});
