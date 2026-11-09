const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('module');

let seq = 0;
const drives = []; const regs = []; const mails = [];
const wrapDrive = (o) => Object.assign(o, { save: async () => o });
const wrapReg = (o) => Object.assign(o, { save: async () => o });
const matches = (o, f) => Object.entries(f).every(([k, v]) => (v && typeof v === 'object' && !(v instanceof Date) ? (v.$ne !== undefined ? o[k] !== v.$ne : v.$gte !== undefined ? o[k] >= v.$gte : true) : String(o[k]) === String(v)));
const driveStub = {
  create: async (d) => { const o = wrapDrive({ _id: String(++seq).padStart(24, 'a'), status: 'pending_approval', paid: false, addons: [], invitedUsers: [], nextToken: 1, createdAt: new Date(), ...d }); drives.push(o); return o; },
  findOne: (f) => { const v = drives.find((d) => matches(d, f)) || null; const p = Promise.resolve(v); p.select = async () => v; return p; },
  findById: async (id) => drives.find((d) => d._id === id) || null,
  countDocuments: async (f) => drives.filter((d) => d.organiser === f.organiser && d.plan === f.plan && d.status !== 'rejected' && d.createdAt >= f.createdAt.$gte).length,
  findByIdAndUpdate: async (id) => { const d = drives.find((x) => x._id === id); const before = { ...d }; d.nextToken += 1; return before; },
  find: () => ({ sort: () => ({ limit: async () => drives }) }),
};
const sel = (arr) => { const p = Promise.resolve(arr); p.select = async () => arr; p.sort = () => Promise.resolve(arr); return p; };
const regStub = {
  create: async (d) => { if (regs.some((r) => r.code === d.code)) { const e = new Error('dup code'); e.code = 11000; throw e; } const o = wrapReg({ _id: String(++seq).padStart(24, 'b'), status: 'registered', ...d }); regs.push(o); return o; },
  findOne: async (f) => regs.find((r) => matches(r, f)) || null,
  find: (f) => sel(regs.filter((r) => matches(r, f))),
};
let seekerQuery = null; const seekers = [{ _id: 'u1', name: 'S1', email: 's1@x.in' }, { _id: 'u2', name: 'S2', email: 's2@x.in' }, { _id: 'u3', name: 'S3', email: 's3@x.in' }];
const userStub = { find: (q) => { seekerQuery = q; return { select: () => ({ limit: async (n) => seekers.filter((x) => !q._id.$nin.includes(x._id)).slice(0, n) }) }; }, findById: () => ({ select: async () => ({ name: 'Acme', email: 'org@x.in' }) }) };
const realLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === '../models/WalkInDrive') return driveStub;
  if (request === '../models/DriveRegistration') return regStub;
  if (request === '../models/User') return userStub;
  if (request === '../utils/sendEmail') return async (m) => { mails.push(m); };
  if (request === '../utils/emailTemplates') return { emailWrapper: (t, b) => `${t}|${b}` };
  if (request === '../utils/lifecycleEmails') return { unsubscribeLink: (id) => `https://api/unsub/${id}` };
  if (request === 'qrcode') return { toBuffer: async () => Buffer.from('png') };
  return realLoad.call(this, request, ...rest);
};
const c = require('../controllers/walkInDriveController');
const res = () => { const r = { code: 200, headers: {} }; r.status = (n) => { r.code = n; return r; }; r.json = (b) => { r.body = b; return r; }; r.set = (k, v) => { r.headers[k] = v; return r; }; r.send = (b) => { r.body = b; return r; }; return r; };
const run = async (fn, req) => { const r = res(); await fn({ params: {}, body: {}, query: {}, user: { id: 'org1' }, ...req }, r); return r; };
const future = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
const input = (o = {}) => ({ title: 'Walk-in for Cashiers', date: future, roles: [{ title: 'Cashier', vacancies: 5 }], slots: [{ label: '10 AM', capacity: 2 }, { label: '2 PM', capacity: 5 }], venue: { address: 'Main Rd' }, screeningQuestions: ['Experience?'], plan: 'free', ...o });
const publish = (d) => { d.status = 'published'; return d; };

test('free plan: one drive a month, then a plain refusal; a paid plan is still allowed', async () => {
  const a = await run(c.createDrive, { body: input() });
  assert.equal(a.code, 201);
  assert.equal(drives.at(-1).screeningQuestions.length, 0, 'free plan has no screening questions');
  assert.equal((await run(c.createDrive, { body: input() })).code, 403);
  assert.equal((await run(c.createDrive, { body: input({ plan: 'plus' }) })).code, 201);
  assert.equal((await run(c.createDrive, { body: input({ title: 'x' }) })).code, 400);
});

test('add-ons can be asked for on a free drive and add nothing until paid', async () => {
  const d = drives[0];
  const r = await run(c.requestAddon, { params: { id: d._id }, body: { key: 'extra_registrations', qty: 2 } });
  assert.equal(r.code, 201);
  assert.equal(r.body.quote.lines.at(-1).base, 398);
  assert.equal((await run(c.requestAddon, { params: { id: d._id }, body: { key: 'nope' } })).code, 400);
  assert.equal((await run(c.requestAddon, { params: { id: d._id }, body: { key: 'full_report' }, user: { id: 'someone-else' } })).code, 404);
});

test('admin cannot approve a paid plan until it is marked paid, and paid needs a note', async () => {
  const plus = drives.find((x) => x.plan === 'plus');
  assert.equal((await run(c.reviewDrive, { params: { id: plus._id }, body: { decision: 'approve' } })).code, 400);
  assert.equal((await run(c.markPaid, { params: { id: plus._id }, body: { key: 'plan' } })).code, 400);
  assert.equal((await run(c.markPaid, { params: { id: plus._id }, body: { key: 'plan', note: 'UPI 123' } })).code, 200);
  assert.equal((await run(c.reviewDrive, { params: { id: plus._id }, body: { decision: 'approve' } })).code, 200);
  assert.equal(plus.status, 'published');
  assert.ok(mails.some((m) => /live/i.test(m.subject)));
});

test('a rejection needs a reason; an unpaid add-on blocks approval unless told to continue', async () => {
  const free = drives[0];
  assert.equal((await run(c.reviewDrive, { params: { id: free._id }, body: { decision: 'reject' } })).code, 400);
  assert.equal((await run(c.reviewDrive, { params: { id: free._id }, body: { decision: 'approve' } })).code, 400);
  assert.equal((await run(c.reviewDrive, { params: { id: free._id }, body: { decision: 'approve', ignoreUnpaidAddons: true } })).code, 200);
  assert.equal(free.status, 'published');
});

test('registration: validation, slot capacity, cap including paid add-ons, duplicate phone', async () => {
  const d = drives[0];
  const reg = (body) => run(c.registerForDrive, { params: { slug: d.slug }, body });
  assert.equal((await reg({ name: 'A', phone: '123', slot: '10 AM' })).code, 400);
  assert.equal((await reg({ name: 'Anu', phone: '9876543210', slot: 'midnight' })).code, 400);
  const ok = await reg({ name: 'Anu', phone: '9876543210', slot: '10 AM', email: 'a@x.in' });
  assert.equal(ok.code, 201); assert.match(ok.body.code, /^[A-Z2-9]{8}$/);
  const dup = await reg({ name: 'Anu', phone: '+91 98765 43210', slot: '10 AM' });
  assert.equal(dup.body.already, true); assert.equal(regs.length, 1);
  assert.equal((await reg({ name: 'Bala', phone: '9876543211', slot: '10 AM' })).code, 201);
  assert.equal((await reg({ name: 'Chitra', phone: '9876543212', slot: '10 AM' })).code, 409, 'slot full');
  // overall cap: free = 50. Fill with fake regs to the cap.
  d.slots.push({ label: 'big', capacity: 999 });
  while (regs.filter((r) => r.drive === d._id).length < 50) regs.push(wrapReg({ _id: String(++seq).padStart(24, 'c'), drive: d._id, phone: `x${seq++}`, slot: 'big', status: 'registered', code: `C${seq}` }));
  assert.equal((await reg({ name: 'Dev', phone: '9876543213', slot: 'big' })).code, 409);
  d.addons[0].paid = true; // 2 x 100 more
  assert.equal((await reg({ name: 'Dev', phone: '9876543213', slot: 'big' })).code, 201);
});

test('drafts and unknown drives cannot be registered for', async () => {
  const draft = drives.find((x) => x.status === 'pending_approval') || (await driveStub.create({ organiser: 'o', slug: 'draft', date: new Date(Date.now() + 864e5), slots: [{ label: 'a', capacity: 1 }], venue: {}, screeningQuestions: [], plan: 'free' }));
  assert.equal((await run(c.registerForDrive, { params: { slug: draft.slug }, body: {} })).code, 404);
  assert.equal((await run(c.getDrive, { params: { slug: draft.slug } })).code, 404);
});

test('check-in numbers tokens in order, and code check-in needs Plus', async () => {
  const free = drives[0]; const plus = drives.find((x) => x.plan === 'plus');
  const byPhone = await run(c.checkIn, { params: { id: free._id }, body: { phone: '9876543210' } });
  assert.equal(byPhone.body.tokenNumber, 1);
  const again = await run(c.checkIn, { params: { id: free._id }, body: { phone: '9876543210' } });
  assert.equal(again.body.already, true); assert.equal(again.body.tokenNumber, 1);
  const second = await run(c.checkIn, { params: { id: free._id }, body: { phone: '9876543211' } });
  assert.equal(second.body.tokenNumber, 2);
  assert.equal((await run(c.checkIn, { params: { id: free._id }, body: { code: 'ABCDEFGH' } })).code, 403);
  const code = regs.find((r) => r.phone === '9876543213').code;
  void plus; void code;
});

test('results: only after check-in; joining date kept for selected; wrong organiser blocked', async () => {
  const free = drives[0];
  const anu = regs.find((r) => r.phone === '9876543210'); const bala = regs.find((r) => r.phone === '9876543211');
  const waiting = regs.find((r) => r.status === 'registered' && r.drive === free._id);
  assert.ok(waiting);
  assert.equal((await run(c.updateRegistration, { params: { id: free._id, regId: waiting._id }, body: { status: 'selected' } })).code, 400);
  const sel = await run(c.updateRegistration, { params: { id: free._id, regId: anu._id }, body: { status: 'selected', joiningDate: '2026-12-01', note: 'Good' } });
  assert.equal(sel.code, 200); assert.ok(anu.joiningDate);
  assert.equal((await run(c.updateRegistration, { params: { id: free._id, regId: bala._id }, body: { status: 'banana' } })).code, 400);
  assert.equal((await run(c.updateRegistration, { params: { id: free._id, regId: bala._id }, body: { status: 'on_hold' }, user: { id: 'other' } })).code, 404);
});

test('report: counts for all, CSV and cost per hire gated by plan or paid add-on', async () => {
  const free = drives[0];
  const r = await run(c.report, { params: { id: free._id } });
  assert.equal(r.body.summary.selected, 1); assert.equal(r.body.costPerHire, undefined);
  assert.equal((await run(c.report, { params: { id: free._id }, query: { format: 'csv' } })).code, 403);
  free.addons.push({ key: 'full_report', qty: 1, paid: true });
  const csv = await run(c.report, { params: { id: free._id }, query: { format: 'csv' } });
  assert.equal(csv.code, 200); assert.match(csv.body, /^Name,Phone/); assert.match(csv.body, /Selected/);
  assert.ok((await run(c.report, { params: { id: free._id } })).body.bySlot);
});

test('thank-you mails go once, only to people who attended', async () => {
  const free = drives[0]; free.date = new Date(Date.now() - 864e5);
  mails.length = 0;
  const a = await run(c.sendThanks, { params: { id: free._id } });
  assert.equal(a.code, 200); assert.equal(mails.length, a.body.sent);
  assert.equal((await run(c.sendThanks, { params: { id: free._id } })).code, 400);
});

test('public page and QR work for a live drive', async () => {
  const free = drives[0]; free.date = new Date(Date.now() + 864e5);
  const g = await run(c.getDrive, { params: { slug: free.slug } });
  assert.equal(g.code, 200); assert.match(g.body.shareText, /Register free/); assert.ok(!JSON.stringify(g.body).includes('org1'));
  const q = await run(c.driveQr, { params: { slug: free.slug } });
  assert.equal(q.headers['Content-Type'], 'image/png');
});

test('invites: need a live drive, a city and invites left; skip unsubscribed; never the same person twice', async () => {
  const free = drives[0];
  assert.equal((await run(c.inviteSeekers, { params: { id: free._id } })).code, 403, 'free plan has no invites');
  const plus = drives.find((x) => x.plan === 'plus');
  plus.venue.city = '';
  assert.equal((await run(c.inviteSeekers, { params: { id: plus._id } })).code, 400);
  plus.venue.city = 'Villupuram (north)';
  mails.length = 0;
  const a = await run(c.inviteSeekers, { params: { id: plus._id } });
  assert.equal(a.code, 200); assert.equal(a.body.sent, 3); assert.equal(plus.invitedUsers.length, 3);
  assert.equal(seekerQuery['emailPrefs.marketingOptOut'].$ne, true);
  assert.ok(seekerQuery['profile.location'].test('villupuram (north)'));
  assert.ok(!seekerQuery['profile.location'].test('Chennai'));
  assert.match(mails[0].html, /unsub/);
  assert.equal((await run(c.inviteSeekers, { params: { id: plus._id } })).body.sent, 0);
});
