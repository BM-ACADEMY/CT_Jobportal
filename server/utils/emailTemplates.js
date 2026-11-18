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

const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// One look for every one-time-code mail (sign-up, resend, unverified login, password reset): brand header,
// the code big and easy to copy, how long it lasts, and a plain safety line. Name and text are escaped.
const otpEmail = ({ title, intro, name, otp, minutes = 10, safety = "If you didn't ask for this, you can safely ignore this email. Never share this code with anyone." }) => `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
  <div style="background: #0f172a; padding: 18px 24px; border-radius: 12px 12px 0 0;">
    <span style="color: #10b981; font-weight: 900; font-size: 20px; letter-spacing: -0.02em;">Velaivaaipu</span>
  </div>
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; padding: 28px 24px; text-align: center;">
    <h2 style="margin: 0 0 14px; color: #0f172a; font-size: 20px;">${esc(title)}</h2>
    <p style="margin: 0 0 6px; font-size: 15px; text-align: left;">Hi ${esc(name || 'there')},</p>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.5; text-align: left;">${esc(intro)}</p>
    <div style="margin: 0 auto 8px; padding: 16px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #065f46; font-family: 'Courier New', monospace;">${esc(otp)}</div>
    <p style="margin: 0 0 22px; font-size: 13px; color: #475569;">This code is valid for ${esc(minutes)} minutes.</p>
    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b; text-align: left;">${esc(safety)}</p>
  </div>
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 14px;">
    Velaivaaipu &middot; velaivaaipu.in &middot; Need help? Reply to this email and our team will get back to you.
  </p>
</div>`;

module.exports = { emailWrapper, otpEmail };
