const test = require('node:test');
const assert = require('node:assert/strict');
const { receivedMessage, reviewAskMessage, askForReviewOnce } = require('../utils/serviceRequestMessages');

const makeRequest = (extra = {}) => ({ _id: 'r1', type: 'counselling', status: 'completed', user: 'u1', reviewAskedAt: null, saves: 0, async save() { this.saves += 1; }, ...extra });

test('received message promises contact within 24 hours and names the right service', () => {
  const c = receivedMessage('counselling', 'Asha');
  assert.match(c.message, /within 24 hours/);
  assert.match(c.title, /career counselling/);
  assert.match(c.message, /Asha/);
  assert.match(receivedMessage('mock_interview', '').title, /mock interview/);
  assert.doesNotMatch(receivedMessage('mock_interview', '').message, /Thanks,/);
});

test('review ask links to the review page and does not promise a place on the home page', () => {
  const m = reviewAskMessage('counselling');
  assert.equal(m.link, '/write-review');
  assert.match(m.message, /may show/);
});

test('sends the review ask once when a session is completed', async () => {
  const sent = [];
  const request = makeRequest();
  assert.equal(await askForReviewOnce({ request, notify: async (n) => { sent.push(n); } }), true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].recipientId, 'u1');
  assert.ok(request.reviewAskedAt);
  assert.equal(await askForReviewOnce({ request, notify: async (n) => { sent.push(n); } }), false);
  assert.equal(sent.length, 1);
});

test('uses the id of a populated user', async () => {
  const sent = [];
  await askForReviewOnce({ request: makeRequest({ user: { _id: 'u7', name: 'X' } }), notify: async (n) => { sent.push(n); } });
  assert.equal(sent[0].recipientId, 'u7');
});

test('no review ask for requests that are not complete, or that are not sessions', async () => {
  const sent = [];
  const notify = async (n) => { sent.push(n); };
  assert.equal(await askForReviewOnce({ request: makeRequest({ status: 'approved' }), notify }), false);
  assert.equal(await askForReviewOnce({ request: makeRequest({ status: 'pending' }), notify }), false);
  assert.equal(await askForReviewOnce({ request: makeRequest({ type: 'website_request' }), notify }), false);
  assert.equal(await askForReviewOnce({ request: makeRequest({ user: null }), notify }), false);
  assert.equal(sent.length, 0);
});

test('a failing notification does not undo the once-only marker or throw', async () => {
  const request = makeRequest();
  const ok = await askForReviewOnce({ request, notify: () => Promise.reject(new Error('boom')) });
  assert.equal(ok, true);
  assert.equal(request.saves, 1);
});
