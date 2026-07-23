const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const College = require('../models/College');
require('dotenv').config();

const createCollege = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const collegeRole = await Role.findOne({ name: 'college' });
    if (!collegeRole) {
      console.log('College role not found, ensure db is seeded');
      process.exit(1);
    }

    const email = 'admin@demo-college.com';
    const password = 'Password@123';

    let user = await User.findOne({ email });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        name: 'Demo College TPO',
        email,
        password: hashedPassword,
        role: collegeRole._id,
        isVerified: true
      });
      await user.save();
      console.log('User created');
    }

    let college = await College.findOne({ tpoUser: user._id });
    if (!college) {
      const generateDisplayId = require('../utils/generateDisplayId');
      const year = new Date().getFullYear();
      const displayId = await generateDisplayId('VG', year);

      college = new College({
        name: 'Demo Institute of Technology',
        code: `DEMO-${Date.now().toString().slice(-4)}`,
        tpoUser: user._id,
        principalName: 'Dr. John Doe',
        principalEmail: 'principal@demo-college.com',
        departments: [
          { name: 'Computer Science', code: 'CS' },
          { name: 'Information Technology', code: 'IT' }
        ],
        subscriptionTier: 'campus_pro',
        isActive: true,
        display_id: displayId
      });
      await college.save();
      console.log('College created');
    }

    console.log('\n--- Credentials ---');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('-------------------\n');
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createCollege();
