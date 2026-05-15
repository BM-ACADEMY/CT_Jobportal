import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

// Maps static schema keys to their human-readable names used in the dynamic features array.
// Values can be a string OR an array of strings (aliases) — admin may name features differently.
const DYNAMIC_FEATURE_NAMES = {
  hasResumeBuilder:          'Resume Builder',
  hasProfileBoost:           'Profile Boost',
  hasProfileViewInsights:    'Profile View Insights',
  hasMessageRecruiters:      'Message Recruiters',
  hasCareerCounselling:      'Career Counselling',
  hasInterviewPrep:          'Interview Prep',
  hasPriorityBadge:          'Priority Badge',
  hasSalaryBenchmarking:     ['Salary Benchmarking', 'Salary Benchmark'],
  hasAiResumeReview:         ['AI Resume Review', 'AI Resume'],
  hasATSPipeline:            ['ATS Pipeline', 'ATS'],
  hasAnalyticsDashboard:     ['Analytics Dashboard', 'Analytics'],
  hasCandidateDBExport:      ['Candidate DB Export', 'Candidate DB export', 'DB Export'],
  hasBulkMessaging:          ['Bulk Messaging', 'Bulk Message'],
  hasVideoInterview:         ['Video Interview', 'Video interview'],
  hasPriorityListing:        ['Priority Listing', 'Priority'],
  hasAICandidateMatching:    ['AI Candidate Matching', 'AI candidate matching', 'AI Matching'],
  hasTeamCollaboration:      ['Team Collaboration', 'Team'],
  hasBulkApplicantManagement: ['Bulk Applicant Management', 'Bulk Applicant'],
  hasInterviewScheduling:    ['Interview Scheduling', 'Schedule', 'Scheduling'],
  hasDedicatedOnboarding:    ['Dedicated Onboarding', 'Onboarding'],
};

/**
 * Checks if a specific feature key is active on the user's subscription.
 * Checks both static schema fields and the dynamic features[] array.
 */
export const hasFeature = (user, featureKey) => {
  const plan = user?.subscription;
  if (!plan) return false;

  // Expired subscription — skip this check for free/lifetime plans
  const isFree = plan.price === 0 || plan.duration === 'Lifetime';
  if (!isFree && user.subscriptionExpiry && new Date(user.subscriptionExpiry) < new Date()) return false;

  // 1. Check static schema field — only short-circuit on truthy values.
  // A static `false` falls through so the dynamic features[] can still grant access.
  const val = plan[featureKey];
  if (val !== undefined && val !== null) {
    if (typeof val === 'boolean') {
      if (val === true) return true;
      // val === false → fall through to dynamic check below
    } else if (typeof val === 'number') {
      if (val >= 0) return true; // 0 = unlimited = enabled; positive = N uses = enabled
    } else if (typeof val === 'string') {
      if (val !== 'none' && val !== '' && val !== 'None') return true;
    }
  }

  // 2. Fallback: check dynamic features[] array (admin may have set it there)
  if (Array.isArray(plan.features) && plan.features.length > 0) {
    const dynamicEntry = DYNAMIC_FEATURE_NAMES[featureKey];
    if (dynamicEntry) {
      const aliases = Array.isArray(dynamicEntry) ? dynamicEntry : [dynamicEntry];
      const dynMatch = plan.features.find(
        f => f.isActive && aliases.some(alias => f.name?.toLowerCase() === alias.toLowerCase())
      );
      if (dynMatch) return true;
    }
  }

  return false;
};

const PERKS = {
  hasResumeBuilder:         ['Professional AI-powered templates', 'ATS-optimized formatting', 'Download as PDF/Word', 'Real-time feedback'],
  jobAlerts:                ['Instant / daily / weekly digest', 'Keyword + location filters', 'Role & salary alerts', 'Never miss an opening'],
  hasProfileViewInsights:   ['See who viewed your profile', 'Company & role of viewers', 'Daily view trend chart', 'Boost visibility stats'],
  hasMessageRecruiters:     ['Direct chat with hiring managers', 'Read receipts & status', 'Attach resume inline', 'Conversation history'],
  hasCareerCounselling:     ['1-on-1 expert sessions', 'Career path roadmapping', 'Resume & LinkedIn review', 'Negotiation coaching'],
  hasInterviewPrep:         ['AI mock interviews', 'Role-specific question bank', 'Video recording & playback', 'Instant feedback'],
  hasATSPipeline:           ['Visual Kanban pipeline', 'Automated stage triggers', 'Bulk status updates', 'Pipeline analytics'],
  hasAnalyticsDashboard:    ['Job post performance', 'Candidate funnel metrics', 'Time-to-hire tracking', 'Source attribution'],
  hasCandidateDBExport:     ['Export to CSV / Excel', 'Bulk profile download', 'Filter before export', 'Scheduled exports'],
  hasBulkMessaging:         ['Message up to 500 candidates', 'Template library', 'Open-rate analytics', 'Personalization tokens'],
  hasVideoInterview:        ['Schedule video interviews', 'Invite candidates via meeting link', 'Track interview status', 'Manage upcoming interviews'],
  hasPriorityListing:       ['Golden star badge on all job cards', 'Jobs listed at top of search results', 'Highlighted as Priority Hiring Partner', 'Increased candidate visibility'],
  hasAICandidateMatching:   ['AI-scored candidate ranking', 'Skills + experience matching', 'Location & job type fit analysis', 'Sorted by match percentage'],
  hasTeamCollaboration:     ['Shared job pipelines', 'Role-based permissions', 'Internal notes & tags', 'Activity feed'],
  hasBulkApplicantManagement: ['Batch accept / reject', 'Multi-job applicant view', 'Smart filters', 'One-click status update'],
  hasInterviewScheduling:   ['Calendar sync (Google/Outlook)', 'Auto-reminders', 'Self-schedule links', 'Interviewer availability'],
  hasDedicatedOnboarding:   ['Dedicated success manager', 'Custom onboarding plan', 'Priority support queue', 'Training sessions'],
  hasSalaryBenchmarking:    ['Compare salary vs market rate', 'Company-specific benchmarks', 'Role & experience adjusted', 'Instant report'],
  hasAiResumeReview:        ['AI-powered feedback', 'ATS compatibility score', 'Section-by-section analysis', 'Improvement suggestions'],
};

const NAMES = {
  hasResumeBuilder: 'Resume Builder',
  jobAlerts: 'Job Alerts',
  hasProfileViewInsights: 'Profile Insights',
  hasMessageRecruiters: 'Direct Messaging',
  hasCareerCounselling: 'Career Counselling',
  hasInterviewPrep: 'Interview Prep',
  hasATSPipeline: 'ATS Pipeline',
  hasAnalyticsDashboard: 'Analytics Dashboard',
  hasCandidateDBExport: 'Candidate Export',
  hasBulkMessaging: 'Bulk Messaging',
  hasVideoInterview: 'Video Interview',
  hasPriorityListing: 'Priority Listing',
  hasAICandidateMatching: 'AI Candidate Matching',
  hasTeamCollaboration: 'Team Collaboration',
  hasBulkApplicantManagement: 'Bulk Applicant Management',
  hasInterviewScheduling: 'Interview Scheduling',
  hasDedicatedOnboarding: 'Dedicated Onboarding',
  hasSalaryBenchmarking: 'Salary Benchmarking',
  hasAiResumeReview: 'AI Resume Review',
};

const LockedScreen = ({ featureKey, featureName, description, subscriptionPath }) => {
  const perks = PERKS[featureKey] || [];
  const name = featureName || NAMES[featureKey] || 'This Feature';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md text-center">
        {/* Lock Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full mb-6">
          <Lock size={11} />
          Premium Feature
        </div>

        {/* Icon */}
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
          <Lock size={24} className="text-white" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">{name}</h2>
        {description && (
          <p className="text-sm text-slate-500 font-medium mb-7 leading-relaxed">{description}</p>
        )}

        {/* Perks */}
        {perks.length > 0 && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-7 text-left space-y-2.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">What you'll unlock</p>
            {perks.map((p, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-slate-700">{p}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link to={subscriptionPath || '/jobseeker/subscription'}>
          <Button className="h-11 px-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 gap-2">
            <Sparkles size={15} />
            Upgrade to Unlock
            <ArrowRight size={14} />
          </Button>
        </Link>

        <p className="text-[11px] text-slate-400 font-medium mt-4">
          Already have a plan? Your feature may not be included — check your{' '}
          <Link to={subscriptionPath || '/jobseeker/subscription'} className="text-emerald-600 hover:underline">
            subscription settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

/**
 * Wraps feature content with a subscription gate.
 * Shows upgrade wall if the feature is not active on the user's plan.
 *
 * @param featureKey   - The plan field key e.g. 'hasResumeBuilder'
 * @param featureName  - Human-readable name (optional, derived from featureKey if absent)
 * @param description  - Short description shown on the lock screen
 * @param subscriptionPath - Path to the subscription page (default: /jobseeker/subscription)
 * @param children     - Rendered when feature is active
 */
const FeatureGate = ({ featureKey, featureName, description, subscriptionPath, children }) => {
  const { user } = useAuth();

  if (!hasFeature(user, featureKey)) {
    return (
      <LockedScreen
        featureKey={featureKey}
        featureName={featureName}
        description={description}
        subscriptionPath={subscriptionPath}
      />
    );
  }

  return <>{children}</>;
};

export default FeatureGate;
