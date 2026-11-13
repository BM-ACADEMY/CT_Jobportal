const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { reviewFlags } = require('../utils/reviewFlags');

test('a normal review has no flags', () => {
  assert.deepEqual(reviewFlags('I got an interview call within two weeks of applying. Easy to use on my phone.'), []);
  assert.deepEqual(reviewFlags('Helpful site for finding jobs near Puducherry'), []);
});

test('very short reviews are flagged', () => {
  assert.deepEqual(reviewFlags('Goodk'), ['too_short']);
  assert.deepEqual(reviewFlags('very good site'), ['too_short']);
  assert.deepEqual(reviewFlags(''), ['too_short']);
  assert.deepEqual(reviewFlags(null), ['too_short']);
});

test('adverts, links and phone numbers are flagged', () => {
  assert.ok(reviewFlags('Hiring freshers for our Chennai branch, apply now at our office today').includes('looks_like_advert'));
  assert.ok(reviewFlags('Walk-in interview on Monday for sales executives in Pondicherry').includes('looks_like_advert'));
  assert.ok(reviewFlags('Great place, visit www.mycompany.com for more details about us').includes('has_link'));
  assert.ok(reviewFlags('Nice platform, call me on 98765 43210 for details about the job').includes('has_phone'));
  assert.ok(reviewFlags('Nice platform, call +91 9876543210 for details about the job').includes('has_phone'));
});

test('ordinary praise that mentions jobs or numbers is not flagged', () => {
  assert.deepEqual(reviewFlags('Found 3 jobs in a week and the salary information was clear and honest'), []);
  assert.deepEqual(reviewFlags('Posted on 2026 and got results quickly, very happy with the support team'), []);
});

test('repeated words are flagged', () => {
  assert.ok(reviewFlags('good good good good good good').includes('repeated'));
});

// ── approve gate ──
let existing = { comment: 'Hiring now, apply now, contact us on whatsapp' };
const updates = [];
const stub = (rel, exports) => { const f = require.resolve(path.join(__dirname, '..', rel)); require.cache[f] = { id: f, filename: f, loaded: true, exports }; };
stub('models/Review', {
  findById: () => ({ select: () => ({ lean: async () => existing }) }),
  findByIdAndUpdate: (id, u) => { updates.push(u); return { populate: async () => ({ _id: id, status: u.status, user: { _id: 'u1' } }) }; },
});
stub('utils/inAppNotifications', { notifyUser: async () => {}, notifyRoles: async () => {} });
const { updateReviewStatus } = require('../controllers/reviewController');

const run = async (body) => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await updateReviewStatus({ params: { id: 'r1' }, body }, res);
  return res;
};

test('approving a flagged review needs a confirm; rejecting never does', async () => {
  updates.length = 0;
  const blocked = await run({ status: 'approved' });
  assert.equal(blocked.code, 409);
  assert.equal(blocked.body.code, 'FLAGGED');
  assert.equal(updates.length, 0);
  assert.equal((await run({ status: 'approved', confirm: true })).code, 200);
  assert.equal((await run({ status: 'rejected' })).code, 200);
  assert.equal(updates.length, 2);
});

test('approving a clean review needs no confirm', async () => {
  existing = { comment: 'I found a good job near home within ten days of registering here.' };
  assert.equal((await run({ status: 'approved' })).code, 200);
});
