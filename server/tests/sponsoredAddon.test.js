const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { SPONSOR_PACKS, findSponsorPack, sponsorBlockedByFlags, pinPriority } = require('../utils/sponsorAddon');
const { checkSponsor, MAX_SPONSORED } = require('../utils/jobPromotion');
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const now = new Date('2026-11-12T00:00:00Z');
const future = new Date('2026-12-30T00:00:00Z');

test('only a usable sponsor pack is found, the shortest first, and a chosen key narrows it', () => {
  const list = [
    { _id: 1, featureKey: 'sponsoredJob30', isActive: true, usageLeft: 1, expiresAt: future },
    { _id: 2, featureKey: 'sponsoredJob7', isActive: true, usageLeft: 1, expiresAt: future },
    { _id: 3, featureKey: 'sponsoredJob15', isActive: true, usageLeft: 0, expiresAt: future },
    { _id: 4, featureKey: 'hasPriorityListing', isActive: true, usageLeft: 1, expiresAt: future },
  ];
  assert.strictEqual(findSponsorPack(list, '', now)._id, 2);
  assert.strictEqual(findSponsorPack(list, 'sponsoredJob30', now)._id, 1);
  assert.strictEqual(findSponsorPack(list, 'sponsoredJob15', now), null, 'used up');
  assert.strictEqual(findSponsorPack([{ featureKey: 'sponsoredJob7', isActive: true, usageLeft: 1, expiresAt: new Date('2026-11-01') }], '', now), null, 'expired');
  assert.deepStrictEqual(SPONSOR_PACKS, { sponsoredJob7: 7, sponsoredJob15: 15, sponsoredJob30: 30 });
});
test('the same safety rules as an admin sponsorship still apply', () => {
  const ok = { status: 'active', company: { is_verified: true } };
  assert.ok(checkSponsor({ job: ok, days: 7, note: 'Bought as an add-on', activeOthers: 0 }).until);
  assert.match(checkSponsor({ job: { status: 'active', company: { is_verified: false } }, days: 7, note: 'x', activeOthers: 0 }).error, /verified/);
  assert.match(checkSponsor({ job: { status: 'closed', company: { is_verified: true } }, days: 7, note: 'x', activeOthers: 0 }).error, /live/);
  assert.match(checkSponsor({ job: ok, days: 7, note: 'x', activeOthers: MAX_SPONSORED }).error, /already sponsored/);
});
test('a flagged, unchecked job cannot be sponsored; a cleared one can', () => {
  assert.strictEqual(sponsorBlockedByFlags({ scamFlags: ['asks_for_money'], scamReviewed: false }), true);
  assert.strictEqual(sponsorBlockedByFlags({ scamFlags: ['asks_for_money'], scamReviewed: true }), false);
  assert.strictEqual(sponsorBlockedByFlags({ scamFlags: [] }), false);
});
test('only three Priority jobs are pinned on top, the rest keep order', () => {
  const jobs = ['a', 'p1', 'p2', 'b', 'p3', 'p4', 'c'].map((n) => ({ n }));
  const out = pinPriority(jobs, (j) => j.n.startsWith('p')).map((j) => j.n);
  assert.deepStrictEqual(out, ['p1', 'p2', 'p3', 'a', 'b', 'p4', 'c']);
});
test('the route is for company roles only, uses a pack atomically, refunds on a failed save, and no price or Razorpay code is touched', () => {
  assert.match(read('../routes/job.js'), /sponsor-addon', verifyToken, authorizeRoles\('recruiter', 'company', 'org_employee'\)/);
  const c = read('../controllers/jobPromotionController.js');
  assert.match(c, /\$elemMatch: \{ _id: pack\._id, usageLeft: \{ \$gt: 0 \} \}/);
  assert.match(c, /'purchasedFeatures\.\$\.usageLeft': 1/);
  assert.ok(c.indexOf('checkSponsor(') < c.indexOf("'purchasedFeatures.$.usageLeft': -1"), 'slots are checked before anything is used up');
  assert.ok(!/razorpay|\bgst\b|₹|\d{3,}/i.test(read('../utils/sponsorAddon.js').replace(/\/\/.*$/gm, '')), 'no money or Razorpay in the add-on rules');
});
