const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
require('dotenv').config();

const createAdmin = async (name, email, password) => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.log('❌ Admin with this email already exists');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'admin'
    });

    await newAdmin.save();
    console.log(`✅ Admin created successfully: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

// Check for arguments
const [,, name, email, password] = process.argv;

if (!name || !email || !password) {
  console.log('Usage: node scripts/create-admin.js "Admin Name" "admin@example.com" "password123"');
  process.exit(1);
}

createAdmin(name, email, password);
