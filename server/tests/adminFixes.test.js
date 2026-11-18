const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');
const path = require('path');

// Packages missing on the test machine (mongoose and friends) are replaced by an inert stand-in.
const inert = () => new Proxy(function () {}, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => '' : k === 'then' ? undefined : inert()),
  apply: () => inert(),
  construct: () => inert(),
});
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  try { return realLoad.call(this, request, ...rest); }
  catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && !request.startsWith('.')) return inert();
    throw err;
  }
};

const stubModel = (name, exports) => {
  const file = require.resolve(path.join(__dirname, '..', 'models', name));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};
const stubUtil = (name, exports) => {
  const file = require.resolve(path.join(__dirname, '..', 'utils', name));
  require.cache[file] = { id: file, filename: file, loaded: true, exports };
};

const notices = [];
const mails = [];
stubUtil('inAppNotifications', { notifyUser: async (n) => { notices.push(n); }, notifyRoles: async () => {} });
stubUtil('sendEmail', async (m) => { mails.push(m); });

let ticket = null;
stubModel('Ticket', { findByIdAndUpdate: () => ({ populate: async () => ticket }) });
let college = null;
stubModel('College', { findById: () => ({ populate: async () => college }) });

const { updateTicket } = require('../controllers/ticketController');
const { adminVerifyCollege, adminAskCollegeInfo } = require('../controllers/collegeController');

const run = async (fn, req) => {
  const res = { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  await fn({ user: { id: 'a1' }, params: { id: 't1', collegeId: 'c1' }, body: {}, ...req }, res);
  return res;
};
const makeCollege = (extra = {}) => ({
  _id: 'c1', name: 'Anna <b>University</b>', proofDocumentUrl: '', verificationStatus: 'pending',
  tpoUser: { _id: 'u1', name: 'Sathiya', email: 'tpo@example.com' }, saved: 0,
  async save() { this.saved += 1; }, ...extra,
});

test('closing a ticket whose user was deleted still succeeds', async () => {
  ticket = { _id: 't1', status: 'closed', conclusion: 'its closed already', user: null };
  const res = await run(updateTicket, { body: { status: 'closed', conclusion: 'its closed already' } });
  assert.equal(res.code, 200);
  assert.equal(res.body.status, 'closed');
});

test('closing a ticket with a user still notifies that user', async () => {
  notices.length = 0;
  ticket = { _id: 't2', status: 'closed', conclusion: 'done and dusted', user: { _id: 'u9' } };
  await run(updateTicket, { body: { status: 'closed', conclusion: 'done and dusted' } });
  assert.equal(notices.length, 1);
  assert.equal(notices[0].recipientId, 'u9');
});

test('a college with no proof cannot be verified without a written note', async () => {
  college = makeCollege();
  const res = await run(adminVerifyCollege, { body: { status: 'verified' } });
  assert.equal(res.code, 400);
  assert.equal(res.body.code, 'PROOF_OR_NOTE_REQUIRED');
  assert.equal(college.verificationStatus, 'pending');
  assert.equal(college.saved, 0);
  const short = await run(adminVerifyCollege, { body: { status: 'verified', note: 'ok' } });
  assert.equal(short.code, 400);
});

test('a college with no proof can be verified with a note, and the note is kept', async () => {
  college = makeCollege();
  const res = await run(adminVerifyCollege, { body: { status: 'verified', note: 'Called the principal office on 9 Nov' } });
  assert.equal(res.code, 200);
  assert.equal(college.verificationStatus, 'verified');
  assert.equal(college.verificationNote, 'Called the principal office on 9 Nov');
});

test('a college with a proof document verifies without a note', async () => {
  college = makeCollege({ proofDocumentUrl: '/uploads/proof.pdf' });
  const res = await run(adminVerifyCollege, { body: { status: 'verified' } });
  assert.equal(res.code, 200);
  assert.equal(college.verificationStatus, 'verified');
});

test('rejecting never needs a note, and a reason reaches the college by email without raw HTML', async () => {
  mails.length = 0;
  college = makeCollege();
  const res = await run(adminVerifyCollege, { body: { status: 'rejected', note: 'Proof is blurry <script>x</script>' } });
  assert.equal(res.code, 200);
  assert.equal(college.verificationStatus, 'rejected');
  assert.ok(mails[0].html.includes('Proof is blurry'));
  assert.ok(!mails[0].html.includes('<script>'));
  assert.ok(!mails[0].html.includes('<b>University</b>'));
});

test('resetting to pending never needs a note', async () => {
  college = makeCollege({ verificationStatus: 'rejected' });
  const res = await run(adminVerifyCollege, { body: { status: 'pending' } });
  assert.equal(res.code, 200);
});

test('asking a college for proof keeps it pending, saves the message, and tells the college', async () => {
  notices.length = 0; mails.length = 0;
  college = makeCollege();
  const res = await run(adminAskCollegeInfo, { body: { message: 'Please upload the principal letter.' } });
  assert.equal(res.code, 200);
  assert.equal(college.verificationStatus, 'pending');
  assert.equal(college.infoRequests.length, 1);
  assert.equal(college.infoRequests[0].message, 'Please upload the principal letter.');
  assert.equal(notices.length, 1);
  assert.equal(mails.length, 1);
  assert.ok(mails[0].html.includes('Please upload the principal letter.'));
});

test('a message that is too short is refused and nothing is sent', async () => {
  notices.length = 0; mails.length = 0;
  college = makeCollege();
  const res = await run(adminAskCollegeInfo, { body: { message: 'hi' } });
  assert.equal(res.code, 400);
  assert.equal(college.saved, 0);
  assert.equal(mails.length, 0);
});

test('asking an unknown college gives 404', async () => {
  college = null;
  const res = await run(adminAskCollegeInfo, { body: { message: 'Please upload the principal letter.' } });
  assert.equal(res.code, 404);
});
