// Shared HTML wrapper for transactional/notification emails — keeps every notification
// email consistently branded instead of each controller inlining its own layout.
const emailWrapper = (title, bodyHtml) => `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #0f172a; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <span style="color: #10b981; font-weight: 900; font-size: 18px; letter-spacing: -0.02em;">Velaivaaipu</span>
  </div>
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
    <h2 style="margin-top: 0; color: #0f172a; font-size: 18px;">${title}</h2>
    ${bodyHtml}
  </div>
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
    This is an automated notification from Velaivaaipu Job Portal. Please do not reply to this email.
  </p>
</div>`;

module.exports = { emailWrapper };
