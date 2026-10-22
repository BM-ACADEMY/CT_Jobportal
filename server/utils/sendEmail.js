const nodemailer = require('nodemailer');

const isGmail = (process.env.EMAIL_HOST || "").includes('gmail.com');

const transporter = nodemailer.createTransport(
  isGmail 
    ? {
        service: 'gmail',
        logger: true,
        debug: true,
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASS,
        }
      }
    : {
        host: process.env.EMAIL_HOST || "smtp.hostinger.com",
        secure: process.env.EMAIL_PORT == 465,
        port: Number(process.env.EMAIL_PORT) || 465,
        auth: {
          user: process.env.USER_EMAIL,
          pass: process.env.USER_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      }
);

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

    const info = await transporter.sendMail(mailOptions);
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
