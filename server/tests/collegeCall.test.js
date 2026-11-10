const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { STAFF_REQUEST_TYPES } = require('../config/staffPermissions');

test('the new-college call task is not open to staff accounts', () => {
  assert.equal(STAFF_REQUEST_TYPES.includes('college_call'), false);
});

test('the request model knows the new-college call type, and recruiters cannot be assigned it', () => {
  assert.match(fs.readFileSync(__dirname + '/../models/AdminRequest.js', 'utf8'), /'college_call'/);
  const ctl = fs.readFileSync(__dirname + '/../controllers/requestController.js', 'utf8');
  assert.match(ctl, /request\.type === 'college_call'\) return res\.status\(400\)/);
  assert.match(ctl, /if \(request\.type === 'college_call'\) return;/, 'the college is not messaged when the task is ticked');
});
