const mongoose = require('mongoose');
const PayPerFeature = require('../models/PayPerFeature');
require('dotenv').config({ path: __dirname + '/../.env' });

const migrateRoles = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal';
    await mongoose.connect(MONGODB_URI);
    
    // Bypass schema validation for the raw update to remove old field
    const db = mongoose.connection.db;
    const collection = db.collection('payperfeatures');
    
    const docs = await collection.find({ role: { $exists: true } }).toArray();
    for (const doc of docs) {
      const roles = Array.isArray(doc.roles) ? doc.roles : [doc.role];
      await collection.updateOne(
        { _id: doc._id },
        { 
          $set: { roles },
          $unset: { role: "" }
        }
      );
    }
    
    console.log(`Migrated ${docs.length} pay-per features to use roles array.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrateRoles();
