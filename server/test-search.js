require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/Role');
const User = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const users = await User.find({ role: { $exists: true } }).populate('role');
  
  const seekers = users.filter(u => u.role && u.role.name === 'jobseeker');
  
  console.log('Total jobseekers:', seekers.length);
  
  seekers.forEach(s => {
    console.log(`\nName: ${s.name}`);
    console.log(`Location: ${s.profile?.location}`);
    console.log(`Qualifications:`, JSON.stringify(s.profile?.qualification));
  });
  
  process.exit(0);
}
run();
