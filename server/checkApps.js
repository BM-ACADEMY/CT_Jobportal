const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
require('dotenv').config();

const check = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal';
  await mongoose.connect(MONGODB_URI);
  const apps = await Application.find()
    .populate('applicant', 'name email profile')
    .limit(5);

  for (const app of apps) {
    console.log(`App ID: ${app._id}`);
    console.log(`Applicant Name: ${app.applicant?.name}`);
    console.log(`Applicant Profile:`, JSON.stringify(app.applicant?.profile, null, 2));
  }
  process.exit(0);
};
check();
