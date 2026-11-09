const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanUtm, channelOf, summarize, cleanDays } = require('../utils/signupSource');

test('ad tags are lowercased, cleaned and kept short', () => {
  assert.deepEqual(cleanUtm({ source: ' Instagram ', medium: 'SOCIAL<script>', campaign: 'x'.repeat(90) }), { source: 'instagram', medium: 'socialscript', campaign: 'x'.repeat(40) });
});
test('missing, odd or non-object tags become empty', () => {
  const empty = { source: '', medium: '', campaign: '' };
  assert.deepEqual(cleanUtm(undefined), empty);
  assert.deepEqual(cleanUtm('instagram'), empty);
});
test('channel name: tags first, then invite link, then direct', () => {
  assert.equal(channelOf({ signupSource: { source: 'instagram', medium: 'social', campaign: 'drive-nov' } }), 'instagram / social / drive-nov');
  assert.equal(channelOf({ signupSource: { source: '', medium: 'paid', campaign: '' } }), 'unknown / paid');
  assert.equal(channelOf({ referredBy: 'abc' }), 'invite link');
  assert.equal(channelOf({ signupSource: { source: 'google' }, referredBy: 'abc' }), 'google');
  assert.equal(channelOf({}), 'direct or unknown');
});
test('summary counts people by channel and role, biggest first', () => {
  const rows = summarize([
    { signupSource: { source: 'instagram', medium: 'social' }, isVerified: true, roleName: 'jobseeker' },
    { signupSource: { source: 'instagram', medium: 'social' }, isVerified: false, roleName: 'jobseeker' },
    { signupSource: { source: 'instagram', medium: 'social' }, isVerified: true, roleName: 'company' },
    { isVerified: true, roleName: 'college' },
  ]);
  assert.deepEqual(rows[0], { channel: 'instagram / social', signups: 3, verified: 2, jobseekers: 2, companies: 1, colleges: 0 });
  assert.equal(rows[1].channel, 'direct or unknown'); assert.equal(rows[1].colleges, 1);
  assert.deepEqual(summarize(undefined), []);
});
test('day windows allow only the offered choices', () => {
  assert.equal(cleanDays('60'), 60); assert.equal(cleanDays('5'), 30); assert.equal(cleanDays(undefined), 30);
});
