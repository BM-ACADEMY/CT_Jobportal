const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: true,
  port: 465,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `"Naukri Clone" <${process.env.USER_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('\n\n=== [SMTP ERROR] FAILED TO SEND EMAIL ===');
    console.error(`Attempted to send to: ${options.email}`);
    console.error('Error Details:', error);
    console.error('=========================================\n\n');
    return false;
  }
};

module.exports = sendEmail;
