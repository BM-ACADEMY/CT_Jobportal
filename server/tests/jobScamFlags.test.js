const test = require('node:test');
const assert = require('node:assert/strict');
const { jobScamFlags } = require('../utils/jobScamFlags');

test('a normal job is not flagged', () => {
  assert.deepEqual(jobScamFlags({ title: 'Telecaller - Puducherry', description: '<p>Call leads. Salary 15000. WhatsApp 98xxxxxx to apply. No registration fee.</p>' }), []);
});

test('asking for a fee is flagged, but "no fee" is not', () => {
  assert.deepEqual(jobScamFlags({ title: 'Data entry', description: 'Pay registration fee Rs 500 to confirm' }), ['asks_for_money']);
  assert.deepEqual(jobScamFlags({ title: 'Data entry', description: 'Zero security deposit. Free training.' }), []);
  assert.deepEqual(jobScamFlags({ title: 'Typist', description: 'Refundable deposit of 2000 needed' }), ['asks_for_money']);
});

test('OTP or telegram requests and unrealistic pay are flagged', () => {
  assert.deepEqual(jobScamFlags({ title: 'Work', description: 'Share your OTP for verification' }), ['private_chat_or_otp']);
  assert.deepEqual(jobScamFlags({ title: 'Easy', description: 'Earn ₹5000 per day from home' }), ['pay_too_good']);
});

test('empty or missing input gives no flags', () => {
  assert.deepEqual(jobScamFlags(), []);
  assert.deepEqual(jobScamFlags({ title: null, description: null }), []);
});
