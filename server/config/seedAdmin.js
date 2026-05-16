const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const defaultAdmin = new Admin({
        name: 'Super Admin',
        email: 'admin@ct.com',
        password: hashedPassword,
        role: 'admin'
      });

      await defaultAdmin.save();
      console.log('✅ Default admin seeded: admin@ct.com / admin123');
    } else {
      console.log('⚡ Admin account already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  }
};

module.exports = seedAdmin;
