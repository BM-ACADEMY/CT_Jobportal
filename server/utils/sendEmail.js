const nodemailer = require('nodemailer');

// Certificate checking is ON. SMTP_TLS_INSECURE=true is an emergency switch for a relay whose certificate
// cannot be verified; do not leave it set in production.
// A slow or restarting mail server must fail fast. Without these limits a signup or Resend request waits for
// minutes, people tap Resend again, and the server piles up requests. Override with SMTP_*_TIMEOUT_MS if needed.
const buildTimeouts = (env = process.env) => ({
  connectionTimeout: Number(env.SMTP_CONNECT_TIMEOUT_MS) || 8000,
  greetingTimeout: Number(env.SMTP_GREETING_TIMEOUT_MS) || 8000,
  socketTimeout: Number(env.SMTP_SOCKET_TIMEOUT_MS) || 15000,
});

const buildTransportConfig = (env = process.env) => {
  const isGmail = (env.EMAIL_HOST || "").includes('gmail.com');
  if (isGmail) {
    return {
      service: 'gmail',
      logger: true,
      debug: true,
      auth: { user: env.USER_EMAIL, pass: env.USER_PASS },
      ...buildTimeouts(env),
    };
  }
  return {
    host: env.EMAIL_HOST || "smtp.hostinger.com",
    secure: env.EMAIL_PORT == 465,
    port: Number(env.EMAIL_PORT) || 465,
    auth: { user: env.USER_EMAIL, pass: env.USER_PASS },
    tls: { rejectUnauthorized: env.SMTP_TLS_INSECURE !== 'true' },
    ...buildTimeouts(env),
  };
};

// Retry only when the mail never left (could not connect). After the server has accepted the message a retry could
// send it twice, so socket timeouts and rejections are not retried.
const isConnectionFailure = (err) => {
  if (!err) return false;
  if (['ECONNECTION', 'ECONNREFUSED', 'ENOTFOUND', 'EDNS'].includes(err.code)) return true;
  return err.code === 'ETIMEDOUT' && err.command === 'CONN';
};

const transporter = nodemailer.createTransport(buildTransportConfig());

const sendEmail = async (options) => {
  // Students who joined with only a WhatsApp number get a placeholder <phone>@<college>.portal address; never mail it
  // (bounces hurt sender reputation).
  if (/\.portal\s*$/i.test(String(options.email || ''))) return false;
  try {
    const mailOptions = {
      // MAIL_FROM lets the visible sender (e.g. hello@velaivaaipu.in) differ from the SMTP login, which is
      // required by relay services such as Amazon SES or Brevo whose login is not an email address.
      from: options.from || process.env.MAIL_FROM || `"Velaivaaipu" <${process.env.USER_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };
    const replyTo = options.replyTo || process.env.MAIL_REPLY_TO;
    if (replyTo) mailOptions.replyTo = replyTo;
    if (options.headers) mailOptions.headers = options.headers;

    let info;
    try {
      info = await transporter.sendMail(mailOptions);
    } catch (first) {
      if (!isConnectionFailure(first)) throw first;
      console.error('Mail connection failed (%s), trying once more', first.code);
      info = await transporter.sendMail(mailOptions);
    }
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('\n\n=== [SMTP ERROR] FAILED TO SEND EMAIL ===');
    console.error(`Attempted to send to: ${options.email}`);
    console.error('Error Code:', error.code);
    console.error('SMTP Response:', error.response);
    console.error('Error Details:', error.message);
    console.error('=========================================\n\n');
    return false;
  }
};

module.exports = sendEmail;
module.exports.buildTransportConfig = buildTransportConfig;
module.exports.isConnectionFailure = isConnectionFailure;
