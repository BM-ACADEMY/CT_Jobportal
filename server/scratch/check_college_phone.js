require('dotenv').config();
const mongoose = require('mongoose');
const College = require('../models/College');
const User = require('../models/User');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const colleges = await College.find({ verificationStatus: 'verified' })
    .populate('tpoUser', 'name email phone')
    .select('name code collegePhone verificationStatus verifiedAt tpoUser')
    .sort({ verifiedAt: -1 })
    .limit(10);

  console.log(`Found ${colleges.length} verified college(s):\n`);
  colleges.forEach(c => {
    console.log(`- ${c.name} (${c.code})`);
    console.log(`    verifiedAt: ${c.verifiedAt}`);
    console.log(`    collegePhone: ${JSON.stringify(c.collegePhone)}`);
    console.log(`    tpoUser: ${c.tpoUser?.name} <${c.tpoUser?.email}> phone=${JSON.stringify(c.tpoUser?.phone)}`);
    console.log(`    -> WhatsApp would send to: ${c.tpoUser?.phone || c.collegePhone || 'NONE (send is skipped)'}`);
    console.log('');
  });

  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
