// Automated smoke test for the LIVE site. Safe to run any time: it only reads pages and sends a few
// requests that are rejected on purpose (wrong password, no login). It creates and changes nothing.
//
// Run from anywhere with Node 18+ (no packages, no .env needed):
//   node scripts/liveSmokeTest.js
// Another site (for example a test server):
//   SITE_URL=https://staging.example.com API_URL=https://api.staging.example.com node scripts/liveSmokeTest.js
//
// Exit code 0 = no failures, 1 = at least one FAIL. WARN means "look at this", it does not fail the run.
const SITE = (process.env.SITE_URL || 'https://velaivaaipu.in').replace(/\/+$/, '');
const API = (process.env.API_URL || 'https://api.velaivaaipu.in').replace(/\/+$/, '');
const EXPECTED_SKILLS = Number(process.env.EXPECTED_SKILLS || 17);
const TIMEOUT_MS = 20000;

const results = [];
const record = (status, name, detail = '') => {
  results.push({ status, name });
  const icon = status === 'PASS' ? 'PASS' : status === 'WARN' ? 'WARN' : 'FAIL';
  console.log(`${icon}  ${name}${detail ? `  -  ${detail}` : ''}`);
};
const pass = (n, d) => record('PASS', n, d);
const warn = (n, d) => record('WARN', n, d);
const fail = (n, d) => record('FAIL', n, d);

const get = async (url, opts = {}) => {
  const started = Date.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), redirect: 'manual', ...opts });
  const body = await res.text();
  return { res, body, ms: Date.now() - started };
};
const json = (body) => { try { return JSON.parse(body); } catch { return undefined; } };

// Runs one check; a crash inside it (network down, timeout) is a FAIL, not a crashed script.
const check = async (name, fn) => {
  try { await fn(); } catch (err) { fail(name, err.name === 'TimeoutError' ? 'timed out' : err.message); }
};

const main = async () => {
  console.log(`Site: ${SITE}\nAPI:  ${API}\n`);

  // 1. Website and public pages
  let indexHtml = '';
  await check('Home page opens', async () => {
    const { res, body } = await get(`${SITE}/`);
    indexHtml = body;
    if (res.status === 200 && /<div id="root"/.test(body)) pass('Home page opens');
    else fail('Home page opens', `status ${res.status}`);
  });
  for (const path of ['/free-assessment', '/privacy-policy', '/terms', '/refund-policy', '/for-colleges']) {
    await check(`Page ${path} opens`, async () => {
      const { res } = await get(`${SITE}${path}`);
      res.status === 200 ? pass(`Page ${path} opens`) : fail(`Page ${path} opens`, `status ${res.status}`);
    });
  }

  // 2. The built website points at the right API (a missing VITE_API_BASE_URL once broke the whole site)
  await check('Website build points at the API', async () => {
    const script = (indexHtml.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0];
    if (!script) return fail('Website build points at the API', 'main script not found in the page');
    const { body } = await get(`${SITE}${script}`);
    const apiHost = new URL(API).host;
    if (!body.includes(apiHost)) return fail('Website build points at the API', `${apiHost} is not in the build; rebuild with VITE_API_BASE_URL`);
    if (/["'`]undefined\/(jobs|auth)/.test(body)) return fail('Website build points at the API', 'build contains "undefined/..." addresses');
    pass('Website build points at the API');
    /G-[A-Z0-9]{8,12}/.test(body) ? pass('Google Analytics ID is in the build') : warn('Google Analytics ID is in the build', 'not found; check VITE_GA_MEASUREMENT_ID and rebuild');
  });

  // 3. API: public data and CORS
  await check('Jobs API returns a list', async () => {
    const { res, body, ms } = await get(`${API}/api/jobs`, { headers: { Origin: SITE } });
    if (res.status !== 200 || !Array.isArray(json(body))) return fail('Jobs API returns a list', `status ${res.status}`);
    pass('Jobs API returns a list', `${json(body).length} jobs, ${ms} ms`);
    ms > 3000 && warn('Jobs API is fast', `${ms} ms (slow)`);
    const cors = res.headers.get('access-control-allow-origin');
    cors === SITE || cors === '*' ? pass('CORS allows the website') : fail('CORS allows the website', `header is "${cors}"`);
  });

  // 4. Free skill test: skills, questions without answers, server-side marking
  await check('Free skill test', async () => {
    const skills = json((await get(`${API}/api/assessments/skills`)).body);
    if (!Array.isArray(skills) || skills.length === 0) return fail('Skill dropdown has skills', 'empty list; seed the question bank');
    skills.length >= EXPECTED_SKILLS
      ? pass('Skill dropdown has all skills', `${skills.length}`)
      : warn('Skill dropdown has all skills', `${skills.length} of ${EXPECTED_SKILLS}; run generateQuestionBank.js`);

    const key = (skills.find((s) => s.key === 'ms-excel') || skills[0]).key;
    const { res, body } = await get(`${API}/api/assessments/bank?category=${encodeURIComponent(key)}`);
    const test = json(body);
    if (res.status !== 200 || !test || !Array.isArray(test.questions)) return fail('Test starts', `status ${res.status}`);
    pass('Test starts', `${test.questions.length} questions`);
    /correct_option|explanation/.test(body) ? fail('Test hides the right answers', 'answers are in the response') : pass('Test hides the right answers');

    // Submitting instantly must be refused: a real student cannot answer 10 questions in under a second.
    const answers = Object.fromEntries(test.questions.map((q) => [q.id, 'a']));
    const sub = await get(`${API}/api/assessments/bank/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: key, attemptToken: test.attemptToken, answers }),
    });
    sub.res.status === 400 ? pass('Instant submit is refused') : fail('Instant submit is refused', `status ${sub.res.status}`);
    const bad = await get(`${API}/api/assessments/bank?category=not-a-skill`);
    bad.res.status === 400 ? pass('Unknown skill is rejected') : fail('Unknown skill is rejected', `status ${bad.res.status}`);
  });

  // 5. Login and protected routes
  await check('Wrong password is refused cleanly', async () => {
    const { res } = await get(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'smoke-test-nobody@example.com', password: 'not-a-real-password' }),
    });
    res.status >= 400 && res.status < 500 ? pass('Wrong password is refused cleanly', `status ${res.status}`) : fail('Wrong password is refused cleanly', `status ${res.status}`);
  });
  for (const [label, path, method] of [
    ['Matching jobs needs a login', '/api/jobs/matching', 'GET'],
    ['Job quality check needs a login', '/api/jobs/quality-check', 'POST'],
    ['Saving a skill result needs a login', '/api/skill-tests/save', 'POST'],
  ]) {
    await check(label, async () => {
      const { res } = await get(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? '{}' : undefined });
      res.status === 401 || res.status === 403 ? pass(label) : fail(label, `status ${res.status}, expected 401 or 403`);
    });
  }
  await check('Google and LinkedIn sign-in are off', async () => {
    const g = (await get(`${API}/api/auth/google`)).res.status;
    const l = (await get(`${API}/api/auth/linkedin`)).res.status;
    g === 404 && l === 404 ? pass('Google and LinkedIn sign-in are off') : fail('Google and LinkedIn sign-in are off', `google ${g}, linkedin ${l}`);
  });

  // 6. Documents are protected
  await check('Private documents need a signed link', async () => {
    const { res } = await get(`${API}/uploads/resume-smoke-test.pdf`);
    [401, 403].includes(res.status)
      ? pass('Private documents need a signed link')
      : res.status === 404
        ? warn('Private documents need a signed link', 'got 404; check PROTECT_DOCUMENT_UPLOADS=true on the server')
        : fail('Private documents need a signed link', `status ${res.status}`);
  });

  // Summary
  const count = (s) => results.filter((r) => r.status === s).length;
  console.log(`\n${count('PASS')} passed, ${count('WARN')} warnings, ${count('FAIL')} failed`);
  if (count('FAIL')) {
    console.log('Failed: ' + results.filter((r) => r.status === 'FAIL').map((r) => r.name).join('; '));
    process.exit(1);
  }
};

main().catch((err) => { console.error('Smoke test crashed:', err.message); process.exit(1); });
