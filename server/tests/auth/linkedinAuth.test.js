const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'x'.repeat(40);
const KEYS = ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_CALLBACK_URL', 'LINKEDIN_CALLBACK_URL_LOCAL', 'NODE_ENV', 'FRONTEND_URL'];
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
const restore = () => KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
const { startLinkedinLogin, isConfigured } = require('../../controllers/linkedinAuth');

const fakeRes = () => {
  const r = { redirected: null, cookies: {} };
  r.redirect = (u) => { r.redirected = u; return r; };
  r.cookie = (n, v, o) => { r.cookies[n] = { v, o }; return r; };
  return r;
};

test('not configured without a callback URL (production)', () => {
  process.env.NODE_ENV = 'production';
  process.env.LINKEDIN_CLIENT_ID = 'id';
  process.env.LINKEDIN_CLIENT_SECRET = 'secret';
  delete process.env.LINKEDIN_CALLBACK_URL;
  process.env.FRONTEND_URL = 'https://velaivaaipu.in';
  assert.equal(isConfigured(), false);
  const res = fakeRes();
  startLinkedinLogin({ query: { role: 'company' } }, res);
  assert.match(res.redirected, /^https:\/\/velaivaaipu\.in\/login\?error=/);
  assert.equal(res.cookies.li_oauth_nonce, undefined);
  restore();
});

test('start redirects to LinkedIn with OIDC scopes, signed state and a nonce cookie', () => {
  process.env.NODE_ENV = 'production';
  process.env.LINKEDIN_CLIENT_ID = 'id';
  process.env.LINKEDIN_CLIENT_SECRET = 'secret';
  process.env.LINKEDIN_CALLBACK_URL = 'https://api.velaivaaipu.in/api/auth/linkedin/callback';
  const res = fakeRes();
  startLinkedinLogin({ query: { role: 'recruiter' } }, res);
  const url = new URL(res.redirected);
  assert.equal(url.origin + url.pathname, 'https://www.linkedin.com/oauth/v2/authorization');
  assert.equal(url.searchParams.get('scope'), 'openid profile email');
  assert.equal(url.searchParams.get('redirect_uri'), process.env.LINKEDIN_CALLBACK_URL);
  const jwt = require('jsonwebtoken');
  const state = jwt.verify(url.searchParams.get('state'), process.env.JWT_SECRET);
  assert.equal(state.role, 'recruiter');
  assert.equal(state.nonce, res.cookies.li_oauth_nonce.v);
  assert.equal(res.cookies.li_oauth_nonce.o.httpOnly, true);
  assert.equal(res.cookies.li_oauth_nonce.o.secure, true);
  restore();
});

test('a privileged role in the query falls back to jobseeker', () => {
  process.env.NODE_ENV = 'production';
  process.env.LINKEDIN_CLIENT_ID = 'id';
  process.env.LINKEDIN_CLIENT_SECRET = 'secret';
  process.env.LINKEDIN_CALLBACK_URL = 'https://api.velaivaaipu.in/api/auth/linkedin/callback';
  const res = fakeRes();
  startLinkedinLogin({ query: { role: 'admin' } }, res);
  const jwt = require('jsonwebtoken');
  const state = jwt.verify(new URL(res.redirected).searchParams.get('state'), process.env.JWT_SECRET);
  assert.equal(state.role, 'jobseeker');
  restore();
});
