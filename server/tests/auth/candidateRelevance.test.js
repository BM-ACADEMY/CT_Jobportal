const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreCandidateForJob, rankCandidatesForJob, candidateCompleteness } = require('../../utils/relevance');

const job = (over = {}) => ({ title: 'Accounts Assistant', skillsRequired: ['Excel', 'Tally', 'GST'], location: 'Pondicherry', workMode: 'On-site', experience: { min: 0, max: 2 }, ...over });
const cand = (id, over = {}) => ({
  _id: id, name: 'Name ' + id, avatar: '',
  profile: { skills: ['MS Excel', 'Tally Prime'], preferredRole: 'Accounts Assistant', headline: 'Commerce graduate', location: 'Pondicherry', profileCompletion: 80, qualification: [{ degree: 'B.Com' }], experience: [], ...over },
});

test('a candidate with the skills, role and city scores high, with reasons', () => {
  const r = scoreCandidateForJob(cand('a'), job());
  assert.ok(r.score >= 75, `score ${r.score}`);
  assert.ok(r.reasons.some((x) => /Excel/.test(x) && /Tally/.test(x)));
  assert.ok(r.reasons.includes('Role fits'));
  assert.ok(r.reasons.includes('Lives in Pondicherry'));
  assert.ok(r.reasons.includes('Fresher, suits an entry-level job'));
});

test('more of the required skills means a higher score', () => {
  const all = scoreCandidateForJob(cand('a', { skills: ['Excel', 'Tally', 'GST'] }), job());
  const some = scoreCandidateForJob(cand('b', { skills: ['Excel'] }), job());
  const none = scoreCandidateForJob(cand('c', { skills: ['Welding'] }), job());
  assert.ok(all.score > some.score && some.score > none.score);
});

test('an unrelated candidate stays low even with a complete profile and a certificate', () => {
  const r = scoreCandidateForJob(cand('x', { skills: ['Welding'], preferredRole: 'Welder', headline: 'Fitter', location: 'Delhi', profileCompletion: 100 }), job(), { hasCertificate: true });
  assert.ok(r.score <= 20, `score ${r.score}`);
});

test('a verified certificate adds a little; completeness adds a little', () => {
  const base = scoreCandidateForJob(cand('a'), job());
  const cert = scoreCandidateForJob(cand('a'), job(), { hasCertificate: true });
  assert.ok(cert.score >= base.score && cert.score - base.score <= 5);
  assert.ok(cert.reasons.includes('Passed a verified skill test'));
  const thin = scoreCandidateForJob(cand('b', { profileCompletion: 20 }), job());
  assert.ok(base.score > thin.score);
});

test('priority badge adds at most 5, only to a candidate who already fits', () => {
  const plain = scoreCandidateForJob(cand('a'), job());
  const badged = scoreCandidateForJob({ ...cand('a'), isPriority: true }, job());
  assert.ok(badged.score - plain.score <= 5 && badged.score >= plain.score);
  assert.equal(badged.priority, true);
  const unrelated = scoreCandidateForJob({ ...cand('z', { skills: ['Welding'], preferredRole: 'Welder', headline: '', location: 'Delhi' }), isPriority: true }, job());
  assert.equal(unrelated.score, unrelated.base);
});

test('the photo never helps: the same profile scores the same with or without an avatar', () => {
  const without = scoreCandidateForJob({ ...cand('a'), avatar: '' }, job());
  // 5 of the stored completion points came from the photo, so a candidate with a photo has them taken back out.
  const withPhoto = scoreCandidateForJob({ ...cand('a', { profileCompletion: 85 }), avatar: 'photo.png' }, job());
  assert.equal(withPhoto.score, without.score);
  assert.equal(candidateCompleteness({ avatar: 'p.png', profile: { profileCompletion: 100 } }), 100);
  assert.equal(candidateCompleteness({ avatar: '', profile: { profileCompletion: 95 } }), 100);
});

test('personal fields never change the score (fairness)', () => {
  const a = cand('a');
  const b = { ...cand('a'), name: 'Mohammed Imran', gender: 'male', age: 55, religion: 'x', caste: 'y', maritalStatus: 'married', dateOfBirth: '1970-01-01' };
  assert.deepEqual(scoreCandidateForJob(a, job()), scoreCandidateForJob(b, job()));
});

test('remote jobs fit candidates in any city', () => {
  const r = scoreCandidateForJob(cand('a', { location: 'Madurai' }), job({ workMode: 'Remote', location: 'Bengaluru' }));
  assert.equal(r.parts.location, 15);
  assert.ok(r.reasons.includes('Remote job'));
});

test('ranking: best fit first, then complete profile, then a stable id order (not name)', () => {
  const list = [
    cand('3', { skills: ['Welding'], preferredRole: 'Welder', headline: '', location: 'Delhi' }),
    cand('2', { profileCompletion: 60 }),
    cand('1', { profileCompletion: 60 }),
    cand('4', { profileCompletion: 95 }),
  ];
  const ids = rankCandidatesForJob(list, job()).map((r) => r.candidate._id);
  assert.deepEqual(ids, ['4', '1', '2', '3']);
  assert.deepEqual(rankCandidatesForJob([...list].reverse(), job()).map((r) => r.candidate._id), ids);
});

test('certified candidates edge ahead of an otherwise identical one', () => {
  const list = [cand('1'), cand('2')];
  const ranked = rankCandidatesForJob(list, job(), { certifiedIds: new Set(['2']) });
  assert.equal(ranked[0].candidate._id, '2');
});

test('with no job to compare against, only profile completeness decides', () => {
  const ranked = rankCandidatesForJob([cand('1', { profileCompletion: 30 }), cand('2', { profileCompletion: 90 })], null);
  assert.deepEqual(ranked.map((r) => r.candidate._id), ['2', '1']);
  assert.ok(ranked.every((r) => r.score === 0));
});
