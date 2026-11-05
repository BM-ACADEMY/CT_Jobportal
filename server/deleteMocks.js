require('dotenv').config({ path: __dirname + '/.env' });
if (!process.env.MONGODB_URI) { console.error('MONGODB_URI is not set'); process.exit(1); }
const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { const Assessment = mongoose.model('Assessment', new mongoose.Schema({}, { strict: false })); Assessment.deleteMany({ 'questions.question': { $regex: /Mock/i } }).then(res => { console.log('Deleted mock assessments:', res.deletedCount); process.exit(0); }).catch(err => { console.error(err); process.exit(1); }) })
