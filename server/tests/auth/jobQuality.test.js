const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreJobPost } = require('../../utils/jobQuality');

const good = {
  title: 'Accounts Executive (Tally)',
  skillsRequired: ['Tally', 'GST', 'Excel', 'Tally Prime', 'Billing'],
  location: 'Puducherry',
  salary: { min: 15000, max: 22000, isRangeHidden: false },
  description: 'You will prepare daily vouchers, GST returns and bank reconciliations for a small retail company, and report to the owner.',
  experience: { min: 1, max: 3 },
};

test('a complete post scores 100 with no tips', () => {
  const r = scoreJobPost(good);
  assert.equal(r.score, 100);
  assert.equal(r.level, 'good');
  assert.deepEqual(r.tips, []);
});

test('an empty post scores 0 and gets a tip for each field', () => {
  const r = scoreJobPost({});
  assert.equal(r.score, 0);
  assert.equal(r.level, 'weak');
  assert.deepEqual(r.tips.map((t) => t.field).sort(), ['description', 'experience', 'location', 'salary', 'skillsRequired', 'title']);
});

test('no skills: the tip says the job is shown to fewer people', () => {
  const r = scoreJobPost({ ...good, skillsRequired: [] });
  assert.ok(r.score < 100);
  assert.match(r.tips.find((t) => t.field === 'skillsRequired').tip, /fewer people/);
});

test('fewer than 5 skills: the tip says how many more to add; duplicates count once', () => {
  const r = scoreJobPost({ ...good, skillsRequired: ['Tally', 'tally', ' TALLY ', 'GST'] });
  assert.match(r.tips.find((t) => t.field === 'skillsRequired').tip, /Adding 3 more skills/);
});

test('a vague title gets half marks and a tip', () => {
  const r = scoreJobPost({ ...good, title: 'Hiring' });
  assert.equal(r.score, 90);
  assert.ok(r.tips.some((t) => t.field === 'title'));
});

test('remote jobs do not need a location', () => {
  const r = scoreJobPost({ ...good, location: '', workMode: 'Remote' });
  assert.equal(r.score, 100);
});

test('hidden salary range gets half the salary points; a bad range gets none', () => {
  assert.equal(scoreJobPost({ ...good, salary: { min: 1, max: 2, isRangeHidden: true } }).score, 93);
  assert.equal(scoreJobPost({ ...good, salary: { min: 30000, max: 20000 } }).score, 85);
});

test('the score never depends on who posts it', () => {
  assert.equal(scoreJobPost({ ...good, recruiter: 'a', company: 'b', gender: 'x' }).score, scoreJobPost(good).score);
});
