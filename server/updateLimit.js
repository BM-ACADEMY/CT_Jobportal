require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Subscription = require('./models/Subscription');
  await Subscription.updateOne({ name: 'Free', role: 'company' }, { $set: { activeJobPostings: 3 } });
  console.log('Updated company Free plan to 3');
  process.exit(0);
}).catch(console.error);
