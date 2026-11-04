'use strict';
// Team permissions are now enforced on the server, not only hidden in the menu.
//  1. The middleware itself: who is gated (team-managed recruiters only), any-of keys, 403 message.
//  2. Route wiring: every company-page API carries the gate with the keys the client page needs.
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const path = require('node:path');

process.env.JWT_SECRET = 'x'.repeat(40);
const SRV = path.join(__dirname, '..', '..');

// --- stubs ------------------------------------------------------------------------------------------
let stubUser = null;
const noop = (req, res, next) => next && next();
const handlerProxy = () => new Proxy({}, { get: (t, name) => (name in t ? t[name] : name === '__esModule' ? false : noop) });
const realLoad = Module._load;
Module._load = function (request, parent, ...rest) {
  if (/models\/User$/.test(request)) {
    return { findById: () => ({ select: () => ({ lean: async () => stubUser }) }) };
  }
  if (request === 'dotenv') return { config: () => ({}) };
  // Route files pull in controllers and the upload middleware; none of that is under test here.
  if (/controllers\//.test(request) || /middleware\/upload$/.test(request) || /utils\/jobQuality$/.test(request) || /middlewares\/aiDailyCap$/.test(request)) {
    const p = handlerProxy();
    if (/middleware\/upload$/.test(request)) { p.single = () => noop; p.fields = () => noop; p.array = () => noop; p.convertImagesToWebp = noop; }
    if (/aiDailyCap$/.test(request)) return { aiDailyCap: () => noop };
    if (/jobQuality$/.test(request)) return { scoreJobPost: () => ({}) };
    return p;
  }
  return realLoad.call(this, request, parent, ...rest);
};

const { requireTeamPermission } = require('../../middlewares/teamPermission');
const { TEAM_PERMISSION_KEYS, JOB_LIST_KEYS, APPLICANT_LIST_KEYS } = require('../../config/teamPermissions');

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};
const run = async (mw, user) => {
  const req = { user };
  const res = makeRes();
  let passed = false;
  await mw(req, res, () => { passed = true; });
  return { passed, res };
};

describe('requireTeamPermission middleware', () => {
  beforeEach(() => { stubUser = null; });

  it('rejects unknown permission keys at startup', () => {
    assert.throws(() => requireTeamPermission('delete_company'), /unknown permission/);
    assert.throws(() => requireTeamPermission(), /unknown permission/);
  });

  it('lets company owners, org employees, colleges and admins straight through without a lookup', async () => {
    for (const role of ['company', 'org_employee', 'college', 'admin', 'jobseeker']) {
      const { passed } = await run(requireTeamPermission('post_job'), { id: 'u', role });
      assert.equal(passed, true, role);
    }
  });

  it('lets a solo recruiter (not team-managed) through', async () => {
    stubUser = { isTeamManaged: false, teamPermissions: [] };
    const { passed } = await run(requireTeamPermission('post_job'), { id: 'u', role: 'recruiter' });
    assert.equal(passed, true);
  });

  it('blocks a team-managed recruiter who was not granted the page, with a plain message', async () => {
    stubUser = { isTeamManaged: true, teamPermissions: ['my_jobs'] };
    const { passed, res } = await run(requireTeamPermission('post_job'), { id: 'u', role: 'recruiter' });
    assert.equal(passed, false);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.msg, /not given you access to Post Job/);
    assert.equal(res.body.permission, 'post_job');
  });

  it('passes a team-managed recruiter who holds any one of the listed keys', async () => {
    stubUser = { isTeamManaged: true, teamPermissions: ['bulk_messaging'] };
    assert.equal((await run(requireTeamPermission('ats_pipeline', 'bulk_messaging'), { id: 'u', role: 'recruiter' })).passed, true);
    assert.equal((await run(requireTeamPermission('ats_pipeline'), { id: 'u', role: 'recruiter' })).passed, false);
  });

  it('treats a member with no permissions array as having none', async () => {
    stubUser = { isTeamManaged: true };
    assert.equal((await run(requireTeamPermission('messages'), { id: 'u', role: 'recruiter' })).res.statusCode, 403);
  });

  it('looks the member up once per request', async () => {
    let lookups = 0;
    const UserStub = { findById: () => { lookups += 1; return { select: () => ({ lean: async () => ({ isTeamManaged: true, teamPermissions: ['messages'] }) }) }; } };
    const before = Module._load;
    Module._load = function (request, ...rest) { return /models\/User$/.test(request) ? UserStub : before.call(this, request, ...rest); };
    delete require.cache[require.resolve('../../middlewares/teamPermission')];
    const fresh = require('../../middlewares/teamPermission').requireTeamPermission;
    Module._load = before;
    const req = { user: { id: 'u', role: 'recruiter' } };
    await fresh('messages')(req, makeRes(), () => {});
    await fresh('messages')(req, makeRes(), () => {});
    assert.equal(lookups, 1);
  });

  it('exposes its keys so route wiring can be checked', () => {
    assert.deepEqual(requireTeamPermission('messages', 'analytics').teamPermissionKeys, ['messages', 'analytics']);
  });
});

// --- route wiring -----------------------------------------------------------------------------------
// Walks an express router and returns { 'METHOD path': [keys...] } for every route, plus router-level
// gates under 'USE'.
const gatesOf = (router) => {
  const out = {};
  for (const layer of router.stack) {
    if (layer.route) {
      const keys = layer.route.stack.map(l => l.handle.teamPermissionKeys).filter(Boolean).flat();
      for (const method of Object.keys(layer.route.methods)) out[`${method.toUpperCase()} ${layer.route.path}`] = keys;
    } else if (layer.handle.teamPermissionKeys) {
      out.USE = [...(out.USE || []), ...layer.handle.teamPermissionKeys];
    }
  }
  return out;
};

describe('team permission gates on the company APIs', () => {
  it('jobs', () => {
    const g = gatesOf(require('../../routes/job.js'));
    assert.deepEqual(g['POST /'], ['post_job']);
    assert.deepEqual(g['POST /:id/clone'], ['post_job']);
    assert.deepEqual(g['PUT /:id'], ['my_jobs']);
    assert.deepEqual(g['DELETE /:id'], ['my_jobs']);
    assert.deepEqual(g['GET /analytics'], ['analytics']);
    assert.deepEqual(g['GET /candidates/search'], ['candidate_search']);
    assert.deepEqual(g['GET /:jobId/matched-candidates'], ['ai_candidate_matching']);
    assert.deepEqual(g['POST /import-pipeline'], ['ats_pipeline']);
    assert.deepEqual(g['GET /company-jobs'], JOB_LIST_KEYS);
    assert.deepEqual(g['GET /company-jobs-stats'], JOB_LIST_KEYS);
    assert.deepEqual(g['GET /quota'], JOB_LIST_KEYS);
    // public and job-seeker routes carry no gate
    assert.deepEqual(g['GET /'], []);
    assert.deepEqual(g['GET /:id'], []);
    assert.deepEqual(g['GET /matching'], []);
  });

  it('applications', () => {
    const g = gatesOf(require('../../routes/application.js'));
    assert.deepEqual(g['GET /job/:jobId'], APPLICANT_LIST_KEYS);
    assert.deepEqual(g['PUT /:id/status'], ['ats_pipeline', 'bulk_applicant_management']);
    assert.deepEqual(g['GET /export/:jobId'], ['ats_pipeline']);
    assert.deepEqual(g['POST /invite-assessment'], ['ats_pipeline']);
    assert.deepEqual(g['POST /apply'], [], 'job seekers applying are not gated');
    assert.deepEqual(g['GET /my-applications'], []);
  });

  it('messages: chat needs Messages, bulk needs Bulk Messaging, and bulk is matched before the router-wide gate', () => {
    const router = require('../../routes/messageRoutes.js');
    const g = gatesOf(router);
    assert.deepEqual(g['POST /bulk'], ['bulk_messaging']);
    assert.deepEqual(g.USE, ['messages']);
    const bulkIdx = router.stack.findIndex(l => l.route && l.route.path === '/bulk');
    const useIdx = router.stack.findIndex(l => !l.route && l.handle.teamPermissionKeys);
    assert.ok(bulkIdx !== -1 && useIdx !== -1 && bulkIdx < useIdx, 'bulk route registered before the Messages gate');
  });

  it('interviews: the whole router needs Video Interview / Scheduling', () => {
    const g = gatesOf(require('../../routes/interviewRoutes.js'));
    assert.deepEqual(g.USE, ['interview_scheduling']);
  });

  it('every key the client can grant is one the server knows', () => {
    const client = require('fs').readFileSync(path.join(SRV, '..', 'client', 'src', 'config', 'teamPermissions.js'), 'utf8');
    const clientKeys = [...client.matchAll(/key: '([a-z_]+)'/g)].map(m => m[1]);
    assert.deepEqual(clientKeys, TEAM_PERMISSION_KEYS);
  });
});
