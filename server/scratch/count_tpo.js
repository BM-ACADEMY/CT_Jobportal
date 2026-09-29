require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await User.countDocuments({
      'collegeProfile.designation': { $regex: /tpo/i }
    });
    const roleCount = await User.countDocuments({
        // wait we need role name as college, let's just populate or just use collegeProfile
        'collegeProfile': { $exists: true }
    });
    const tpoDesignationCount = await User.countDocuments({ 'collegeProfile.designation': 'TPO' });
    
    const tpos = await User.find({ 'collegeProfile.designation': 'TPO' })
      .select('name email display_id collegeProfile isVerified createdAt')
      .populate('collegeProfile.college', 'name location')
      .lean();
    
    console.log(JSON.stringify(tpos, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
