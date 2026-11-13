const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'src', 'pages', 'auth', p), 'utf8');

test('both code screens tell people to check Spam', () => {
  for (const f of ['Register.jsx', 'VerifyOtp.jsx']) {
    const src = read(f);
    assert.match(src, /Check your Spam or Promotions folder/, f);
    assert.match(src, /valid for 10 minutes/, f);
  }
});
