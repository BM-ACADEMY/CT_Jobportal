const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

process.env.JWT_SECRET = 'x'.repeat(40);

// Stub the User model so these tests need no database.
let stubUser = null;
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (/models\/User$/.test(request)) {
    return { findById: () => ({ select: () => ({ lean: async () => stubUser }) }) };
  }
  if (request === 'dotenv') return { config: () => ({}) }; // keep the test's own env
  return realLoad.call(this, request, ...rest);
};

// Real jsonwebtoken is used when installed. The tiny HS256 stand-in only exists so this file can
// also run in a bare checkout; it implements just sign/verify.
let jwt;
try {
  jwt = require('jsonwebtoken');
} catch {
  const crypto = require('crypto');
  const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const mac = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url');
  jwt = {
    sign: (payload, secret) => {
      const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}`;
      return `${body}.${mac(body, secret)}`;
    },
    verify: (token, secret) => {
      const [h, p, sig] = String(token).split('.');
      if (!sig || mac(`${h}.${p}`, secret) !== sig) throw new Error('invalid signature');
      return JSON.parse(Buffer.from(p, 'base64url').toString());
    },
  };
  const loadBefore = Module._load;
  Module._load = function (request, ...rest) {
    if (request === 'jsonwebtoken') return jwt;
    return loadBefore.call(this, request, ...rest);
  };
}
const { isSelfServeRole, SELF_SERVE_ROLES } = require('../../utils/selfServeRoles');
const { rateLimit } = require('../../middlewares/rateLimit');
const { verifyToken } = require('../../middlewares/authMiddleware');
const { getJwtSecret } = require('../../config/jwt');

const makeRes = () => {
  const res = { statusCode: 200, headers: {}, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  res.set = (k, v) => { res.headers[k] = v; return res; };
  return res;
};

test('privileged roles can never be self-selected', () => {
  for (const role of ['admin', 'subadmin', 'drive_incharge', 'org_employee', '', null, undefined, { $ne: 1 }, ['admin']]) {
    assert.equal(isSelfServeRole(role), false, `role ${JSON.stringify(role)} must be rejected`);
  }
  assert.deepEqual([...SELF_SERVE_ROLES].sort(), ['college', 'company', 'jobseeker', 'recruiter']);
  for (const role of SELF_SERVE_ROLES) assert.equal(isSelfServeRole(role), true);
});

test('JWT secret is required and must be strong (no fallback)', () => {
  const saved = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  assert.throws(() => getJwtSecret(), /JWT_SECRET/);
  process.env.JWT_SECRET = 'short';
  assert.throws(() => getJwtSecret(), /JWT_SECRET/);
  process.env.JWT_SECRET = saved;
  assert.equal(getJwtSecret(), saved);
});

test('a token signed with the old fallback secret is rejected', async () => {
  const forged = jwt.sign({ id: 'abc', role: 'admin' }, 'fallback_secret');
  const res = makeRes();
  let called = false;
  await verifyToken({ header: () => `Bearer ${forged}` }, res, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.statusCode, 401);
});

test('verifyToken: valid token passes, blocked user is refused immediately, missing token is 401', async () => {
  const token = jwt.sign({ id: 'u1', role: 'jobseeker' }, getJwtSecret());
  const req = { header: () => `Bearer ${token}` };

  stubUser = { isAdminBlocked: false };
  let res = makeRes(); let called = false;
  await verifyToken(req, res, () => { called = true; });
  assert.equal(called, true);

  stubUser = { isAdminBlocked: true };
  res = makeRes(); called = false;
  await verifyToken(req, res, () => { called = true; });
  assert.equal(called, false);
  assert.equal(res.statusCode, 403);

  res = makeRes();
  await verifyToken({ header: () => undefined }, res, () => {});
  assert.equal(res.statusCode, 401);
});

test('rate limiter returns 429 after the limit and sets Retry-After', () => {
  const limiter = rateLimit({ windowMs: 60000, max: 3 });
  const req = { baseUrl: '/api/auth', path: '/login', ip: '1.2.3.4' };
  let passed = 0;
  for (let i = 0; i < 3; i++) limiter(req, makeRes(), () => { passed++; });
  assert.equal(passed, 3);
  const res = makeRes();
  limiter(req, res, () => { passed++; });
  assert.equal(passed, 3);
  assert.equal(res.statusCode, 429);
  assert.ok(res.headers['Retry-After']);
  // a different IP is not affected
  limiter({ ...req, ip: '5.6.7.8' }, makeRes(), () => { passed++; });
  assert.equal(passed, 4);
});
