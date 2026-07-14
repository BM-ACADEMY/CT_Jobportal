require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const email = 'newadmin@example.com';
    const password = 'AdminPassword123!';
    
    // Check if exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      console.log('Admin already exists with email', email);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    admin = new Admin({
      name: 'Super Admin',
      email: email,
      password: hashedPassword,
      role: 'admin',
      adminRoleType: 'Root Super Admin',
      accountStatus: 'Active'
    });

    await admin.save();
    console.log(`Admin created successfully! \nEmail: ${email} \nPassword: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
