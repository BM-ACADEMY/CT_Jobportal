const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
const Job = require('./models/Job');
const Subscription = require('./models/Subscription');
require('dotenv').config({ path: './.env' });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const rawUser = await db.collection('users').findOne({ name: /snega/i });
  const user = await User.findById(rawUser._id).populate('subscription').populate('role');
  const userId = user._id.toString();

  console.log('User:', user.name);
  console.log('Company:', user.company?.toString());

  // NEW quota query: company + recruiter + status
  const activeCountQuery = { company: user.company, status: { $in: ['active', 'closed'] } };
  if (user.role && user.role.name === 'recruiter') {
    activeCountQuery.recruiter = user._id;
  }
  
  const used = await Job.countDocuments(activeCountQuery);
  console.log('\nNew quota count (company + recruiter + active/closed):', used);
  
  const jobs = await Job.find(activeCountQuery).select('title status company');
  jobs.forEach(j => console.log(`  "${j.title}" status=${j.status} company=${j.company}`));
  
  console.log('\nExpected: 0 (old job has different company, should NOT count)');

  process.exit();
}).catch(err => { console.error(err); process.exit(1); });
