require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  require('./models/Subscription');
  const User = require('./models/User');
  const Job = require('./models/Job');
  const {enforceJobLimits} = require('./utils/enforceJobLimits');
  
  const u = await User.findOne({name: 'Ragu'}).populate('role').populate('subscription');
  console.log('user', u._id, 'company', u.company, 'role', u.role?.name);
  
  await enforceJobLimits(u, u._id);
  
  const activeCountAfter = await Job.countDocuments({ 
    $or: [{ company: u.company }, { recruiter: u._id }], 
    status: 'active' 
  });
  console.log('Active jobs after:', activeCountAfter);
  
  process.exit(0);
}).catch(console.error);
