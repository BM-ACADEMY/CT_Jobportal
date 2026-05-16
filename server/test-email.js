require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('--- SMTP Diagnostic Tool ---');
console.log(`Host: ${process.env.EMAIL_HOST}`);
console.log(`Port: ${process.env.EMAIL_PORT} (${typeof process.env.EMAIL_PORT})`);
console.log(`User: ${process.env.USER_EMAIL}`);
console.log(`Pass: ${process.env.USER_PASS ? '********' : 'NOT SET'}`);
console.log('---------------------------');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
  tls: {
    rejectUnauthorized: false // Helps with some hosting providers
  }
});

async function testConnection() {
  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Success: Connection established and authenticated!');
    
    console.log(`Sending test email to ${process.env.USER_EMAIL}...`);
    await transporter.sendMail({
      from: `"Diagnostic Tool" <${process.env.USER_EMAIL}>`,
      to: process.env.USER_EMAIL,
      subject: 'SMTP Diagnostic Test',
      text: 'If you see this, your SMTP configuration is working perfectly!',
    });
    console.log('✅ Success: Test email sent!');
  } catch (error) {
    console.error('❌ Error Details:');
    console.error(error);
    
    if (error.code === 'EAUTH') {
      console.error('\nTIP: Authentication failed. Please double check the USER_PASS in .env.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\nTIP: Connection refused. Check if the port and host are correct.');
    } else if (error.code === 'ESOCKET') {
      console.error('\nTIP: Socket error. This could be a SSL/TLS version mismatch.');
    }
  }
}

testConnection();
