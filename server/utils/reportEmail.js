// Who gets a placement report, and the one-tap "send it again to the principal" rule.
const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const RESEND_GAP_MS = 5 * 60 * 1000;

const reportRecipients = (college) =>
  [...new Set([college.principalEmail, ...(college.additionalReportRecipients || [])].map((e) => String(e || '').trim().toLowerCase()).filter((e) => /^\S+@\S+\.\S+$/.test(e)))];

const reportHtml = ({ college, report, frontendUrl, emailWrapper }) => {
  const s = report.stats || {};
  return emailWrapper(`${esc(college.name)} Placement Report`, `
      <p>Dear ${esc(college.principalName || 'Principal')},</p>
      <p>The ${esc(report.frequency)} placement report for <strong>${esc(college.name)}</strong> is ready: <strong>${esc(s.placed)}/${esc(s.totalStudents)}</strong> students placed (${esc(s.successRate)}% success rate).</p>
      <p><a href="${esc(frontendUrl)}${esc(report.reportUrl)}" style="color:#059669;">Download the full report</a></p>
    `);
};

// Returns { ok:true, sentTo:[...] } or { ok:false, code, msg }.
const sendReportAgain = async ({ college, report, sendEmail, emailWrapper, frontendUrl, now = new Date() }) => {
  const to = reportRecipients(college);
  if (!to.length) return { ok: false, code: 400, msg: 'Add the principal’s email in College Settings first, then try again.' };
  if (report.sentAt && now - new Date(report.sentAt) < RESEND_GAP_MS) return { ok: false, code: 429, msg: 'This report was sent a moment ago. Please wait a few minutes before sending it again.' };
  const html = reportHtml({ college, report, frontendUrl, emailWrapper });
  const results = await Promise.allSettled(to.map((email) => sendEmail({ email, subject: `[Velaivaaipu] ${college.name} Placement Report — ${report.periodLabel}`, html })));
  const sentTo = to.filter((_, i) => results[i].status === 'fulfilled' && results[i].value !== false);
  if (!sentTo.length) return { ok: false, code: 502, msg: 'The email could not be sent right now. Please try again in a little while.' };
  return { ok: true, sentTo };
};

module.exports = { reportRecipients, reportHtml, sendReportAgain, RESEND_GAP_MS };
