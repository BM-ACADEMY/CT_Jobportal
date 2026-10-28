const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Accounts created on a student's behalf (CSV import, QR join) never get a password anyone could guess, such as the
// phone number or roll number. The student claims the account with the email OTP / forgot-password flow.
const randomPasswordHash = async () => bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

module.exports = { randomPasswordHash };
