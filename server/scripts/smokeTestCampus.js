const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/jobportal');
  const db = mongoose.connection.db;

  const College = require('../models/College');
  const CampusDrive = require('../models/CampusDrive');
  const User = require('../models/User');
  const Role = require('../models/Role');

  // 1. Ensure a college TPO user exists
  const collegeRole = await Role.findOne({ name: 'college' });
  let tpoUser = await User.findOne({ email: 'pec_tpo@pec.edu' });
  if (!tpoUser) {
    tpoUser = await User.create({
      name: 'Dr. Placement Officer',
      email: 'pec_tpo@pec.edu',
      password: 'Password@123',
      role: collegeRole._id,
      isVerified: true
    });
  }

  // 2. Ensure verified college
  await db.collection('colleges').deleteMany({ code: 'PEC' });
  await db.collection('campusdrives').deleteMany({ driveCode: 'pec2026' });

  const college = await College.create({
    name: 'Pondicherry Engineering College',
    code: 'PEC',
    location: 'Puducherry',
    verificationStatus: 'verified',
    tpoUser: tpoUser._id,
    studentLimit: 500,
    subscriptionTier: 'campus_lite',
    departments: [{ name: 'Computer Science', code: 'CSE' }]
  });

  // 3. Ensure active campus drive
  const drive = await CampusDrive.create({
    title: 'PEC Mega Campus Drive 2026',
    driveCode: 'pec2026',
    college: college._id,
    batchYear: 2026,
    departments: ['Computer Science'],
    isActive: true,
    status: 'active',
    createdBy: tpoUser._id
  });

  console.log('College created:', college.name, 'DriveCode:', drive.driveCode);

  // 4. Register student with ONLY name and WhatsApp (no email)
  const regRes = await fetch(`http://localhost:5000/api/college/public/drive/${drive.driveCode}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Anitha Raman',
      whatsapp: '9840123456',
      department: 'Computer Science',
      source: 'qr',
      whatsappConsent: true
    })
  });
  const regData = await regRes.json();
  console.log('Student QR Join status:', regRes.status, 'StudentId:', regData.studentId);
  const studentId = regData.studentId;
  if (!studentId) {
    console.error('Registration failed:', regData);
    process.exit(1);
  }

  // 5. Fetch assessment questions for ms-excel
  const testRes = await fetch(`http://localhost:5000/api/college/public/assessment?category=ms-excel&studentId=${studentId}`);
  const testData = await testRes.json();
  console.log('Fetch test status:', testRes.status, 'Questions count:', testData.questions?.length, 'Has attemptToken:', !!testData.attemptToken);

  // Check that questions do NOT leak answers or explanations
  const leakedAnswer = JSON.stringify(testData.questions).includes('correct_option');
  console.log('Are answers hidden in client payload?', !leakedAnswer);

  // 6. Look up the question set from attemptToken claims to score 9/10
  const decoded = jwt.decode(testData.attemptToken);
  const CampusQuestionSet = require('../models/CampusQuestionSet');
  const questionSet = await CampusQuestionSet.findById(decoded.set);
  
  // Wait 21 seconds to satisfy MIN_SECONDS_PER_QUESTION (10 questions * 2s = 20s minimum)
  console.log('Simulating student answering questions (waiting 21s)...');
  await new Promise(r => setTimeout(r, 21000));

  const answers = {};
  questionSet.questions.forEach((q, idx) => {
    // Answer correctly for 9 questions
    answers[q.id] = idx === 0 ? (q.correct_option === 'a' ? 'b' : 'a') : q.correct_option;
  });

  const submitRes = await fetch('http://localhost:5000/api/college/public/submit-assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId,
      category: 'ms-excel',
      attemptToken: testData.attemptToken,
      answers
    })
  });
  const submitData = await submitRes.json();
  console.log('Submit test status:', submitRes.status);
  console.log('Passed:', submitData.passed, 'Score:', `${submitData.score}/${submitData.total}`);
  console.log('Certificate Code:', submitData.certificateDetails?.code);
  console.log('Certificate URL:', submitData.certificateDetails?.certificateUrl);

  // Verify certificate file on disk
  if (submitData.certificateDetails?.certificateUrl) {
    const certPath = path.join(__dirname, '..', submitData.certificateDetails.certificateUrl);
    const exists = fs.existsSync(certPath);
    const size = exists ? fs.statSync(certPath).size : 0;
    console.log('Certificate PDF file exists on server disk?', exists, `(${size} bytes)`);
  }

  await mongoose.disconnect();
})().catch(console.error);
