const mongoose = require('mongoose');

mongoose.connect('mongodb://admin:Bmtechx%402025@82.25.85.114:27017/jobportal?authSource=admin').then(async () => { 
  const User = require('./models/User'); 
  const u = await User.updateOne({ name: /Mano/i }, { $push: { purchasedFeatures: { featureKey: 'hasPriorityBadge', isActive: true, usageLeft: 10 } } }); 
  console.log('Done', u); 
  process.exit(0); 
}).catch(e => { 
  console.error(e); 
  process.exit(1); 
});
