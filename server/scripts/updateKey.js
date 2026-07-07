const mongoose = require('mongoose');
const PayPerFeature = require('../models/PayPerFeature');
require('dotenv').config({ path: __dirname + '/../.env' });

const updateKeys = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal';
    await mongoose.connect(MONGODB_URI);
    
    await PayPerFeature.updateMany(
      { featureKey: 'hasSkillGapAnalysis' },
      { $set: { featureKey: 'hasJobMatchAnalysis' } }
    );
    
    console.log('Updated featureKey in database');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateKeys();
