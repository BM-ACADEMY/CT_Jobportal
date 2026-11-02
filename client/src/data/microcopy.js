// Friendly names and short taglines for the menus, plus a few fun messages.
// Names stay plain; the fun is in the tagline (shown on hover) and in empty/loading/success messages.
// Do NOT use fun text for payments, refunds, KYC rejections, test failures, security or legal messages.
export const ROLE_LABELS = {
  jobseeker: 'Student / Job seeker',
  recruiter: 'Recruiter',
  company: 'Company',
  org_employee: 'Team member',
  college: 'College placement cell',
  drive_incharge: 'Drive in-charge',
  subadmin: 'Admin',
  admin: 'Super Admin',
};

const ALL = {
  Dashboard: 'Your home base. Coffee optional.',
  'Help & Support': "Stuck? We've got your back.",
  Blog: 'Tips, stories and job-hunt know-how.',
};

const STUDENT = {
  'Find Jobs': 'Your next job is probably hiding here.',
  Companies: 'See who\'s hiring. Research, not stalking.',
  'My Applications': "Where 'Applied' turns into 'Hired'.",
  'Campus Drives': 'Your college. Their hiring. Your chance.',
  'Saved Jobs': "Your 'maybe later' list. Don't wait too long.",
  'My Plan': "What you've unlocked so far.",
  'Buy Extras': 'Power-ups for your job hunt.',
  'Payment History': 'Every rupee, neatly noted.',
  'Review Velaivaaipu': "Tell us how we're doing. We can take it.",
  'Resume Builder': "A resume that doesn't look like everyone else's.",
  'Job Alerts': 'We watch the jobs. You live your life.',
  'Skill Tests': 'Prove it. 10 questions, no pressure (okay, a little).',
  'Who Viewed Me': 'Someone looked at you. Go on, feel good.',
  'Career Counselling': 'Talk it out with someone who knows.',
  'Mock Interviews': 'Practise here so the real one feels easy.',
  'AI Resume Review': 'A second pair of AI eyes, minus the judgement.',
  Messages: 'Recruiters talk. This is where you listen.',
};

const COMPANY = {
  'My Jobs': 'All your open positions in one place.',
  'Post Job': 'Great hires start with a great post.',
  'Search Candidates': 'Find your next teammate.',
  'Hiring Pipeline': "From 'hello' to 'welcome aboard'.",
  'Hiring Reports': 'Numbers that make you look smart in meetings.',
  'Message Candidates': 'Say hi to many, politely.',
  Interviews: 'Schedule it, show up, hire.',
  'Campus Drives': 'Fresh talent, straight from campus.',
  'My Team': 'Your hiring crew.',
  'My Plan': "What's included in your plan.",
  'Payment History': 'Every rupee, neatly noted.',
  'Review Velaivaaipu': "Tell us how we're doing. We can take it.",
  Messages: 'Candidates reply here.',
};

const COLLEGE = {
  Students: 'Your whole batch, one list.',
  'Campus Drives': 'Bring the companies to campus.',
  'Student Verification': 'Check, approve, repeat.',
  'Placement Tools': "The placement cell's toolbox.",
  'Calendar & Employers': "Dates, drives and who's hiring.",
  Reports: 'Reports your principal will actually read.',
  'College Settings & Documents': 'Set it up once, then forget it.',
  'My Plan': "What's included in your plan.",
  'Payment History': 'Every rupee, neatly noted.',
  'Review Velaivaaipu': "Tell us how we're doing. We can take it.",
};

const ADMIN = {
  'Command Center': "Mission control. Please don't press red buttons.",
  Users: 'Everyone who signed up.',
  Jobs: 'Every job on the platform.',
  'College Verification': 'Gatekeeper duty.',
  Subscriptions: "Plans, renewals and who's paying.",
  Subscribers: "Who's paying, and for what.",
  Refunds: 'Handle with care (and a calculator).',
  'Support Tickets': "Today's chance to be a hero.",
  Reviews: 'Only real reviews get through.',
  Settings: 'The knobs and switches.',
  'Payment History': 'Every rupee, neatly noted.',
};

const BY_ROLE = {
  jobseeker: STUDENT, recruiter: COMPANY, company: COMPANY, org_employee: COMPANY,
  college: COLLEGE, drive_incharge: { 'My Drive': "Today's drive, in your hands." }, subadmin: ADMIN, admin: ADMIN,
};

export const taglineFor = (role, label) => BY_ROLE[role]?.[label] || ALL[label] || '';

// Fun text for places that are safe to be light-hearted. Other messages stay plain.
export const MESSAGES = {
  welcomeGreeting: (name) => `Vanakkam${name ? `, ${name}` : ''}! Let's set you up in 2 minutes.`,
  emptyApplications: 'Nothing here yet. Your first application is one click away.',
  emptySaved: 'Your saved list is lonely. Tap the star on a job you like.',
  emptyNotifications: 'All quiet. Enjoy it while it lasts.',
  emptyStudents: 'No students yet. Share the QR code and watch this page fill up.',
  loadingJobs: 'Hunting for jobs...',
  loadingTest: 'Sharpening pencils...',
  loadingAi: 'Asking the AI nicely...',
  appliedOk: 'Applied! Fingers crossed. We crossed ours too.',
  profileSaved: 'Profile saved. Looking sharp.',
  testPassed: 'Nailed it! Your skill badge is on its way.',
  testBelow: 'Good start. Here is a quick way to level up.',
  notFound: "This page took the day off. Let's get you back on track.",
  installPrompt: "Put Velaivaaipu on your home screen. It's faster, and it won't judge your browser tabs.",
};
