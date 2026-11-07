'use strict';
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const stub = (p, exports) => { const r = require.resolve(p); require.cache[r] = { id: r, filename: r, loaded: true, exports }; };

let doc;
let saves = 0;
stub('../../models/Company', {
  findById: async (id) => (id === 'a'.repeat(24) ? doc : null),
});

const { setCompanyVerified } = require('../../controllers/companyVerificationController');
const { sanitizeCompanyData, ADMIN_ONLY_FIELDS } = require('../../utils/companyData');

const ID = 'a'.repeat(24);
const run = async (params, body, user = { id: 'admin1', role: 'admin' }) => {
  const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
  await setCompanyVerified({ params, body, user }, res);
  return res;
};
beforeEach(() => {
  saves = 0;
  doc = { _id: ID, is_verified: false, verifiedAt: null, verifiedBy: null, verification_note: '', save: async function () { saves += 1; } };
});

describe('admin verify company', () => {
  it('verifies with a note and records who, when and what was checked', async () => {
    const r = await run({ id: ID }, { verified: true, note: 'GST matches, owner answered call' });
    assert.equal(r.statusCode, 200);
    assert.equal(doc.is_verified, true);
    assert.equal(doc.verifiedBy, 'admin1');
    assert.ok(doc.verifiedAt instanceof Date);
    assert.equal(doc.verification_note, 'GST matches, owner answered call');
    assert.equal(saves, 1);
  });

  it('refuses to verify without a real note', async () => {
    for (const note of [undefined, '', '  ', 'ok']) {
      const r = await run({ id: ID }, { verified: true, note });
      assert.equal(r.statusCode, 400);
    }
    assert.equal(doc.is_verified, false);
    assert.equal(saves, 0);
  });

  it('takes the badge back and clears who and when', async () => {
    await run({ id: ID }, { verified: true, note: 'checked all three' });
    const r = await run({ id: ID }, { verified: false, note: 'owner not reachable' });
    assert.equal(r.statusCode, 200);
    assert.equal(doc.is_verified, false);
    assert.equal(doc.verifiedBy, null);
    assert.equal(doc.verifiedAt, null);
    assert.equal(doc.verification_note, 'owner not reachable');
  });

  it('rejects a bad id, a non-boolean flag and an unknown company', async () => {
    assert.equal((await run({ id: 'x' }, { verified: true, note: 'checked it' })).statusCode, 400);
    assert.equal((await run({ id: ID }, { verified: 'true', note: 'checked it' })).statusCode, 400);
    assert.equal((await run({ id: ID }, undefined)).statusCode, 400);
    assert.equal((await run({ id: 'b'.repeat(24) }, { verified: true, note: 'checked it' })).statusCode, 404);
  });

  it('limits the note to 300 characters', async () => {
    await run({ id: ID }, { verified: true, note: 'n'.repeat(500) });
    assert.equal(doc.verification_note.length, 300);
  });
});

describe('a company cannot verify itself', () => {
  it('strips every admin-only field from the profile form data', () => {
    const cleaned = sanitizeCompanyData({ name: 'Acme', is_verified: true, verifiedAt: new Date(), verifiedBy: 'x', verification_note: 'trust me' });
    ADMIN_ONLY_FIELDS.forEach((f) => assert.equal(f in cleaned, false, `${f} must be removed`));
    assert.equal(cleaned.name, 'Acme');
  });
});

describe('verify route guard', () => {
  const src = fs.readFileSync(path.join(__dirname, '../../routes/adminRoutes.js'), 'utf8');
  it('sits below the admin-only gate with no permission shortcut', () => {
    const gate = src.indexOf("router.use(authorizeRoles('admin'));");
    const line = src.split('\n').find((l) => l.includes("router.patch('/companies/:id/verify'"));
    assert.ok(gate > 0 && line, 'gate and route exist');
    assert.ok(src.indexOf(line) > gate, 'route is after the gate');
    assert.ok(!line.includes('requireAdminOr'));
  });
});
