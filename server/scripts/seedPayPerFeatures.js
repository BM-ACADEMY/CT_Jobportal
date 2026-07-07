const mongoose = require('mongoose');
const PayPerFeature = require('../models/PayPerFeature');
require('dotenv').config({ path: __dirname + '/../.env' });

const seedFeatures = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await PayPerFeature.deleteMany({});
    console.log('Cleared existing pay-per features');

    const features = [
      // Jobseeker
      { name: 'Profile Boost', featureKey: 'hasProfileBoost', role: 'jobseeker', cost: 149, days: 7, usageCount: 1, description: 'Boost your profile visibility for 1 week (7 Days).' },
      { name: 'AI Resume Review', featureKey: 'hasAiResumeReview', role: 'jobseeker', cost: 99, days: 30, usageCount: 1, description: 'Get 1 full AI report on your resume.' },
      { name: 'Real-time Job Alerts', featureKey: 'jobAlerts', role: 'jobseeker', cost: 49, days: 30, usageCount: 0, description: 'Unlimited real-time job alerts for 30 days.' },
      { name: 'Message Recruiters', featureKey: 'hasMessageRecruiters', role: 'jobseeker', cost: 199, days: 30, usageCount: 5, description: 'Pack of 5 InMails to contact recruiters directly.' },
      { name: 'Salary Benchmarking', featureKey: 'hasSalaryBenchmarking', role: 'jobseeker', cost: 149, days: 30, usageCount: 1, description: 'Get 1 detailed salary benchmarking report.' },
      { name: 'Skill Gap Analysis', featureKey: 'hasSkillGapAnalysis', role: 'jobseeker', cost: 199, days: 30, usageCount: 1, description: 'Take 1 job-role assessment for skill gap analysis.' },
      { name: 'Interview Prep & Mock Tests', featureKey: 'hasInterviewPrep', role: 'jobseeker', cost: 249, days: 30, usageCount: 1, description: 'Get 1 mock interview pack.' },
      { name: 'Priority Application Badge', featureKey: 'hasPriorityBadge', role: 'jobseeker', cost: 99, days: 30, usageCount: 3, description: 'Apply with priority badge for up to 3 job applications.' },
      { name: 'Career Counselling Session', featureKey: 'hasCareerCounselling', role: 'jobseeker', cost: 498, days: 30, usageCount: 1, description: 'Book 1 session (45 mins) of expert career counselling.' },

      // Recruiter
      { name: 'Active Job Postings', featureKey: 'activeJobPostings', role: 'recruiter', cost: 299, days: 30, usageCount: 1, description: '1 extra job slot valid for 30 days.' },
      { name: 'Candidate Search Unlocks', featureKey: 'candidateSearchPerDay', role: 'recruiter', cost: 399, days: 30, usageCount: 50, description: 'Pack of 50 profiles unlock.' },
      { name: 'AI Candidate Matching', featureKey: 'hasAICandidateMatching', role: 'recruiter', cost: 149, days: 30, usageCount: 1, description: 'Enable AI matching for 1 job post.' },
      { name: 'Priority Listing for Jobs', featureKey: 'hasPriorityListing', role: 'recruiter', cost: 249, days: 14, usageCount: 1, description: 'Priority listing for 1 job post (14 days).' },
      { name: 'Candidate DB Export', featureKey: 'hasCandidateDBExport', role: 'recruiter', cost: 499, days: 30, usageCount: 1, description: '1 export of up to 500 candidate rows.' },
      { name: 'Bulk Messaging / SMS Blast', featureKey: 'hasBulkMessaging', role: 'recruiter', cost: 299, days: 30, usageCount: 500, description: 'Pack of 500 messages/SMS.' },
      { name: 'Video Interview Integration', featureKey: 'hasVideoInterview', role: 'recruiter', cost: 399, days: 30, usageCount: 10, description: 'Integrate video interviews for up to 10 interviews.' },

      // Company
      { name: 'Additional Job Postings', featureKey: 'activeJobPostings', role: 'company', cost: 249, days: 30, usageCount: 1, description: '1 extra job slot for a month.' },
      { name: 'Additional User Seats', featureKey: 'userSeats', role: 'company', cost: 499, days: 30, usageCount: 1, description: '1 extra seat for team member.' },
      { name: 'Branded Company Profile', featureKey: 'companyProfileType', role: 'company', cost: 999, days: 30, usageCount: 1, description: 'Upgrade to branded profile for 30 days.' },
      { name: 'Branded Careers Page', featureKey: 'hasBrandedCareersPage', role: 'company', cost: 1499, days: 30, usageCount: 1, description: 'Branded careers page setup for 30 days.' },
      { name: 'Bulk Applicant Management', featureKey: 'hasBulkApplicantManagement', role: 'company', cost: 399, days: 30, usageCount: 1, description: 'Bulk actions for 1 job campaign.' },
      { name: 'Interview Scheduling Sync', featureKey: 'hasInterviewScheduling', role: 'company', cost: 299, days: 30, usageCount: 0, description: '30 days access to scheduling sync.' },
      { name: 'API & HRMS Integration', featureKey: 'hasApiIntegration', role: 'company', cost: 4999, days: 365, usageCount: 1, description: 'One-time setup token for API integration.' },

      // College
      { name: 'Campus Drive Management', featureKey: 'hasCampusDrive', role: 'college', cost: 1999, days: 30, usageCount: 1, description: 'Manage 1 placement drive.' },
      { name: 'Student Profile Bulk Export', featureKey: 'hasCandidateDBExport', role: 'college', cost: 999, days: 30, usageCount: 1, description: '1 export (up to 1000 students).' },
      { name: 'Verified Institution Badge', featureKey: 'hasVerifiedBadge', role: 'college', cost: 2499, days: 365, usageCount: 1, description: '1 year validity for verified badge.' },
      { name: 'AI Placement Insights', featureKey: 'hasPlacementInsights', role: 'college', cost: 1499, days: 180, usageCount: 1, description: 'Placement insights per batch/semester.' },
      { name: 'Mock Interview Assessment Pack', featureKey: 'hasInterviewPrep', role: 'college', cost: 4999, days: 180, usageCount: 100, description: 'Pack of 100 tests.' },
      { name: 'Corporate Connect Request', featureKey: 'hasRequests', role: 'college', cost: 999, days: 180, usageCount: 5, description: 'Pack of 5 corporate invites.' }
    ];

    await PayPerFeature.insertMany(features);
    console.log(`Seeded ${features.length} pay-per features successfully.`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding features:', error);
    process.exit(1);
  }
};

seedFeatures();
