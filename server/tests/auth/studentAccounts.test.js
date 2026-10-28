const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const fs = require('node:fs');
const path = require('node:path');
const { randomPasswordHash } = require('../../utils/studentPassword');

test('each generated password hash is unique and cannot be a phone number or roll number', async () => {
  const a = await randomPasswordHash();
  const b = await randomPasswordHash();
  assert.notEqual(a, b);
  for (const guess of ['9876543210', '919876543210', '21CS001', 'password', '']) {
    assert.equal(await bcrypt.compare(guess, a), false);
  }
});

test('the CSV import no longer derives a password from the phone or roll number', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../controllers/collegeController.js'), 'utf8');
  assert.ok(!/defaultPassword/.test(src), 'defaultPassword (phone || rollNumber) must not come back');
  assert.ok(/randomPasswordHash\(\)/.test(src));
});

test('the unsafe legacy skill-test routes are gone', () => {
  const router = require('../../routes/skillTestRoutes');
  const paths = router.stack.filter((l) => l.route).map((l) => `${Object.keys(l.route.methods)[0]} ${l.route.path}`);
  assert.deepEqual(paths.sort(), ['get /categories', 'get /my-results', 'post /save']);
});

test('the CSV import matches an existing account by email only, never by phone', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../controllers/collegeController.js'), 'utf8');
  assert.ok(!/'profile\.phone': phone/.test(src), 'matching a user by phone must not come back');
  assert.ok(/let user = await User\.findOne\(\{ email \}\);/.test(src));
});

test('the credentials CSV no longer lists a default password', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../controllers/collegeController.js'), 'utf8');
  assert.ok(!/Default Password/.test(src));
});
