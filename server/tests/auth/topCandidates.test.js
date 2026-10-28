const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'q'.repeat(40);
process.env.FRONTEND_URL = 'https://velaivaaipu.in';
process.env.API_PUBLIC_URL = 'https://api.velaivaaipu.in';
const { getTopCandidatesForJob, TOP_MIN_SCORE } = require('../../utils/matchingJobs');
const mails = require('../../utils/lifecycle/mails');

const job = { _id: 'j1', title: 'Accounts Assistant', skillsRequired: ['Excel', 'Tally'], location: 'Pondicherry', workMode: 'On-site', experience: { min: 0, max: 2 }, company: 'c1', recruiter: 'r1' };
const cand = (id, over = {}, top = {}) => ({
  _id: id, name: `Candidate ${id}`, avatar: 'a.png', email: `${id}@x.com`, blockedEntities: [], ...top,
  profile: { skills: ['MS Excel', 'Tally Prime', 'Typing', 'GST', 'Word', 'Canva'], preferredRole: 'Accounts Assistant', headline: 'Commerce graduate', location: 'Pondicherry', profileCompletion: 80, phone: '9999999999', qualification: [{ degree: 'B.Com' }], experience: [], ...over },
});

const chain = (result) => { const c = { select: () => c, populate: () => c, lean: () => Promise.resolve(result), then: (res, rej) => Promise.resolve(result).then(res, rej) }; return c; };
const deps = (pool, { certified = [], subs = [] } = {}) => ({
  Role: { findOne: async () => ({ _id: 'seeker-role' }) },
  User: { find: (q) => chain(q.role ? pool : subs) },
  SkillTestResult: { distinct: async () => certified },
});

test('returns the best fitting candidates first, at most 5, with why-lines', async () => {
  const pool = [cand('1'), cand('2'), cand('3'), cand('4'), cand('5'), cand('6'), cand('7')];
  const out = await getTopCandidatesForJob(job, deps(pool, { certified: ['4'] }));
  assert.equal(out.length, 5);
  assert.equal(out[0]._id, '4'); // certified edges ahead of identical profiles
  assert.ok(out.every((c) => c.relevance.score >= TOP_MIN_SCORE && c.relevance.reasons.length > 0));
});

test('only public fields are returned: no email, phone or blocked list; skills capped at 5', async () => {
  const [c] = await getTopCandidatesForJob(job, deps([cand('1')]));
  const text = JSON.stringify(c);
  assert.ok(!text.includes('@x.com'));
  assert.ok(!text.includes('9999999999'));
  assert.ok(!('blockedEntities' in c) && !('email' in c));
  assert.equal(c.profile.skills.length, 5);
  assert.deepEqual(Object.keys(c).sort(), ['_id', 'avatar', 'isPriority', 'name', 'profile', 'relevance']);
});

test('candidates who do not fit are left out, even if the list then has fewer than 5', async () => {
  const pool = [cand('1'), cand('weld', { skills: ['Welding'], preferredRole: 'Welder', headline: '', location: 'Delhi' })];
  const out = await getTopCandidatesForJob(job, deps(pool));
  assert.deepEqual(out.map((c) => c._id), ['1']);
});

test('a candidate who blocked this company or recruiter is never suggested', async () => {
  const pool = [cand('1', {}, { blockedEntities: ['c1'] }), cand('2', {}, { blockedEntities: ['r1'] }), cand('3')];
  const out = await getTopCandidatesForJob(job, deps(pool));
  assert.deepEqual(out.map((c) => c._id), ['3']);
});

test('no job seeker role or an empty pool gives an empty list', async () => {
  assert.deepEqual(await getTopCandidatesForJob(job, { ...deps([]), Role: { findOne: async () => null } }), []);
  assert.deepEqual(await getTopCandidatesForJob(job, deps([])), []);
});

test('the email lists names, headline and why-lines, escapes text, and links to candidate search', () => {
  const m = mails.topCandidates({ name: 'Ravi Kumar' }, { title: 'Accounts <b>Assistant</b>' }, [
    { name: 'Priya <i>R</i>', profile: { headline: 'Commerce graduate' }, relevance: { reasons: ['Has Excel, Tally', 'Lives in Pondicherry'] } },
    { name: 'Anand', profile: {}, relevance: { reasons: [] } },
  ]);
  assert.match(m.subject, /^2 candidates that fit your Accounts <b>Assistant<\/b> job$/);
  assert.match(m.html, /Priya &lt;i&gt;R&lt;\/i&gt;/);
  assert.match(m.html, /Why: Has Excel, Tally &middot; Lives in Pondicherry/);
  assert.ok(m.html.includes('Accounts &lt;b&gt;Assistant&lt;/b&gt;'));
  assert.match(m.html, /\/company\/candidates/);
  assert.ok(!/@/.test(m.html.replace(/https?:\/\/[^\s"]+/g, '')));
  assert.equal(mails.topCandidates({ name: 'R' }, { title: 'T' }, [{ name: 'A', profile: {}, relevance: {} }]).subject, '1 candidate that fit your T job');
});
