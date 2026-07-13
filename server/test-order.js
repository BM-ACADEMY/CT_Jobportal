const razorpay = require('./config/razorpay');
razorpay.orders.create({ amount: 100, currency: 'INR', receipt: 'test_' + Date.now() })
  .then(order => {
    console.log('SUCCESS:', order);
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err);
    process.exit(1);
  });
