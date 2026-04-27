const mongoose = require('mongoose');
const URI = 'mongodb://127.0.0.1:27017/jobportal';

console.log('Attempting to connect to:', URI);
mongoose.connect(URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('Successfully connected to MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
    process.exit(1);
  });
