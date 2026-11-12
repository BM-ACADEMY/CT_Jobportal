const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const t = require('../utils/collegeTools');

test('eligibility: old drives with only minCGPA behave as before', () => {
  assert.equal(t.academicCutoffReason({ cgpa: 6 }, { minCGPA: 6.5 }), 'CGPA below 6.5');
  assert.equal(t.academicCutoffReason({ cgpa: 7 }, { minCGPA: 6.5 }), null);
  assert.equal(t.academicCutoffReason({ cgpa: 1 }, {}), null);
});

test('eligibility: percentage-only and either-of-both', () => {
  assert.equal(t.academicCutoffReason({ cgpa: 8 }, { minPercentage: 70 }), null); // 76%
  assert.equal(t.academicCutoffReason({ cgpa: 6 }, { minPercentage: 70 }), 'Percentage below 70');
  assert.equal(t.academicCutoffReason({ cgpa: 8 }, { minCGPA: 9, minPercentage: 70 }), null);
  assert.match(t.academicCutoffReason({ cgpa: 5 }, { minCGPA: 9, minPercentage: 70 }), /CGPA below 9 and percentage below 70/);
});

test('sanitizeEligibility clamps minPercentage and passes other fields through', () => {
  assert.equal(t.sanitizeEligibility({ minPercentage: 250 }).minPercentage, 100);
  assert.equal(t.sanitizeEligibility({ minPercentage: 'x' }).minPercentage, 0);
  assert.equal(t.sanitizeEligibility({ minCGPA: 6 }).minCGPA, 6);
  assert.equal(t.sanitizeEligibility(undefined), undefined);
});

test('milestones are computed from counts', () => {
  const none = t.computeMilestones({});
  assert.equal(none.doneCount, 0);
  const all = t.computeMilestones({ driveCount: 1, studentCount: 60, offerCount: 2 });
  assert.equal(all.doneCount, 3);
  assert.equal(t.computeMilestones({ studentCount: 49 }).items[1].done, false);
  assert.equal(t.computeMilestones({ studentCount: 49 }).items[1].progress, '49/50');
});

test('principal report: never sends without a stored principal email', async () => {
  let sends = 0;
  const sendEmailFn = async () => { sends++; return true; };
  const statsFn = async () => ({ totalStudents: 1, placed: 0, successRate: 0, interviewing: 0, driveCount: 0, averageLPA: 0 });
  for (const principalEmail of ['', '   ', undefined, 'not-an-email']) {
    const r = await t.sendPrincipalSummary({ name: 'X', principalEmail }, { sendEmailFn, statsFn });
    assert.equal(r.sent, false);
  }
  assert.equal(sends, 0);
  const ok = await t.sendPrincipalSummary({ name: 'X <b>', principalEmail: 'p@college.edu' }, { sendEmailFn, statsFn });
  assert.equal(ok.sent, true);
  assert.equal(sends, 1);
});

test('principal report: monthly job is off unless the flag is exactly true', async () => {
  assert.equal(t.isPrincipalReportEnabled({}), false);
  assert.equal(t.isPrincipalReportEnabled({ COLLEGE_PRINCIPAL_REPORT_ENABLED: 'false' }), false);
  assert.equal(t.isPrincipalReportEnabled({ COLLEGE_PRINCIPAL_REPORT_ENABLED: 'true' }), true);
  assert.deepEqual(await t.runMonthlyPrincipalReports({ env: {} }), { skipped: 'disabled' });
  const cron = fs.readFileSync(path.join(__dirname, '../cron/index.js'), 'utf8');
  assert.ok(/if \(isPrincipalReportEnabled\(\)\)/.test(cron));
});

test('email body escapes college name', () => {
  const { body } = t.buildPrincipalSummaryEmail({ name: '<script>', principalName: 'A&B' }, { totalStudents: 1, placed: 0, successRate: 0, interviewing: 0, driveCount: 0 });
  assert.ok(!body.includes('<script>'));
});

test('one-page summary lines carry the college name and figures', () => {
  const L = t.buildOnePageLines({ name: 'ABC College' }, { totalStudents: 10, placed: 4, successRate: 40, driveCount: 2, offerCount: 4, averageLPA: 3.5, highestLPA: 6, departments: [{ name: 'CSE', count: 10 }] });
  assert.equal(L.college, 'ABC College');
  assert.deepEqual(L.figures[1], ['Placed', 4]);
  assert.deepEqual(L.departments[0], ['CSE', 10]);
});

test('what-you-get: locked features show the cheapest unlocking plan, prices read as stored', () => {
  const plans = [
    { name: 'Campus Pro', price: 39999, duration: 'Yearly', features: [{ name: 'MoU', isActive: true, value: true }] },
    { name: 'Campus Free', price: 0, duration: 'Lifetime', features: [{ name: 'MoU', isActive: false, value: false }, { name: 'CSV', isActive: true, value: true }] },
    { name: 'Campus Lite', price: 14999, duration: 'Yearly', features: [{ name: 'MoU', isActive: false, value: false }] },
  ];
  const r = t.summarizeFeatures(plans, 'campus_free');
  assert.equal(r.lockedCount, 1);
  assert.equal(r.features[0].unlockedBy.plan, 'Campus Pro');
  assert.equal(r.features[0].unlockedBy.price, 39999);
  assert.equal(t.summarizeFeatures(plans, 'campus_pro').lockedCount, 0);
  assert.equal(t.summarizeFeatures([], 'campus_free').lockedCount, 0);
});

test('tools controller and routes load without mongoose and are auth-guarded', () => {
  const c = require('../controllers/collegeToolsController');
  assert.equal(typeof c.sendReportToPrincipal, 'function');
  const src = fs.readFileSync(path.join(__dirname, '../routes/collegeRoutes.js'), 'utf8');
  for (const route of ['reports/one-page-pdf', 'reports/send-to-principal', "'/milestones'", "'/what-you-get'"]) {
    const line = src.split('\n').find((l) => l.includes(route) && l.includes('router.'));
    assert.ok(line && line.includes("authorizeRoles('college')"), route);
  }
});
