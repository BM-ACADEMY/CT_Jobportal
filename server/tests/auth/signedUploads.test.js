const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'x'.repeat(40);
const { toUploadPath, isPublicUpload, signUploadPath, verifyUploadSignature } = require('../../utils/signedUploads');

const parse = (signed) => { const u = new URL(signed, 'http://x'); return { p: u.pathname, exp: u.searchParams.get('exp'), sig: u.searchParams.get('sig') }; };

test('a signed link verifies for its own file only', () => {
  const { p, exp, sig } = parse(signUploadPath('/uploads/resume-1.pdf'));
  assert.equal(verifyUploadSignature(p, exp, sig), true);
  assert.equal(verifyUploadSignature('/uploads/resume-2.pdf', exp, sig), false);
});

test('a signed link expires', () => {
  const now = Date.now();
  const { p, exp, sig } = parse(signUploadPath('/uploads/a.pdf', 60, now));
  assert.equal(verifyUploadSignature(p, exp, sig, now + 59_000), true);
  assert.equal(verifyUploadSignature(p, exp, sig, now + 61_000), false);
});

test('a tampered expiry or signature is rejected', () => {
  const { p, exp, sig } = parse(signUploadPath('/uploads/a.pdf'));
  assert.equal(verifyUploadSignature(p, Number(exp) + 3600, sig), false);
  assert.equal(verifyUploadSignature(p, exp, sig.slice(0, -1) + (sig.endsWith('0') ? '1' : '0')), false);
  assert.equal(verifyUploadSignature(p, exp, undefined), false);
  assert.equal(verifyUploadSignature(p, 'abc', sig), false);
});

test('only /uploads paths are accepted, and traversal is refused', () => {
  assert.equal(toUploadPath('https://api.velaivaaipu.in/uploads/a.pdf?x=1'), '/uploads/a.pdf');
  assert.equal(toUploadPath('/uploads/a%20b.pdf'), '/uploads/a b.pdf');
  assert.equal(toUploadPath('/uploads/../.env'), null);
  assert.equal(toUploadPath('/uploads/%2e%2e/.env'), null);
  assert.equal(toUploadPath('/api/user/me'), null);
  assert.equal(toUploadPath(undefined), null);
});

test('images and certificates are public; documents are not', () => {
  assert.equal(isPublicUpload('/uploads/logo.webp'), true);
  assert.equal(isPublicUpload('/uploads/certificate-1792-ab.pdf'), true);
  assert.equal(isPublicUpload('/uploads/resume-1.pdf'), false);
  assert.equal(isPublicUpload('/uploads/mou-ABC-1.pdf'), false);
});
