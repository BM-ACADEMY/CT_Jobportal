const mongoose = require('mongoose');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/jobportal');
  const db = mongoose.connection.db;

  // 1. Create company role and user
  let companyUser = await db.collection('users').findOne({ email: 'smoke_test_company@test.com' });
  if (!companyUser) {
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke Test Employer',
        email: 'smoke_test_company@test.com',
        password: 'Password@123',
        role: 'company',
        phone: '9876500000'
      })
    });
    console.log('Company registered:', regRes.status);
    companyUser = await db.collection('users').findOne({ email: 'smoke_test_company@test.com' });
    await fetch('http://localhost:5000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'smoke_test_company@test.com', otp: companyUser.otp })
    });
  }

  // Get company token
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'smoke_test_company@test.com', password: 'Password@123' })
  });
  const loginData = await loginRes.json();
  const companyToken = loginData.token;
  console.log('Company login:', !!companyToken);

  // Link company profile if needed
  let companyDoc = await db.collection('companies').findOne({ user: companyUser._id });
  if (!companyDoc) {
    const ins = await db.collection('companies').insertOne({
      user: companyUser._id,
      companyName: 'Velaivaaipu Tech Ltd',
      location: 'Puducherry',
      industry: 'Technology',
      website: 'https://velaivaaipu.in',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await db.collection('users').updateOne({ _id: companyUser._id }, { $set: { company: ins.insertedId } });
    companyDoc = { _id: ins.insertedId, companyName: 'Velaivaaipu Tech Ltd' };
  }

  // 2. Post a job
  const jobPayload = {
    title: 'Senior Frontend Developer',
    description: 'Looking for an experienced React developer in Puducherry to build cutting-edge web applications.',
    location: 'Puducherry',
    workplaceType: 'On-site',
    employmentType: 'Full-time',
    salaryMin: 600000,
    salaryMax: 900000,
    skills: ['React', 'JavaScript', 'CSS'],
    experience: '2-4 years',
    companyName: 'Velaivaaipu Tech Ltd'
  };

  const postJobRes = await fetch('http://localhost:5000/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${companyToken}`
    },
    body: JSON.stringify(jobPayload)
  });
  const jobData = await postJobRes.json();
  console.log('Post job status:', postJobRes.status, 'Job ID:', jobData.job?._id || jobData._id);
  const jobId = jobData.job?._id || jobData._id;

  // 3. Open public job URL
  const publicRes = await fetch(`http://localhost:5000/api/jobs/${jobId}`);
  const publicData = await publicRes.json();
  console.log('Public job fetch status:', publicRes.status, 'Title:', publicData.title, 'Status:', publicData.status);

  // Client URL format check
  const slug = `senior-frontend-developer-puducherry-${jobId}`;
  const clientJobRes = await fetch(`http://localhost:5173/job/${slug}`);
  console.log('Client public job URL status (200):', clientJobRes.status);

  // 4. Jobseeker login & apply
  const seekerLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'smoke_test_seeker@test.com', password: 'NewPassword@123' })
  });
  const seekerData = await seekerLogin.json();
  const seekerToken = seekerData.token;
  console.log('Seeker login:', !!seekerToken);

  const applyRes = await fetch('http://localhost:5000/api/applications/apply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${seekerToken}`
    },
    body: JSON.stringify({
      jobId: jobId,
      answers: [{ questionText: 'Why do you want to join?', answer: 'Excited about Velaivaaipu!' }]
    })
  });
  const applyData = await applyRes.json();
  console.log('Apply status:', applyRes.status, 'Application message:', applyData.msg || applyData.message);

  // 5. Close the job and verify status
  const closeRes = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${companyToken}`
    },
    body: JSON.stringify({ status: 'closed' })
  });
  console.log('Close job status:', closeRes.status);

  const closedFetch = await fetch(`http://localhost:5000/api/jobs/${jobId}`);
  const closedData = await closedFetch.json();
  console.log('Closed job fetch status:', closedFetch.status, 'Job status in DB:', closedData.status);

  await mongoose.disconnect();
})().catch(console.error);
