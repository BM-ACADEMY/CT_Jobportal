const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { levelFor, nudgeText } = require('../utils/collegeLimit');
const { STAFF_REQUEST_TYPES } = require('../config/staffPermissions');

test('lines are crossed at 70, 90 and 100 percent, and unlimited or empty limits say nothing', () => {
  assert.equal(levelFor(69, 100), 0);
  assert.equal(levelFor(70, 100), 70);
  assert.equal(levelFor(89, 100), 70);
  assert.equal(levelFor(90, 100), 90);
  assert.equal(levelFor(99, 100), 90);
  assert.equal(levelFor(100, 100), 100);
  assert.equal(levelFor(130, 100), 100);
  assert.equal(levelFor(5000, 100000), 0, 'unlimited');
  assert.equal(levelFor(10, 0), 0);
  assert.equal(levelFor(undefined, 100), 0);
});

test('each line has its own plain words and names the numbers', () => {
  const t = [70, 90, 100].map((l) => nudgeText(l, { used: 95, limit: 100, college: 'ABC College' }));
  assert.equal(new Set(t.map((x) => x.title)).size, 3);
  t.forEach((x) => { assert.match(x.message, /95 of 100/); assert.match(x.message, /ABC College/); });
  assert.match(t[2].message, /cannot join/);
});

test('the near-limit task is for admins only and does not message the college when ticked', () => {
  assert.equal(STAFF_REQUEST_TYPES.includes('college_upgrade'), false);
  assert.match(fs.readFileSync(__dirname + '/../models/AdminRequest.js', 'utf8'), /'college_upgrade'/);
  const ctl = fs.readFileSync(__dirname + '/../controllers/requestController.js', 'utf8');
  assert.match(ctl, /request\.type === 'college_call' \|\| request\.type === 'college_upgrade'\) return;/);
  assert.match(ctl, /request\.type === 'college_call' \|\| request\.type === 'college_upgrade'\) return res\.status\(400\)/);
});
