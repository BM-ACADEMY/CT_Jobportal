'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { countByType } = require('../utils/lifecycle/emailCounts');

const DAY = 86400000;
const now = Date.now();
const at = (d) => new Date(now - d * DAY);

test('counts per mail type for 7 and 30 days; ids and dates in keys are folded away', () => {
  const out = countByType([
    { key: 'js_profile_incomplete', sentAt: at(1) },
    { key: 'js_profile_incomplete_d7', sentAt: at(10) },
    { key: 'weekly-2915', sentAt: at(2) },
    { key: 'weekly-2914', sentAt: at(9) },
    { key: 'wel_seeker_d2', sentAt: at(3) },
    { key: 'wel_seeker_d2', sentAt: at(40) }, // outside both windows
  ], now);
  const row = (k) => out.rows.find((r) => r.kind === k);
  assert.equal(row('weekly').sent7, 1);
  assert.equal(row('weekly').sent30, 2);
  assert.equal(row('wel_seeker_d2').sent7, 1);
  assert.equal(row('wel_seeker_d2').sent30, 1);
  assert.equal(out.totals.sent30, 5);
  assert.equal(out.totals.sent7, 3);
});
test('failed and opened are reported as not tracked, never as zero', () => {
  const out = countByType([{ key: 'weekly-1', sentAt: at(1) }], now);
  assert.equal(out.rows[0].failed7, null);
  assert.equal(out.rows[0].opened30, null);
  assert.deepEqual(out.tracked, { failed: false, opened: false });
  assert.deepEqual(countByType([], now).rows, []);
});
test('the by-type route is admin only and read-only', () => {
  const routes = fs.readFileSync(require.resolve('../routes/adminRoutes.js'), 'utf8');
  assert.ok(routes.indexOf('/email-report/by-type') > routes.indexOf("router.use(authorizeRoles('admin'))"));
  const code = fs.readFileSync(require.resolve('../controllers/emailReportController.js'), 'utf8').replace(/\/\/.*$/gm, '');
  assert.ok(!/razorpay|\.save\(|updateOne|create\(|deleteMany/i.test(code));
});
