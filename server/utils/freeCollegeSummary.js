// A short monthly email for colleges on the free plan: three numbers and one next step. No AI, no PDF, no cost per send.
// Paid plans keep their full PDF report (weekly for Pro and Elite, monthly for Lite).
const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const { reportRecipients } = require('./reportEmail');

const monthOf = (now = new Date()) => new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 7); // India time
const keyFor = (collegeId, now) => `fcs:${collegeId}:${monthOf(now)}`;
const enabled = (env = process.env) => String(env.FREE_COLLEGE_SUMMARY || '').toLowerCase() !== 'off';

// Colleges that should get this month's summary: free plan, verified, active, an email to send to, not sent this month yet.
const pickDue = ({ colleges, sentKeys = new Set(), now = new Date() }) =>
  colleges.filter((c) => c && c.isActive !== false && c.verificationStatus === 'verified' && (!c.subscriptionTier || c.subscriptionTier === 'campus_free')
    && reportRecipients(c).length > 0 && !sentKeys.has(keyFor(c._id, now)));

const nextStep = ({ joined, drives }) => {
  if (!joined) return 'No new students joined this month. Put the QR code on the notice board or upload your student list, and they can start in minutes.';
  if (!drives) return 'You have students but no drive this month. Create a drive and invite a company.';
  return 'Keep going: add the placement result for each student so your numbers stay complete.';
};

const summaryHtml = ({ college, stats, frontendUrl, emailWrapper }) => {
  const row = (label, value) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;">${esc(value)}</td></tr>`;
  return emailWrapper(`${esc(college.name)}: your month on Velaivaaipu`, `
    <p>Dear ${esc(college.principalName || 'Placement Officer')},</p>
    <p>Here is a short summary for <strong>${esc(college.name)}</strong>.</p>
    <table style="border-collapse:collapse;width:100%;max-width:420px;font-size:14px;">
      ${row('Students who joined in the last 30 days', stats.joined)}
      ${row('Drives created in the last 30 days', stats.drives)}
      ${row('Students placed so far', stats.placed)}
    </table>
    <p>${esc(nextStep(stats))}</p>
    <p style="font-size:13px;color:#475569;">The paid plans also send a full PDF report with department-wise numbers to your principal automatically. <a href="${esc(frontendUrl)}/college/subscription" style="color:#059669;">See the plans</a>.</p>
  `);
};

module.exports = { monthOf, keyFor, enabled, pickDue, nextStep, summaryHtml };
