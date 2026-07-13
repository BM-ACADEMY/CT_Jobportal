const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const check = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal';
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOne({ email: 'mano@gmail.com' });
  console.log('User:', JSON.stringify(user, null, 2));
  process.exit(0);
};
check();
