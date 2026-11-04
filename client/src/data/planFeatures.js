// One place for the feature rows shown on every plan card (public /plans page and the three
// logged-in subscription pages), so the public and the logged-in views can never disagree.
// Keys map to fields on the Subscription model; labels describe what the code really does.

export const JOBSEEKER_FEATURES = [
  { label: 'Resume Builder', key: 'hasResumeBuilder' },
  { label: 'Resume Count', key: 'resumeBuilderCount' },
  { label: 'AI Resume Review', key: 'hasAiResumeReview' },
  { label: 'Resume Reviews', key: 'aiResumeReviewCount' },
  { label: 'Job Match Analysis', key: 'hasJobMatchAnalysis' },
  { label: 'Job Alerts', key: 'jobAlerts' },
  { label: 'Message Recruiters', key: 'hasMessageRecruiters' },
  { label: 'Profile Boost', key: 'hasProfileBoost' },
  { label: 'Profile View Insights', key: 'hasProfileViewInsights' },
  { label: 'Career Counselling', key: 'hasCareerCounselling' },
  { label: 'Counselling Sessions', key: 'careerCounsellingCount' },
  { label: 'Mock Interviews', key: 'hasMockInterviews' },
  { label: 'Priority Badge', key: 'hasPriorityBadge' },
];

export const RECRUITER_FEATURES = [
  { label: 'Job postings', key: 'activeJobPostings' },
  { label: 'Candidate search', key: 'candidateSearchPerDay', unit: '/day' },
  { label: 'ATS pipeline', key: 'hasATSPipeline' },
  { label: 'Analytics dashboard', key: 'hasAnalyticsDashboard' },
  { label: 'Candidate DB export', key: 'hasCandidateDBExport' },
  { label: 'Bulk messaging', key: 'hasBulkMessaging' },
  { label: 'Video interview', key: 'hasVideoInterview' },
  { label: 'Priority Listing', key: 'hasPriorityListing' },
  { label: 'AI candidate matching', key: 'hasAICandidateMatching' },
];

export const COMPANY_FEATURES = [
  { label: 'User seats', key: 'userSeats' },
  { label: 'Company profile', key: 'companyProfileType' },
  { label: 'Interview scheduling', key: 'hasInterviewScheduling' },
  { label: 'Dedicated onboarding', key: 'hasDedicatedOnboarding' },
];

// Audience tabs. `subscriptionPath` is where a signed-in person of that role buys the plan.
export const PLAN_AUDIENCES = [
  { key: 'jobseeker', label: 'Students & job seekers', registerRole: 'jobseeker', subscriptionPath: '/candidate/subscription', roles: ['jobseeker'] },
  { key: 'recruiter', label: 'Recruiters', registerRole: 'recruiter', subscriptionPath: '/company/subscription', roles: ['recruiter'] },
  { key: 'company', label: 'Companies', registerRole: 'company', subscriptionPath: '/company/subscription', roles: ['company'] },
  { key: 'college', label: 'Colleges', registerRole: 'college', subscriptionPath: '/college/subscription', roles: ['college'] },
];

// Rows for one plan card: the fixed rows for the audience plus any extra feature the admin
// added in the feature catalog (shown only when it is not already one of the fixed rows).
export const buildPlanFeatures = (plan, role, globalFeatures = []) => {
  if (role === 'college') {
    return (plan.features || []).map((f) => ({
      label: f.name,
      key: 'dynamic',
      isDynamic: true,
      isActive: !!f.isActive,
      value: f.value,
    }));
  }
  const base = role === 'company' ? COMPANY_FEATURES : role === 'recruiter' ? RECRUITER_FEATURES : JOBSEEKER_FEATURES;
  const staticLabels = new Set(base.map((f) => f.label.toLowerCase()));
  return [
    ...base,
    ...globalFeatures
      .filter((f) => f.role === role)
      .filter((gf) => !staticLabels.has(gf.name.toLowerCase()))
      .map((gf) => {
        const featureInPlan = (plan.features || []).find((f) => f.name === gf.name);
        return {
          label: gf.name,
          key: 'dynamic',
          isDynamic: true,
          isActive: !!featureInPlan?.isActive,
          value: featureInPlan?.value ?? null,
        };
      }),
  ];
};

export const sortPlans = (plans) => [...plans].sort((a, b) => (a.price || 0) - (b.price || 0));
