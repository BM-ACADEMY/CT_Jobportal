const test = require('node:test');
const assert = require('node:assert/strict');
const { otpEmail } = require('../utils/emailTemplates');

test('shows the code, the lifetime and the brand', () => {
  const html = otpEmail({ title: 'Reset your password', name: 'Asha', otp: '482913', intro: 'Use this code.' });
  assert.match(html, /482913/);
  assert.match(html, /valid for 10 minutes/);
  assert.match(html, /Velaivaaipu/);
  assert.match(html, /Hi Asha,/);
});

test('a name with HTML in it is escaped, not run', () => {
  const html = otpEmail({ title: 'T', name: '<img src=x onerror=alert(1)>', otp: '111111', intro: 'x' });
  assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;img/);
});

test('missing name falls back to "there"', () => {
  assert.match(otpEmail({ title: 'T', otp: '123456', intro: 'x' }), /Hi there,/);
});
