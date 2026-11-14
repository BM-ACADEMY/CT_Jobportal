// Small college helpers: percentage-or-CGPA eligibility, success milestones, principal report
// email, one-page placement summary, locked-feature summary. Pure logic where possible; models and
// pdfkit are required lazily inside functions so this file loads in tests without them.

// ── 1. CGPA or percentage ────────────────────────────────────────────────
// Students are stored with a CGPA (10-point). A percentage is derived with the common 9.5 factor.
const PERCENT_PER_CGPA = 9.5;
const cgpaToPercentage = (cgpa) => Math.round(Number(cgpa || 0) * PERCENT_PER_CGPA * 10) / 10;

// Returns a reason string when the student fails the academic cut-off, otherwise null.
// minCGPA and minPercentage are both optional (0 = not set). When both are set the student
// passes by meeting EITHER one. Older drives only have minCGPA and behave exactly as before.
const academicCutoffReason = (student, rule = {}) => {
  const minCgpa = Number(rule.minCGPA || 0);
  const minPct = Number(rule.minPercentage || 0);
  if (!minCgpa && !minPct) return null;
  const cgpa = Number(student?.cgpa || 0);
  const pct = cgpaToPercentage(cgpa);
  const okCgpa = minCgpa > 0 && cgpa >= minCgpa;
  const okPct = minPct > 0 && pct >= minPct;
  if (okCgpa || okPct) return null;
  if (minCgpa && minPct) return `CGPA below ${minCgpa} and percentage below ${minPct}`;
  return minCgpa ? `CGPA below ${minCgpa}` : `Percentage below ${minPct}`;
};

// Cleans the eligibility object from a request body (adds minPercentage, keeps everything else).
const sanitizeEligibility = (eligibility) => {
  if (!eligibility || typeof eligibility !== 'object') return eligibility;
  const out = { ...eligibility };
  if (out.minPercentage !== undefined) {
    const n = Number(out.minPercentage);
    out.minPercentage = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
  }
  return out;
};

// ── 5. Success milestones ────────────────────────────────────────────────
const MILESTONE_STUDENT_TARGET = 50;
const computeMilestones = ({ driveCount = 0, studentCount = 0, offerCount = 0 } = {}) => {
  const items = [
    { key: 'first_drive', label: 'Create your first drive', done: driveCount >= 1 },
    { key: 'students_50', label: `Add ${MILESTONE_STUDENT_TARGET} students`, done: studentCount >= MILESTONE_STUDENT_TARGET, progress: `${Math.min(studentCount, MILESTONE_STUDENT_TARGET)}/${MILESTONE_STUDENT_TARGET}` },
    { key: 'first_offer', label: 'Record your first offer', done: offerCount >= 1 },
  ];
  return { items, doneCount: items.filter((i) => i.done).length, total: items.length };
};

// ── Shared stats (lazy models) ───────────────────────────────────────────
const computeCollegeStats = async (college) => {
  const CollegeStudent = require('../models/CollegeStudent');
  const CampusDrive = require('../models/CampusDrive');
  const [statusCounts, deptCounts, driveCount, placedStudents] = await Promise.all([
    CollegeStudent.aggregate([{ $match: { college: college._id } }, { $group: { _id: '$placementStatus', count: { $sum: 1 } } }]),
    CollegeStudent.aggregate([{ $match: { college: college._id } }, { $group: { _id: '$department', count: { $sum: 1 } } }]),
    CampusDrive.countDocuments({ college: college._id }),
    CollegeStudent.find({ college: college._id, placementStatus: 'placed' }).select('placedDetails'),
  ]);
  const stats = { registered: 0, active: 0, applied: 0, shortlisted: 0, interviewing: 0, placed: 0, opted_out: 0 };
  statusCounts.forEach((s) => { if (stats[s._id] !== undefined) stats[s._id] = s.count; });
  stats.totalStudents = Object.values(stats).reduce((a, b) => a + b, 0);
  stats.successRate = stats.totalStudents > 0 ? Math.round((stats.placed / stats.totalStudents) * 100) : 0;
  let total = 0, n = 0, offers = 0, highest = 0;
  placedStudents.forEach((s) => (s.placedDetails || []).forEach((p) => {
    offers++;
    if (p.packageLPA > 0) { total += p.packageLPA; n++; highest = Math.max(highest, p.packageLPA); }
  }));
  stats.averageLPA = n ? Number((total / n).toFixed(2)) : 0;
  stats.highestLPA = highest;
  stats.offerCount = offers;
  stats.driveCount = driveCount;
  stats.departments = deptCounts.map((d) => ({ name: d._id || 'Unknown', count: d.count }));
  return stats;
};

// ── 3. Principal report ──────────────────────────────────────────────────
const isPrincipalReportEnabled = (env = process.env) => env.COLLEGE_PRINCIPAL_REPORT_ENABLED === 'true';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (e) => typeof e === 'string' && EMAIL_RE.test(e.trim());
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const buildPrincipalSummaryEmail = (college, stats) => {
  const subject = `[Velaivaaipu] Placement summary - ${college.name}`;
  const rows = [
    ['Students on Velaivaaipu', stats.totalStudents],
    ['Placed', `${stats.placed} (${stats.successRate}%)`],
    ['Interviewing', stats.interviewing],
    ['Campus drives', stats.driveCount],
    ['Average package', stats.averageLPA ? `Rs ${stats.averageLPA} LPA` : '-'],
  ];
  const table = rows.map(([k, v]) => `<tr><td style="padding:6px 12px;color:#475569;">${esc(k)}</td><td style="padding:6px 12px;font-weight:bold;">${esc(v)}</td></tr>`).join('');
  const body = `<p>Dear ${esc(college.principalName || 'Principal')},</p><p>Here is the latest placement summary for <strong>${esc(college.name)}</strong>.</p><table style="border-collapse:collapse;">${table}</table>`;
  return { subject, body };
};

// Sends the summary to the stored principal email. Never sends without one.
const sendPrincipalSummary = async (college, { sendEmailFn, wrap, statsFn = computeCollegeStats } = {}) => {
  const to = (college.principalEmail || '').trim();
  if (!isValidEmail(to)) return { sent: false, reason: 'NO_PRINCIPAL_EMAIL' };
  const stats = await statsFn(college);
  const { subject, body } = buildPrincipalSummaryEmail(college, stats);
  const html = wrap ? wrap(`${esc(college.name)} Placement Summary`, body) : body;
  const ok = await sendEmailFn({ email: to, subject, html });
  return ok === false ? { sent: false, reason: 'SEND_FAILED' } : { sent: true, to };
};

const MONTHLY_WINDOW_DAYS = 28;
// Monthly auto-email. Does nothing unless COLLEGE_PRINCIPAL_REPORT_ENABLED=true.
const runMonthlyPrincipalReports = async ({ env = process.env } = {}) => {
  if (!isPrincipalReportEnabled(env)) return { skipped: 'disabled' };
  const College = require('../models/College');
  const sendEmail = require('./sendEmail');
  const { emailWrapper } = require('./emailTemplates');
  const colleges = await College.find({ isActive: true, principalEmail: { $exists: true, $ne: '' } });
  const cutoff = Date.now() - MONTHLY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  let sent = 0;
  for (const college of colleges) {
    if (college.principalReportLastSentAt && college.principalReportLastSentAt.getTime() > cutoff) continue;
    try {
      const r = await sendPrincipalSummary(college, { sendEmailFn: sendEmail, wrap: emailWrapper });
      if (r.sent) { college.principalReportLastSentAt = new Date(); await college.save(); sent++; }
    } catch (err) { console.error('[Cron] Principal report failed for', college.name, err.message); }
  }
  return { sent };
};

// ── 4. One-page placement summary ────────────────────────────────────────
const buildOnePageLines = (college, stats, date = new Date()) => ({
  title: 'Placement Summary',
  college: college.name,
  dated: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
  figures: [
    ['Students', stats.totalStudents],
    ['Placed', stats.placed],
    ['Success rate', `${stats.successRate}%`],
    ['Campus drives', stats.driveCount],
    ['Offers recorded', stats.offerCount],
    ['Average package (LPA)', stats.averageLPA || 0],
    ['Highest package (LPA)', stats.highestLPA || 0],
  ],
  departments: (stats.departments || []).slice(0, 12).map((d) => [d.name, d.count]),
});

const generateOnePagePdf = (college, stats) => new Promise((resolve, reject) => {
  const PDFDocument = require('pdfkit');
  const L = buildOnePageLines(college, stats);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#0f172a').text(L.title, { align: 'center' });
  doc.fontSize(13).font('Helvetica').fillColor('#475569').text(L.college, { align: 'center' });
  doc.fontSize(9).text(`As on ${L.dated}`, { align: 'center' });
  doc.moveDown(1.5);
  L.figures.forEach(([k, v]) => { doc.fontSize(12).fillColor('#1e293b').font('Helvetica').text(`${k}: `, { continued: true }).font('Helvetica-Bold').text(String(v)); });
  if (L.departments.length) {
    doc.moveDown(1).font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('Students by department');
    L.departments.forEach(([k, v]) => doc.font('Helvetica').fontSize(11).fillColor('#1e293b').text(`${k}: ${v}`));
  }
  doc.moveDown(2).fontSize(8).fillColor('#94a3b8').text('Generated by Velaivaaipu', { align: 'center' });
  doc.end();
});

// ── 6. Locked features / what you get ────────────────────────────────────
const TIER_PLAN_NAMES = { campus_free: 'Campus Free', campus_lite: 'Campus Lite', campus_pro: 'Campus Pro', campus_elite: 'Campus Elite' };

// plans: Subscription docs/objects for role college. Read-only: prices are taken as stored.
const summarizeFeatures = (plans, tier) => {
  const sorted = [...plans].sort((a, b) => (a.price || 0) - (b.price || 0));
  const current = sorted.find((p) => p.name === TIER_PLAN_NAMES[tier]) || sorted[0];
  if (!current) return { currentPlan: null, features: [], lockedCount: 0 };
  const features = (current.features || []).map((f) => {
    const locked = !f.isActive || f.value === false;
    let unlockedBy = null;
    if (locked) {
      const p = sorted.find((pl) => (pl.price || 0) > (current.price || 0) && (pl.features || []).some((x) => x.name === f.name && x.isActive && x.value !== false));
      if (p) unlockedBy = { plan: p.name, price: p.price, currency: p.currency || 'INR', duration: p.duration };
    }
    return { name: f.name, locked, value: f.value, unlockedBy };
  });
  return {
    currentPlan: { name: current.name, price: current.price, currency: current.currency || 'INR', duration: current.duration },
    features,
    lockedCount: features.filter((f) => f.locked).length,
  };
};

module.exports = {
  cgpaToPercentage, academicCutoffReason, sanitizeEligibility,
  computeMilestones, MILESTONE_STUDENT_TARGET, computeCollegeStats,
  isPrincipalReportEnabled, isValidEmail, buildPrincipalSummaryEmail, sendPrincipalSummary, runMonthlyPrincipalReports,
  buildOnePageLines, generateOnePagePdf, summarizeFeatures, TIER_PLAN_NAMES,
};
