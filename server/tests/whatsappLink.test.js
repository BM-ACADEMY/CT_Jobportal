const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const src = (...p) => fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'src', ...p), 'utf8');

test('one WhatsApp number lives in the shared contact file', () => {
  const s = src('components', 'common', 'brandContact.jsx');
  assert.match(s, /export const WHATSAPP/);
  assert.match(s, /https:\/\/wa\.me\/916379564744/);
  assert.match(s, /\+91 63795 64744/);
});

test('footer and contact page link to WhatsApp from that one place', () => {
  const footer = src('components', 'home', 'Footer.jsx');
  const contact = src('pages', 'Contact.jsx');
  for (const s of [footer, contact]) {
    assert.match(s, /WHATSAPP/);
    assert.doesNotMatch(s, /wa\.me\/\d/, 'no hard-coded number outside brandContact');
  }
  assert.match(footer, /Chat on WhatsApp/);
  assert.match(contact, /label: 'WhatsApp'/);
});

test('the WhatsApp link opens in a new tab safely', () => {
  assert.match(src('components', 'home', 'Footer.jsx'), /target="_blank" rel="noopener noreferrer" data-testid="footer-whatsapp"/);
});
