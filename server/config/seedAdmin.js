const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

// Creates the first admin only when ADMIN_EMAIL and ADMIN_PASSWORD are provided in the environment.
// There is intentionally no built-in default account/password.
const seedAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) return;

    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || '';
    if (!email || password.length < 12) {
      console.warn('No admin exists. Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) to create the first admin.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await new Admin({ name: 'Super Admin', email, password: hashedPassword, role: 'admin' }).save();
    console.log(`First admin created for ${email}. Remove ADMIN_PASSWORD from the environment now.`);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
