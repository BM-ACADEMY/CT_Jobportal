// Replaces the guessable password (phone number or roll number) on student accounts created by the old CSV import.
// DRY RUN BY DEFAULT: it only reports. Add --apply to change data.
//   cd server && node scripts/resetCsvStudentPasswords.js          (report)
//   cd server && node scripts/resetCsvStudentPasswords.js --apply  (reset)
// Who is touched: users linked to a CollegeStudent with registrationSource "csv" whose password still matches their
// phone number or roll number. Everyone else is left alone, so students who already changed it keep it.
// After the reset the student claims the account with "Forgot password" (OTP to their email). Students whose email is a
// generated ...@<college>.portal address cannot receive mail; they keep using the QR / test links without a login.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const CollegeStudent = require('../models/CollegeStudent');
const { randomPasswordHash } = require('../utils/studentPassword');

const APPLY = process.argv.includes('--apply');

(async () => {
  if (!process.env.MONGODB_URI) { console.error('MONGODB_URI is not set'); process.exit(1); }
  await mongoose.connect(process.env.MONGODB_URI);

  const students = await CollegeStudent.find({ registrationSource: 'csv' }).select('user phone rollNumber').lean();
  console.log(`CSV-imported student records: ${students.length}`);
  let weak = 0;
  let reset = 0;
  for (const s of students) {
    const user = await User.findById(s.user).select('+password email profile.phone');
    if (!user || !user.password) continue;
    const guesses = [s.phone, s.rollNumber, user.profile?.phone].filter(Boolean);
    let matched = false;
    for (const g of new Set(guesses)) {
      if (await bcrypt.compare(String(g), user.password)) { matched = true; break; }
    }
    if (!matched) continue;
    weak += 1;
    if (APPLY) {
      await User.updateOne({ _id: user._id }, { $set: { password: await randomPasswordHash() } });
      reset += 1;
    }
  }
  console.log(`Accounts still using phone/roll number as password: ${weak}`);
  console.log(APPLY ? `Passwords reset: ${reset}` : 'Dry run: nothing changed. Re-run with --apply to reset them.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
