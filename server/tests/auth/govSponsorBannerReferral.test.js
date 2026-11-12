'use strict';
// Government jobs, sponsored buyers report, Home banner slots, referrals.
//  - Government jobs: only the Super Admin or staff with `government_jobs` may post (companies, recruiters, other staff get 403);
//    last date rules; the public filter hides a job after its last date; company job routes cannot set the government fields.
//  - Sponsored counters never break a page; the report row shape.
//  - Banners: admin-only management, active selection, nothing rendered when none is active.
//  - Referrals: invite code parsing, admin count route is admin-only.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const path = require('node:path');
const fs = require('node:fs');

process.env.JWT_SECRET = 'x'.repeat(40);
const SRV = path.join(__dirname, '..', '..');
const read = (...p) => fs.readFileSync(path.join(SRV, ...p), 'utf8');

// --- stubs ------------------------------------------------------------------------------------------
let stubStaff = null;
const calls = { jobUpdates: [], jobCreates: [], bannerFind: null, bannerThrow: false, jobThrow: false };
const noop = (req, res, next) => next && next();
const handlerProxy = () => new Proxy({}, { get: (t, name) => (name in t ? t[name] : name === '__esModule' ? false : noop) });
const UserStub = { findById: () => ({ select: () => ({ lean: async () => stubStaff }) }) };
const JobStub = {
  updateOne: async (...a) => { if (calls.jobThrow) throw new Error('db down'); calls.jobUpdates.push(a); return { matchedCount: 1 }; },
  create: async (doc) => { calls.jobCreates.push(doc); return { _id: 'j1', createdAt: new Date(), ...doc }; },
};
const BannerStub = { findOne: () => ({ sort: () => ({ lean: async () => { if (calls.bannerThrow) throw new Error('db down'); return calls.bannerFind; } }) }) };
// express, multer and jsonwebtoken are not installed locally, so routers are built from a tiny stand-in that records the
// route stack the same way (layer.route.path / methods / stack, and use() layers) and the role gate really enforces roles.
const fakeRouter = () => {
  const r = { stack: [] };
  for (const m of ['get', 'post', 'put', 'patch', 'delete']) {
    r[m] = (p, ...handlers) => { r.stack.push({ route: { path: p, methods: { [m]: true }, stack: handlers.map((h) => ({ handle: h })) } }); return r; };
  }
  r.use = (...handlers) => { for (const h of handlers) r.stack.push({ handle: h }); return r; };
  return r;
};
const fakeExpress = () => ({ Router: fakeRouter });
fakeExpress.Router = fakeRouter;
const fakeMulter = () => ({ single: () => noop, fields: () => noop, array: () => noop });
fakeMulter.memoryStorage = () => ({});
const fakeAuth = {
  verifyToken: function verifyToken(req, res, next) { return next(); },
  optionalVerifyToken: function optionalVerifyToken(req, res, next) { return next(); },
  authorizeRoles: (...roles) => function roleGate(req, res, next) { return req.user && roles.includes(req.user.role) ? next() : res.status(403).json({ msg: 'Access denied' }); },
};
const realLoad = Module._load;
const REAL_CONTROLLERS = /controllers\/(governmentJobController|bannerController|sponsorStatsController|adminReferralController)$/;
Module._load = function (request, parent, ...rest) {
  if (request === 'express') return fakeExpress;
  if (request === 'multer') return fakeMulter;
  if (/middlewares\/authMiddleware$/.test(request)) return fakeAuth;
  if (/middlewares\/teamPermission$/.test(request)) return { requireTeamPermission: () => function teamGate(req, res, next) { return next(); } };
  if (/models\/User$/.test(request)) return UserStub;
  if (/models\/Job$/.test(request)) return JobStub;
  if (/models\/Banner$/.test(request)) return BannerStub;
  if (/models\/Role$/.test(request)) return {};
  if (request === 'dotenv') return { config: () => ({}) };
  if (REAL_CONTROLLERS.test(request)) return realLoad.call(this, request, parent, ...rest);
  if (/controllers\//.test(request) || /middleware\/upload$/.test(request) || /middlewares\/aiDailyCap$/.test(request) || /middlewares\/rateLimit$/.test(request) || /webhookRawBody$/.test(request)) {
    const p = handlerProxy();
    if (/middleware\/upload$/.test(request)) { p.single = () => noop; p.fields = () => noop; p.array = () => noop; p.convertImagesToWebp = noop; }
    if (/aiDailyCap$/.test(request)) return { aiDailyCap: () => noop };
    if (/rateLimit$/.test(request)) return { rateLimit: () => noop };
    return p;
  }
  return realLoad.call(this, request, parent, ...rest);
};

const G = require('../../utils/governmentJobs');
const B = require('../../utils/banners');
const { cleanReferrer } = require('../../utils/referral');
const { STAFF_ROLES, STAFF_PERMISSION_KEYS } = require('../../config/staffPermissions');
const govCtl = require('../../controllers/governmentJobController');
const bannerCtl = require('../../controllers/bannerController');
const sponsorCtl = require('../../controllers/sponsorStatsController');

const makeRes = () => { const r = { statusCode: 200, body: null }; r.status = (c) => { r.statusCode = c; return r; }; r.json = (b) => { r.body = b; return r; }; r.sendStatus = (c) => { r.statusCode = c; return r; }; r.set = () => r; return r; };
const run = async (mw, user, staff) => {
  stubStaff = staff === undefined ? null : { staff };
  const res = makeRes(); let passed = false;
  await mw({ user }, res, () => { passed = true; });
  return { passed, status: res.statusCode, body: res.body };
};
const ADMIN = { id: 'a', role: 'admin' };
const STAFF = { id: 's', role: 'subadmin' };
const COMPANY = { id: 'c', role: 'company' };
const RECRUITER = { id: 'r', role: 'recruiter' };
const ORG = { id: 'o', role: 'org_employee' };
const SEEKER = { id: 'j', role: 'jobseeker' };

const routeOf = (router, method, p) => router.stack.find((l) => l.route && l.route.path === p && l.route.methods[method]);
const gatesOn = (layer) => layer.route.stack.map((l) => l.handle).filter((h) => h.staffPermissionKeys);
const adminGateIndex = (router) => router.stack.findIndex((l) => !l.route && l.handle.name !== 'verifyToken' && !l.handle.staffPermissionKeys);

describe('government jobs: who may post', () => {
  const router = require('../../routes/adminRoutes.js');
  const routes = [['post', '/government-jobs'], ['get', '/government-jobs'], ['patch', '/government-jobs/:id/close']];

  it('the permission exists, and a preset carries it', () => {
    assert.ok(STAFF_PERMISSION_KEYS.includes('government_jobs'));
    assert.deepEqual(STAFF_ROLES.government_jobs_editor.permissions, ['government_jobs']);
  });

  for (const [method, p] of routes) {
    it(`${method.toUpperCase()} /api/admin${p}: admin and permitted staff pass; companies, recruiters, team members, seekers and other staff get 403`, async () => {
      const layer = routeOf(router, method, p);
      assert.ok(layer, 'route exists');
      const gates = gatesOn(layer);
      assert.equal(gates.length, 1);
      assert.deepEqual(gates[0].staffPermissionKeys, ['government_jobs']);
      assert.equal((await run(gates[0], ADMIN)).passed, true);
      assert.equal((await run(gates[0], STAFF, { permissions: ['government_jobs'] })).passed, true);
      for (const u of [COMPANY, RECRUITER, ORG, SEEKER, null]) assert.equal((await run(gates[0], u)).status, 403, `${u && u.role} gets 403`);
      assert.equal((await run(gates[0], STAFF, { permissions: STAFF_ROLES.support.permissions })).status, 403, 'staff without the permission');
      assert.equal((await run(gates[0], STAFF, { permissions: [] })).status, 403, 'staff with no permissions');
      assert.equal((await run(gates[0], STAFF, null)).status, 403, 'subadmin without a staff record');
      assert.equal((await run(gates[0], STAFF, { permissions: STAFF_PERMISSION_KEYS.filter((k) => k !== 'government_jobs') })).status, 403, 'staff with every other permission');
    });
  }

  it('the staff gate runs before the controller on the route (the 403 stops the request)', () => {
    const layer = routeOf(router, 'post', '/government-jobs');
    const handles = layer.route.stack.map((l) => l.handle);
    assert.ok(handles[0].staffPermissionKeys, 'gate first');
    assert.equal(handles[handles.length - 1], govCtl.createGovernmentJob);
  });

  it('staff never get the admin role: the permission opens only these routes, the admin-only gate still follows', async () => {
    const gateIdx = adminGateIndex(router);
    assert.ok(gateIdx > router.stack.indexOf(routeOf(router, 'post', '/government-jobs')), 'government routes sit before the admin-only gate');
    const adminGate = router.stack[gateIdx].handle;
    assert.equal((await run(adminGate, STAFF, { permissions: ['government_jobs'] })).status, 403);
    assert.equal((await run(adminGate, COMPANY)).status, 403);
  });

  it('company and recruiter job routes have no way to post a government job', () => {
    const jobs = read('routes', 'job.js');
    assert.doesNotMatch(jobs, /government/i);
    const ctl = read('controllers', 'jobController.js');
    // createJob builds the job from a fixed list of fields: none of the government fields is among them
    const create = ctl.slice(ctl.indexOf('const newJob = new Job({'), ctl.indexOf('newJob.scamFlags'));
    assert.doesNotMatch(create, /isGovernment|department|lastDate|notificationUrl/);
    // update and clone strip them, so a company cannot turn its own job into one, or set a notification link
    for (const key of ['isGovernment', 'department', 'lastDate', 'notificationUrl']) {
      assert.match(ctl.slice(ctl.indexOf('const updateJob'), ctl.indexOf('const deleteJob')), new RegExp(`'${key}'`));
      assert.match(ctl.slice(ctl.indexOf('const cloneJob'), ctl.indexOf('const updateJob')), new RegExp(`'${key}'`));
    }
  });

  it('government jobs stay off the main Jobs list and the matching list', () => {
    const ctl = read('controllers', 'jobController.js');
    assert.match(ctl.slice(ctl.indexOf('const getAllJobs'), ctl.indexOf('const getJobById')), /isGovernment: \{ \$ne: true \}/);
    assert.match(ctl.slice(ctl.indexOf('const getMatchingJobs'), ctl.indexOf('const getCompanyJobsWithStats')), /isGovernment = \{ \$ne: true \}/);
  });
});

describe('government jobs: rules and auto-hide', () => {
  const now = new Date('2026-11-15T06:00:00Z');
  const good = { title: 'Junior Assistant', department: 'TNPSC', description: 'x'.repeat(40), lastDate: '2026-12-31', notificationUrl: 'https://www.tnpsc.gov.in/notice.pdf' };

  it('accepts a complete post and stores the last date as the end of that day in India', () => {
    const r = G.cleanGovernmentJob(good, now);
    assert.ok(r.data);
    assert.equal(r.data.lastDate.toISOString(), '2026-12-31T18:29:59.999Z');
    assert.equal(r.data.location, 'India');
  });
  it('requires title, department, summary, a real future last date and an https official link', () => {
    for (const bad of [{ title: '' }, { department: '' }, { description: 'short' }, { lastDate: '' }, { lastDate: '2026-02-30' }, { lastDate: '2026-11-01' }, { lastDate: '2030-01-01' },
      { notificationUrl: '' }, { notificationUrl: 'http://x.gov.in/a' }, { notificationUrl: 'javascript:alert(1)' }, { notificationUrl: 'https://user:pw@x.gov.in/' }]) {
      assert.ok(G.cleanGovernmentJob({ ...good, ...bad }, now).error, JSON.stringify(bad));
    }
  });
  it('a job shows until the end of its last date and then hides itself', () => {
    const job = { isGovernment: true, status: 'active', lastDate: G.endOfDayIST('2026-12-31') };
    assert.equal(G.isGovernmentOpen(job, new Date('2026-12-31T18:00:00Z')), true);
    assert.equal(G.isGovernmentOpen(job, new Date('2026-12-31T18:30:00Z')), false);
    assert.equal(G.isGovernmentOpen({ ...job, status: 'closed' }, now), false);
    assert.equal(G.isGovernmentOpen({ ...job, isGovernment: false }, now), false);
    assert.equal(G.isGovernmentOpen({ ...job, lastDate: undefined }, now), false, 'old jobs without the fields never count');
    const f = G.openGovernmentFilter(now);
    assert.equal(f.isGovernment, true); assert.deepEqual(f.lastDate, { $gte: now }); assert.equal(f.status, 'active');
  });
  it('createGovernmentJob saves a government job with no company, posted by the signed-in admin or staff member', async () => {
    calls.jobCreates.length = 0;
    const res = makeRes();
    await govCtl.createGovernmentJob({ user: { id: 'a1' }, body: { ...good, lastDate: '2099-01-01' } }, res);
    // the 2099 date is beyond a year, so it is refused and nothing is saved
    assert.equal(res.statusCode, 400); assert.equal(calls.jobCreates.length, 0);
    const soon = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    const res2 = makeRes();
    await govCtl.createGovernmentJob({ user: { id: 'a1' }, body: { ...good, lastDate: soon } }, res2);
    assert.equal(res2.statusCode, 201);
    const doc = calls.jobCreates[0];
    assert.equal(doc.isGovernment, true); assert.equal(doc.recruiter, 'a1'); assert.equal(doc.company, undefined); assert.equal(doc.notificationUrl, good.notificationUrl);
  });
});

describe('sponsored counters and report', () => {
  it('counts a view or a click only for a job that is sponsored now, and always answers 204', async () => {
    calls.jobUpdates.length = 0;
    const id = 'a'.repeat(24);
    let res = makeRes(); await sponsorCtl.recordSponsorEvent({ params: { id }, body: { event: 'view' } }, res);
    assert.equal(res.statusCode, 204);
    const [filter, update] = calls.jobUpdates[0];
    assert.equal(filter._id, id); assert.equal(filter.status, 'active'); assert.ok(filter.sponsoredUntil.$gt instanceof Date);
    assert.deepEqual(update, { $inc: { sponsorViews: 1 } });
    res = makeRes(); await sponsorCtl.recordSponsorEvent({ params: { id }, body: { event: 'click' } }, res);
    assert.deepEqual(calls.jobUpdates[1][1], { $inc: { sponsorClicks: 1 } });
    for (const bad of [{ event: 'apply' }, { event: { $gt: '' } }, {}, undefined]) {
      calls.jobUpdates.length = 0; res = makeRes();
      await sponsorCtl.recordSponsorEvent({ params: { id }, body: bad }, res);
      assert.equal(res.statusCode, 204); assert.equal(calls.jobUpdates.length, 0);
    }
    res = makeRes(); await sponsorCtl.recordSponsorEvent({ params: { id: 'nope' }, body: { event: 'view' } }, res);
    assert.equal(res.statusCode, 204); assert.equal(calls.jobUpdates.length, 0);
  });
  it('a database failure never breaks the page', async () => {
    calls.jobThrow = true;
    const res = makeRes();
    await sponsorCtl.recordSponsorEvent({ params: { id: 'b'.repeat(24) }, body: { event: 'view' } }, res);
    calls.jobThrow = false;
    assert.equal(res.statusCode, 204);
  });
  it('the public counter route needs no login and is rate limited; the report route is for companies and recruiters', () => {
    const router = require('../../routes/job.js');
    const ev = routeOf(router, 'post', '/:id/sponsor-event');
    assert.ok(ev); assert.equal(ev.route.stack.map((l) => l.handle).includes(sponsorCtl.recordSponsorEvent), true);
    assert.equal(ev.route.stack.length, 2, 'rate limit + handler, no auth');
    const rep = routeOf(router, 'get', '/sponsored-report');
    assert.ok(rep);
    assert.ok(router.stack.indexOf(rep) < router.stack.indexOf(routeOf(router, 'get', '/:id')), 'declared before /:id');
    assert.equal(rep.route.stack.length, 4, 'verifyToken, roles, team permission, handler');
  });
  it('report rows carry views, clicks and applies, and say whether the sponsorship is still running', () => {
    const now = new Date('2026-11-15T00:00:00Z');
    assert.deepEqual(sponsorCtl.reportRow({ _id: '1', title: 'T', sponsoredUntil: new Date('2026-11-20'), sponsorViews: 10, sponsorClicks: 3, applicantsCount: 2 }, now),
      { _id: '1', title: 'T', sponsoredUntil: new Date('2026-11-20'), active: true, views: 10, clicks: 3, applies: 2 });
    const old = sponsorCtl.reportRow({ _id: '2', title: 'O', sponsoredUntil: new Date('2026-11-01') }, now);
    assert.equal(old.active, false); assert.equal(old.views, 0); assert.equal(old.applies, 0);
  });
  it('the job card badge counts once per session and the Jobs page keeps its look', () => {
    const t = fs.readFileSync(path.join(SRV, '..', 'client', 'src', 'utils', 'sponsorTrack.js'), 'utf8');
    assert.match(t, /sessionStorage/);
    assert.match(t, /catch \{ \/\* counting must never break a page \*\/ \}/);
    const jobs = fs.readFileSync(path.join(SRV, '..', 'client', 'src', 'pages', 'Jobs.jsx'), 'utf8');
    assert.match(jobs, /<SponsoredBadge jobId=\{job\._id\} \/>/);
  });
});

describe('banner slots', () => {
  const now = new Date('2026-11-15T10:00:00Z');
  const good = { imageUrl: 'https://cdn.example.com/b.webp', linkUrl: '/jobs', startsAt: '2026-11-14T00:00:00Z', endsAt: '2026-11-20T00:00:00Z' };

  it('validates image, link, dates and the only placement', () => {
    const r = B.cleanBanner(good);
    assert.equal(r.data.placement, 'home-top'); assert.equal(r.data.active, true);
    assert.ok(B.cleanBanner({ ...good, imageUrl: '/uploads/blog/post-1.webp' }).data);
    for (const bad of [{ imageUrl: '' }, { imageUrl: 'http://x.com/a.png' }, { imageUrl: 'javascript:alert(1)' }, { linkUrl: '' }, { linkUrl: '//evil.com' }, { linkUrl: 'javascript:alert(1)' },
      { startsAt: '' }, { endsAt: 'soon' }, { endsAt: '2026-11-01T00:00:00Z' }, { placement: 'footer' }]) {
      assert.ok(B.cleanBanner({ ...good, ...bad }).error, JSON.stringify(bad));
    }
  });
  it('active means switched on and inside its dates', () => {
    const b = { active: true, startsAt: good.startsAt, endsAt: good.endsAt };
    assert.equal(B.isBannerActive(b, now), true);
    assert.equal(B.isBannerActive(b, new Date('2026-11-21T00:00:00Z')), false);
    assert.equal(B.isBannerActive(b, new Date('2026-11-13T00:00:00Z')), false);
    assert.equal(B.isBannerActive({ ...b, active: false }, now), false);
    assert.equal(B.isBannerActive(null, now), false);
    const f = B.activeBannerFilter('home-top', now);
    assert.deepEqual(f.startsAt, { $lte: now }); assert.deepEqual(f.endsAt, { $gte: now });
  });
  it('the public endpoint returns null when nothing is active or the database fails', async () => {
    calls.bannerFind = null; calls.bannerThrow = false;
    let res = makeRes(); await bannerCtl.getActiveBanner({ query: {} }, res);
    assert.deepEqual(res.body, { banner: null });
    calls.bannerFind = { _id: '1', imageUrl: good.imageUrl, linkUrl: '/jobs', altText: 'Hi', placement: 'home-top', createdBy: 'secret' };
    res = makeRes(); await bannerCtl.getActiveBanner({ query: { placement: 'home-top' } }, res);
    assert.equal(res.body.banner.linkUrl, '/jobs'); assert.equal(res.body.banner.createdBy, undefined);
    calls.bannerThrow = true;
    res = makeRes(); await bannerCtl.getActiveBanner({ query: {} }, res);
    assert.deepEqual(res.body, { banner: null }); calls.bannerThrow = false;
  });
  it('management routes are admin-only: behind the admin gate, with no staff gate; staff with every permission and companies get 403', async () => {
    const router = require('../../routes/adminRoutes.js');
    const gateIdx = adminGateIndex(router);
    const adminGate = router.stack[gateIdx].handle;
    for (const [m, p] of [['get', '/banners'], ['post', '/banners'], ['put', '/banners/:id'], ['delete', '/banners/:id'], ['get', '/referrals']]) {
      const layer = routeOf(router, m, p);
      assert.ok(layer, `${m} ${p}`);
      assert.ok(router.stack.indexOf(layer) > gateIdx, `${m} ${p} is behind the admin-only gate`);
      assert.equal(gatesOn(layer).length, 0, 'no staff gate');
    }
    for (const u of [STAFF, COMPANY, RECRUITER, SEEKER]) assert.equal((await run(adminGate, u, { permissions: STAFF_PERMISSION_KEYS })).status, 403, `${u.role}`);
    assert.equal((await run(adminGate, ADMIN)).passed, true);
  });
  it('the public banner route is read-only and the Home page renders nothing without a banner', () => {
    const router = require('../../routes/banners.js');
    assert.ok(routeOf(router, 'get', '/active'));
    assert.equal(router.stack.filter((l) => l.route && !l.route.methods.get).length, 0);
    const c = fs.readFileSync(path.join(SRV, '..', 'client', 'src', 'components', 'home', 'HomeBanner.jsx'), 'utf8');
    assert.match(c, /if \(!banner \|\| !banner\.imageUrl \|\| !banner\.linkUrl\) return null;/);
  });
});

describe('referrals', () => {
  it('accepts a code or a pasted invite link, and nothing else', () => {
    const id = 'a1b2c3d4e5f6a1b2c3d4e5f6';
    assert.equal(cleanReferrer(id), id);
    assert.equal(cleanReferrer(`  ${id}  `), id);
    assert.equal(cleanReferrer(`https://velaivaaipu.in/register?role=jobseeker&ref=${id}`), id);
    for (const bad of ['', 'abc', `${id}ff`, { $ne: 1 }, null, 'https://x.in/?ref=zzz']) assert.equal(cleanReferrer(bad), '');
  });
  it('signup stores referredBy from the optional code, and the admin list counts per referrer', () => {
    const auth = read('controllers', 'authController.js');
    assert.match(auth, /cleanReferrer\(req\.body\.ref\)/);
    assert.match(auth, /user\.referredBy = inviter/);
    const ref = read('controllers', 'adminReferralController.js');
    assert.match(ref, /\$group: \{ _id: '\$referredBy'/);
    assert.doesNotMatch(ref, /reward|credit|coupon/i);
  });
});
