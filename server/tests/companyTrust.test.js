'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const stub = (p, exports) => { const r = require.resolve(p); require.cache[r] = { id: r, filename: r, loaded: true, exports }; };
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const ID = 'a'.repeat(24);
let company;
let proofs;
let created;
const found = (id) => (String(id) === ID ? company : null);
// findById(...) can be awaited directly or chained with .select(...)
stub('../models/Company', { findById: (id) => ({ select: async () => found(id), then: (a, b) => Promise.resolve(found(id)).then(a, b) }) });
stub('../models/User', { findById: () => ({ select: async () => ({ company: ID, email: 'ravi@gmail.com' }) }), find: () => ({ select: () => ({ lean: () => Promise.resolve([]) }) }) });
stub('../models/AdminRequest', {
  findById: async (id) => proofs.find((p) => String(p._id) === String(id)) || null,
  exists: async (q) => proofs.some((p) => p.type === q.type && p.status === q.status && String(p.company) === String(q.company)),
  create: async (doc) => { created = { _id: 'r1', ...doc }; return created; },
});

const { setVerifiedByCall } = require('../controllers/companyVerificationController');
const { submitProof, approveProof, rejectProof, listProofs, checkProofInput } = require('../controllers/companyProofController');
const { sanitizeCompanyData } = require('../utils/companyData');

const res = () => ({ statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } });
const call = async (fn, req) => { const r = res(); await fn(req, r); return r; };
const admin = { id: 'admin1', role: 'admin' };

beforeEach(() => {
  created = null;
  proofs = [];
  company = { _id: ID, name: 'Sri Traders', is_verified: false, verifiedByCall: false, save: async function () { this.saved = true; } };
});

describe('Verified employer (verifiedByCall)', () => {
  it('admin sets it with a note; date, note and who are recorded; is_verified is not touched', async () => {
    const r = await call(setVerifiedByCall, { params: { id: ID }, body: { value: true, note: 'Called 9 Nov, owner confirmed' }, user: admin });
    assert.equal(r.statusCode, 200);
    assert.equal(company.verifiedByCall, true);
    assert.ok(company.verifiedByCallAt instanceof Date);
    assert.equal(company.verifiedByCallNote, 'Called 9 Nov, owner confirmed');
    assert.equal(company.verifiedByCallBy, 'admin1');
    assert.equal(company.is_verified, false);
  });
  it('a note is required, and the value must be a boolean', async () => {
    assert.equal((await call(setVerifiedByCall, { params: { id: ID }, body: { value: true, note: '' }, user: admin })).statusCode, 400);
    assert.equal((await call(setVerifiedByCall, { params: { id: ID }, body: { value: 'yes', note: 'called them' }, user: admin })).statusCode, 400);
    assert.equal(company.verifiedByCall, false);
  });
  it('non-admins can never set it (staff, support, company, recruiter, no user)', async () => {
    for (const user of [{ id: 'x', role: 'subadmin' }, { id: 'x', role: 'support' }, { id: 'x', role: 'company' }, { id: 'x', role: 'recruiter' }, { id: 'x', role: 'jobseeker' }, undefined]) {
      const r = await call(setVerifiedByCall, { params: { id: ID }, body: { value: true, note: 'called them, fine' }, user });
      assert.equal(r.statusCode, 403);
    }
    assert.equal(company.verifiedByCall, false);
    assert.ok(!company.saved);
  });
  it('the route sits behind the admin-only gate, and a company cannot send the fields itself', () => {
    const src = read('../routes/adminRoutes.js');
    assert.ok(src.indexOf("router.use(authorizeRoles('admin'))") < src.indexOf('/companies/:id/verified-by-call'));
    const out = sanitizeCompanyData({ name: 'X', verifiedByCall: true, verifiedByCallNote: 'x', verifiedByCallAt: new Date(), verifiedByCallBy: 'u' });
    assert.deepEqual(Object.keys(out), ['name']);
  });
  it('public job lists and the company page read the flag, never the note', () => {
    assert.match(read('../controllers/jobController.js'), /website verifiedByCall'/);
    assert.match(read('../routes/publicRoutes.js'), /is_verified verifiedByCall/);
    // The note may appear only in the list of fields removed from the public response, never in a .select().
    assert.doesNotMatch(read('../routes/publicRoutes.js'), /\.select\([^)]*verifiedByCallNote/);
  });
});

describe('Proof upload for free-email companies', () => {
  it('checks the input: type, GST format, https links, linkedin host', () => {
    assert.ok(checkProofInput({ proofType: 'x', proofValue: 'a' }).error);
    assert.ok(checkProofInput({ proofType: 'gst', proofValue: '' }, false).error);
    assert.ok(checkProofInput({ proofType: 'gst', proofValue: '123' }).error);
    assert.equal(checkProofInput({ proofType: 'gst', proofValue: '33aaaaa1234a1z5' }).proofValue, '33AAAAA1234A1Z5');
    assert.ok(checkProofInput({ proofType: 'website', proofValue: 'javascript:alert(1)' }).error);
    assert.ok(checkProofInput({ proofType: 'linkedin', proofValue: 'https://evil.example/company/x' }).error);
    assert.ok(checkProofInput({ proofType: 'linkedin', proofValue: 'https://www.linkedin.com/company/sri' }).proofType);
    assert.ok(!checkProofInput({ proofType: 'registration', proofValue: '' }, true).error, 'a PDF alone is enough');
  });
  it('submitting creates an AdminRequest (shown in Needs-action) and does not verify anything', async () => {
    const r = await call(submitProof, { user: { id: 'u1' }, body: { proofType: 'website', proofValue: 'https://sritraders.in' } });
    assert.equal(r.statusCode, 201);
    assert.equal(created.type, 'company_proof');
    assert.equal(created.proofType, 'website');
    assert.equal(company.is_verified, false);
    assert.ok(!company.saved);
  });
  it('one pending proof at a time; verified companies are refused; non-PDF files are refused', async () => {
    proofs = [{ _id: 'p0', type: 'company_proof', status: 'pending', company: ID }];
    assert.equal((await call(submitProof, { user: { id: 'u1' }, body: { proofType: 'website', proofValue: 'https://a.in' } })).statusCode, 409);
    proofs = [];
    company.is_verified = true;
    assert.equal((await call(submitProof, { user: { id: 'u1' }, body: { proofType: 'website', proofValue: 'https://a.in' } })).statusCode, 400);
    company.is_verified = false;
    const bad = await call(submitProof, { user: { id: 'u1' }, body: { proofType: 'gst' }, file: { filename: 'proofFile-1.exe', path: '/nonexistent/x' } });
    assert.equal(bad.statusCode, 400);
  });
  it('approve needs an admin and a note; it verifies the company and closes the request', async () => {
    proofs = [{ _id: 'p1', type: 'company_proof', status: 'pending', company: ID, proofType: 'gst', save: async function () { this.saved = true; } }];
    assert.equal((await call(approveProof, { params: { id: 'p1' }, body: { note: 'GST portal matches' }, user: { id: 's', role: 'subadmin' } })).statusCode, 403);
    assert.equal((await call(approveProof, { params: { id: ID }, body: { note: '' }, user: admin })).statusCode, 400);
    assert.equal((await call(approveProof, { params: { id: 'p1' }, body: { note: '' }, user: admin })).statusCode, 400);
    assert.equal(company.is_verified, false);
    const ok = await call(approveProof, { params: { id: ID.replace(/a/g, 'b') }, body: { note: 'x'.repeat(8) }, user: admin });
    assert.equal(ok.statusCode, 404);
  });
  it('approving a real pending proof verifies with who, when and note', async () => {
    const pid = 'c'.repeat(24);
    proofs = [{ _id: pid, type: 'company_proof', status: 'pending', company: ID, proofType: 'gst', save: async function () { this.saved = true; } }];
    const r = await call(approveProof, { params: { id: pid }, body: { note: 'GST portal matches name' }, user: admin });
    assert.equal(r.statusCode, 200);
    assert.equal(company.is_verified, true);
    assert.equal(company.verifiedBy, 'admin1');
    assert.match(company.verification_note, /GST portal matches name/);
    assert.equal(proofs[0].status, 'approved');
    assert.equal((await call(approveProof, { params: { id: pid }, body: { note: 'again again' }, user: admin })).statusCode, 409);
  });
  it('rejecting leaves the company unverified; listing is admin only', async () => {
    const pid = 'd'.repeat(24);
    proofs = [{ _id: pid, type: 'company_proof', status: 'pending', company: ID, save: async function () {} }];
    const r = await call(rejectProof, { params: { id: pid }, body: { note: 'GST does not match' }, user: admin });
    assert.equal(r.body.status, 'cancelled');
    assert.equal(company.is_verified, false);
    assert.equal((await call(listProofs, { user: { id: 'x', role: 'company' } })).statusCode, 403);
  });
  it('wiring: company route is company-only, admin routes are behind the gate, Needs-action links to Companies', () => {
    const co = read('../routes/company.js');
    assert.ok(co.indexOf("router.use(authorizeRoles('company'))") < co.indexOf('/verification-proof'));
    const adm = read('../routes/adminRoutes.js');
    assert.ok(adm.indexOf("router.use(authorizeRoles('admin'))") < adm.indexOf('/company-proofs'));
    const { buildNeedsAction } = require('../utils/needsAction');
    const out = buildNeedsAction({ requests: [{ _id: 'r1', type: 'company_proof', bookingName: 'Sri Traders', createdAt: new Date() }, { _id: 'r2', type: 'counselling', createdAt: new Date() }] });
    assert.equal(out.items.find((i) => i.id === 'r1').link, '/admin/companies');
    assert.equal(out.items.find((i) => i.id === 'r2').link, '/admin/requests');
  });
});
