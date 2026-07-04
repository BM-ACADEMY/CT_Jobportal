require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');
const Job = require('./models/Job');
const Application = require('./models/Application');
const Role = require('./models/Role'); // Need to load it for User pre-save hook

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/naukri_clone');
    console.log('Connected to MongoDB.');

    const query = { $or: [{ display_id: { $exists: false } }, { display_id: null }, { display_id: '' }] };
    
    // Users
    const users = await User.find(query);
    console.log(`Found ${users.length} users missing display_id. Migrating...`);
    for (const user of users) {
      await user.save({ validateBeforeSave: false }); // Trigger pre-save hook
    }

    // Companies
    const companies = await Company.find(query);
    console.log(`Found ${companies.length} companies missing display_id. Migrating...`);
    for (const company of companies) {
      await company.save({ validateBeforeSave: false });
    }

    // Jobs
    const jobs = await Job.find(query);
    console.log(`Found ${jobs.length} jobs missing display_id. Migrating...`);
    for (const job of jobs) {
      await job.save({ validateBeforeSave: false });
    }

    // Applications
    const applications = await Application.find(query);
    console.log(`Found ${applications.length} applications missing display_id. Migrating...`);
    for (const app of applications) {
      await app.save({ validateBeforeSave: false });
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
