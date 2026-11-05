require('dotenv').config({ path: __dirname + '/.env' });
if (!process.env.MONGODB_URI) { console.error('MONGODB_URI is not set'); process.exit(1); }
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => { 
  const User = require('./models/User'); 
  const u = await User.updateOne({ name: /Mano/i }, { $push: { purchasedFeatures: { featureKey: 'hasPriorityBadge', isActive: true, usageLeft: 10 } } }); 
  console.log('Done', u); 
  process.exit(0); 
}).catch(e => { 
  console.error(e); 
  process.exit(1); 
});
