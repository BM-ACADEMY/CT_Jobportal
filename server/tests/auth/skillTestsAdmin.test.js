'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const stub = (path, exports) => { const p = require.resolve(path); require.cache[p] = { id: p, filename: p, loaded: true, exports }; };

let attemptRows = [];
const attemptCalls = [];
stub('../../models/FreeTestAttempt', {
  create: async (d) => { attemptRows.push(d); return d; },
  aggregate: async (pipe) => {
    attemptCalls.push(pipe);
    const group = pipe.find((s) => s.$group)?.$group;
    if (group._id === null) return [{ _id: null, attempts: 10, passed: 6, avg: 62.4 }];
    if (group._id === '$skill') return [{ _id: 'ms excel', attempts: 7, passed: 5, avg: 70 }, { _id: 'tally', attempts: 3, passed: 1, avg: 40 }];
    return [{ _id: '2026-11-05', attempts: 4 }, { _id: '2026-11-06', attempts: 6 }];
  },
});
const q = (rows) => { const x = { sort() { return x; }, limit() { return x; }, populate() { return x; }, then(r, j) { return Promise.resolve(rows).then(r, j); } }; return x; };
stub('../../models/SkillTestResult', {
  countDocuments: async () => 3,
  find: () => q([
    { _id: 'r1', skill: 'ms excel', percentage: 80, passed: true, createdAt: new Date('2026-11-06'), user: { name: 'Asha', email: 'asha@x.com', phone: '9000000001' } },
    { _id: 'r2', skill: 'tally', percentage: 30, passed: false, createdAt: new Date('2026-11-05'), user: null },
  ]),
});

const { getSkillTestSummary, clampDays } = require('../../controllers/skillTestAdminController');
const call = async (query = {}) => {
  const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  await getSkillTestSummary({ query, user: { id: 'a', role: 'admin' } }, res);
  return res;
};

describe('admin skill test summary', () => {
  it('returns totals, per-day, per-skill and recent people', async () => {
    const r = await call({ days: '30' });
    assert.equal(r.statusCode, 200);
    assert.equal(r.body.totals.attempts, 10);
    assert.equal(r.body.totals.passRate, 60);
    assert.equal(r.body.totals.savedResults, 3);
    assert.equal(r.body.totals.savedShare, 30);
    assert.deepEqual(r.body.byDay.map((d) => d.attempts), [4, 6]);
    assert.equal(r.body.bySkill[0].passRate, 71);
    assert.equal(r.body.recent[0].name, 'Asha');
    assert.equal(r.body.recent[1].name, '');
  });

  it('keeps the day range between 1 and 365 and defaults to 30', () => {
    assert.equal(clampDays(undefined), 30);
    assert.equal(clampDays('0'), 30);
    assert.equal(clampDays('-5'), 1);
    assert.equal(clampDays('9999'), 365);
    assert.equal(clampDays('7'), 7);
  });

  it('never exposes more than name, email, phone, skill, score, plan label and a hint for a person', async () => {
    const r = await call();
    assert.deepEqual(Object.keys(r.body.recent[0]).sort(), ['_id', 'createdAt', 'email', 'name', 'passed', 'percentage', 'phone', 'plan', 'skill', 'suggestion']);
  });
});

describe('admin route guard', () => {
  // Read the route file as text so the check needs no database or server packages.
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../../routes/adminRoutes.js'), 'utf8');
  const at = (needle) => src.indexOf(needle);

  it('is registered below the admin-only gate and above nothing that loosens it', () => {
    const gate = at("router.use(authorizeRoles('admin'));");
    const route = at("router.get('/skill-tests'");
    assert.ok(gate > 0, 'admin-only gate exists');
    assert.ok(route > gate, 'the route comes after the admin-only gate');
    assert.ok(at("router.get('/users'") < gate, 'the staff-readable routes stay above the gate');
  });

  it('carries no permission shortcut such as requireAdminOr', () => {
    const line = src.split('\n').find((l) => l.includes("router.get('/skill-tests'"));
    assert.ok(line && !line.includes('requireAdminOr'));
  });

  it('only one gate line exists, so nothing after it can be a second, weaker gate', () => {
    assert.equal(src.split("router.use(authorizeRoles('admin'));").length - 1, 1);
  });
});
