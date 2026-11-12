const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const read = (p) => fs.readFileSync(require.resolve(p), 'utf8');

test('the owner alert never throws and only uses the Requests routing rule', () => {
  const s = read('../utils/requestOwnerAlert');
  assert.match(s, /findOne\(\{ kind: 'request' \}\)/);
  assert.match(s, /catch \(err\)/);
  assert.match(s, /return false/);
});
test('college signup, pack request and upgrade call all alert the owner', () => {
  assert.match(read('../controllers/collegePackController'), /alertRequestOwner\(\{ io: req\.io, title: 'College asked for a student pack'/);
  assert.match(read('../controllers/collegePackController'), /alertRequestOwner\(\{ io: req\.io, title: 'College asked for a call/);
  assert.match(read('../controllers/authController'), /alertRequestOwner\(\{ io: req\.io, title: 'New college: call within 24 hours'/);
});
