import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Guards
import { GuestRoute, PrivateRoute } from './ProtectedRoutes';
import FeatureGate from '../components/subscription/FeatureGate';

// Route-level code splitting keeps unrelated pages and heavy feature libraries out
// of the initial bundle. Keep layouts/guards eager so navigation stays responsive.
const HomePage = lazy(() => import('../pages/Home'));
const FreeAssessment = lazy(() => import('../pages/public/FreeAssessment'));
const CampusRegistration = lazy(() => import('../pages/public/CampusRegistration'));
const Jobs = lazy(() => import('../pages/Jobs'));
const JobDetails = lazy(() => import('../pages/JobDetails'));
const Companies = lazy(() => import('../pages/Companies'));
const CompanyProfilePage = lazy(() => import('../pages/CompanyProfilePage'));
const Contact = lazy(() => import('../pages/Contact'));
const HowItWorks = lazy(() => import('../pages/HowItWorks'));
const TermsAndConditions = lazy(() => import('../pages/TermsAndConditions'));
const Blog = lazy(() => import('../pages/Blog'));
const BlogDetails = lazy(() => import('../pages/BlogDetails'));
const LoginPage = lazy(() => import('../pages/auth/Login'));
const RegisterPage = lazy(() => import('../pages/auth/Register'));
const VerifyOtpPage = lazy(() => import('../pages/auth/VerifyOtp'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPassword'));
const SocialAuthSuccess = lazy(() => import('../pages/auth/SocialAuthSuccess'));
const CompleteSocialProfile = lazy(() => import('../pages/auth/CompleteSocialProfile'));
const CompanyLogin = lazy(() => import('../pages/auth/CompanyLogin'));

const pageModules = import.meta.glob('../pages/**/*.jsx');
const page = (path) => lazy(pageModules[`../pages/${path}.jsx`]);
const JobSeekerDashboard = page('jobseeker/Dashboard');
const AdminDashboard = page('admin/Dashboard');
const AdminLogin = page('admin/AdminLogin');
const ManageUsers = page('admin/ManageUsers');
const UserProfile = page('admin/UserProfile');
const ManageJobs = page('admin/ManageJobs');
const ManageSubscriptions = page('admin/ManageSubscriptions');
const ManageRenewals = page('admin/ManageRenewals');
const ManageRefunds = page('admin/ManageRefunds');
const ManageBuyers = page('admin/ManageBuyers');
const BuyerDetails = page('admin/BuyerDetails');
const ManagePayPer = page('admin/ManagePayPer');
const ManageCoupons = page('admin/ManageCoupons');
const AdminSettings = page('admin/AdminSettings');
const CompanyDashboard = page('company/Dashboard');
const RecruiterSettings = page('company/Settings');
const PostJob = page('company/PostJob');
const SubAdminDashboard = page('subadmin/Dashboard');
const JobSeekerSettings = page('jobseeker/Settings');
const SavedJobs = page('jobseeker/SavedJobs');
const Applicants = page('company/Applicants');
const PublicProfile = page('jobseeker/PublicProfile');
const JobSeekerSubscription = page('jobseeker/Subscription');
const CompanySubscription = page('company/Subscription');
const PaymentHistory = page('shared/PaymentHistory');
const AdminPaymentHistory = page('admin/PaymentHistory');
const ManageRequests = page('admin/ManageRequests');
const AssignedRequests = page('company/AssignedRequests');
const CompanyProfileManagement = page('company/features/CompanyProfileManagement');
const PayPerFeatures = page('shared/PayPerFeatures');
const MeetingRoom = page('shared/MeetingRoom');
const ResumeBuilder = page('jobseeker/features/ResumeBuilder');
const JobAlerts = page('jobseeker/features/JobAlerts');
const ProfileInsights = page('jobseeker/features/ProfileInsights');
const Messages = page('Messages');
const CareerCounselling = page('jobseeker/features/CareerCounselling');
const MockInterviews = page('jobseeker/features/MockInterviews');
const SkillTests = page('jobseeker/features/SkillTests');
const AiResumeReview = page('jobseeker/features/AiResumeReview');
const MyApplications = page('jobseeker/MyApplications');
const CampusDrives = page('jobseeker/CampusDrives');
const CampusDriveDetails = page('jobseeker/CampusDriveDetails');
const AtsPipeline = page('company/features/AtsPipeline');
const Analytics = page('company/features/Analytics');
const BulkMessaging = page('company/features/BulkMessaging');
const MyTeam = page('company/MyTeam');
const TeamRoster = page('company/TeamRoster');
const VideoInterview = page('company/features/VideoInterview');
const TeamCollaboration = page('company/features/TeamCollaboration');
const InterviewScheduling = page('company/features/InterviewScheduling');
const AICandidateMatching = page('company/features/AICandidateMatching');
const BulkApplicantManagement = page('company/features/BulkApplicantManagement');
const MyJobs = page('company/MyJobs');
const CandidateSearch = page('company/CandidateSearch');
const DriveRequests = page('company/DriveRequests');
const RaiseTicket = page('tickets/RaiseTicket');
const MyTickets = page('tickets/MyTickets');
const AdminTickets = page('admin/AdminTickets');
const EmployeeDashboard = page('employee/Dashboard');
const WriteReview = page('shared/WriteReview');
const ManageReviews = page('admin/ManageReviews');
const AdminCollegeVerification = page('admin/CollegeVerification');
const CollegeKycDetails = page('admin/CollegeKycDetails');
const CollegeDashboard = page('college/Dashboard');
const CollegeStudents = page('college/Students');
const CollegeDrives = page('college/Drives');
const CollegeSettings = page('college/Settings');
const CollegeReports = page('college/Reports');
const CollegeVerification = page('college/Verification');
const CollegePlacementTools = page('college/PlacementTools');
const CollegeOperations = page('college/CollegeOperations');
const EventCheckIn = page('jobseeker/EventCheckIn');
const PrincipalExecutiveSummary = page('public/PrincipalExecutiveSummary');
const CompanyDriveView = page('public/CompanyDriveView');
const AcceptInchargeInvite = page('public/AcceptInchargeInvite');
const ManageDrive = page('shared/ManageDrive');


// Role-based redirect after login
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const routes = {
    admin: '/admin/dashboard',
    subadmin: '/subadmin',
    recruiter: '/company/dashboard',
    company: '/company/dashboard',
    jobseeker: '/candidate',
    org_employee: '/employee',
    college: '/college/dashboard',
    drive_incharge: '/incharge',
  };
  return <Navigate to={routes[user.role] || '/candidate'} replace />;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<div className="route-loading" role="status" aria-live="polite"><span className="route-loading__spinner" /><span>Loading page…</span></div>}>
    <Routes>

      {/* ── Public Landing Page ───────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/free-assessment" element={<FreeAssessment />} />
        <Route path="/campus/:driveCode" element={<CampusRegistration />} />
        <Route path="/principal/executive-summary/:passkey" element={<PrincipalExecutiveSummary />} />
        <Route path="/company-drive/:token" element={<CompanyDriveView />} />
        <Route path="/incharge/accept/:driveId/:token" element={<AcceptInchargeInvite />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:location" element={<Jobs />} />
        <Route path="/job/:id" element={<JobDetails />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyProfilePage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetails />} />
      </Route>


      {/* ── Auth Pages (no header/sidebar) ──────────── */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/company-login"
          element={
            <GuestRoute>
              <CompanyLogin />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <GuestRoute>
              <VerifyOtpPage />
            </GuestRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route path="/social-auth-success" element={<SocialAuthSuccess />} />
        <Route path="/complete-social-profile" element={<CompleteSocialProfile />} />
        <Route
          path="/admin/login"
          element={
            <GuestRoute>
              <AdminLogin />
            </GuestRoute>
          }
        />
      </Route>

      {/* ── Role-Based Dashboard Routes ───────────── */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <RoleRedirect />
          </PrivateRoute>
        }
      />



      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route
          path="/dashboard/saved-jobs"
          element={
            <PrivateRoute>
              <SavedJobs />
            </PrivateRoute>
          }
        />

        {/* Shared Authenticated Routes */}
        <Route path="/meeting/:id" element={<MeetingRoom />} />

        {/* Job Seeker */}
        <Route
          path="/incharge"
          element={
            <PrivateRoute>
              <ManageDrive />
            </PrivateRoute>
          }
        />
        <Route
          path="/candidate/*"
          element={
            <PrivateRoute roles={['jobseeker']}>
              <JobSeekerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/candidate/profile/:id"
          element={
            <PrivateRoute>
              <PublicProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/candidate/settings"
          element={
            <PrivateRoute roles={['jobseeker']}>
              <JobSeekerSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/candidate/subscription"
          element={
            <PrivateRoute roles={['jobseeker']}>
              <JobSeekerSubscription />
            </PrivateRoute>
          }
        />
        <Route path="/candidate/applications" element={<PrivateRoute roles={['jobseeker']}><MyApplications /></PrivateRoute>} />
        <Route path="/candidate/campus-drives" element={<PrivateRoute roles={['jobseeker']}><CampusDrives /></PrivateRoute>} />
        <Route path="/candidate/campus-drives/:id" element={<PrivateRoute roles={['jobseeker']}><CampusDriveDetails /></PrivateRoute>} />
        <Route path="/candidate/resume-builder" element={<PrivateRoute roles={['jobseeker']}><ResumeBuilder /></PrivateRoute>} />
        <Route path="/candidate/job-alerts" element={<PrivateRoute roles={['jobseeker']}><JobAlerts /></PrivateRoute>} />
        <Route path="/candidate/profile-insights" element={<PrivateRoute roles={['jobseeker']}><ProfileInsights /></PrivateRoute>} />
        <Route path="/candidate/messages" element={<PrivateRoute roles={['jobseeker']}><FeatureGate featureKey="hasMessageRecruiters" subscriptionPath="/candidate/subscription"><Messages /></FeatureGate></PrivateRoute>} />
        <Route path="/candidate/career-counselling" element={<PrivateRoute roles={['jobseeker']}><CareerCounselling /></PrivateRoute>} />
        <Route path="/candidate/mock-interviews" element={<PrivateRoute roles={['jobseeker']}><MockInterviews /></PrivateRoute>} />
        <Route path="/candidate/skill-tests" element={<PrivateRoute roles={['jobseeker']}><SkillTests /></PrivateRoute>} />
        <Route path="/candidate/ai-resume-review" element={<PrivateRoute roles={['jobseeker']}><AiResumeReview /></PrivateRoute>} />
        <Route path="/candidate/payment-history" element={<PrivateRoute roles={['jobseeker']}><PaymentHistory /></PrivateRoute>} />
        <Route path="/candidate/pay-per-features" element={<PrivateRoute roles={['jobseeker']}><PayPerFeatures /></PrivateRoute>} />

        <Route
          path="/company/settings"
          element={
            <PrivateRoute roles={['recruiter', 'company', 'college']}>
              <RecruiterSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/jobs/new"
          element={
            <PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="post_job">
              <PostJob />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/applicants/:jobId"
          element={
            <PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="ats_pipeline">
              <Applicants />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/subscription"
          element={
            <PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']}>
              <CompanySubscription />
            </PrivateRoute>
          }
        />
        <Route path="/company/jobs" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="my_jobs"><MyJobs /></PrivateRoute>} />
        <Route path="/company/candidates" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="candidate_search"><CandidateSearch /></PrivateRoute>} />
        <Route path="/company/requests" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']}><AssignedRequests /></PrivateRoute>} />
        <Route path="/company/ats-pipeline" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="ats_pipeline"><FeatureGate featureKey="hasATSPipeline" subscriptionPath="/company/subscription"><AtsPipeline /></FeatureGate></PrivateRoute>} />
        <Route path="/company/analytics" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="analytics"><FeatureGate featureKey="hasAnalyticsDashboard" subscriptionPath="/company/subscription"><Analytics /></FeatureGate></PrivateRoute>} />
        <Route path="/company/bulk-messaging" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="bulk_messaging"><FeatureGate featureKey="hasBulkMessaging" subscriptionPath="/company/subscription"><BulkMessaging /></FeatureGate></PrivateRoute>} />
        <Route path="/company/bulk-hiring" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="bulk_applicant_management"><FeatureGate featureKey="hasBulkApplicantManagement" subscriptionPath="/company/subscription"><BulkApplicantManagement /></FeatureGate></PrivateRoute>} />
        <Route path="/company/profile-management" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']}><CompanyProfileManagement /></PrivateRoute>} />
        <Route path="/company/team" element={<PrivateRoute roles={['company']}><MyTeam /></PrivateRoute>} />
        <Route path="/company/team-roster" element={<PrivateRoute roles={['recruiter', 'org_employee']}><TeamRoster /></PrivateRoute>} />
        <Route path="/company/video-interview" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="interview_scheduling"><FeatureGate featureKey="hasInterviewScheduling" subscriptionPath="/company/subscription"><VideoInterview /></FeatureGate></PrivateRoute>} />
        <Route path="/company/interview-scheduling" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="interview_scheduling"><FeatureGate featureKey="hasInterviewScheduling" subscriptionPath="/company/subscription"><InterviewScheduling /></FeatureGate></PrivateRoute>} />
        <Route path="/company/ai-matching" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="ai_candidate_matching"><FeatureGate featureKey="hasAICandidateMatching" subscriptionPath="/company/subscription"><AICandidateMatching /></FeatureGate></PrivateRoute>} />
        <Route path="/company/messages" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']} permissionKey="messages"><Messages /></PrivateRoute>} />
        <Route path="/company/drive-requests" element={<PrivateRoute roles={['company']}><DriveRequests /></PrivateRoute>} />
        <Route path="/company/payment-history" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']}><PaymentHistory /></PrivateRoute>} />
        <Route path="/company/unlocks" element={<PrivateRoute roles={['recruiter', 'company', 'college', 'org_employee']}><PayPerFeatures /></PrivateRoute>} />
        <Route
          path="/company/dashboard"
          element={
            <PrivateRoute roles={['recruiter', 'company', 'college']}>
              <CompanyDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/*"
          element={
            <PrivateRoute roles={['recruiter', 'company', 'college']}>
              <CompanyDashboard />
            </PrivateRoute>
          }
        />

        {/* Org Employee */}
        <Route path="/employee" element={<PrivateRoute roles={['org_employee']}><EmployeeDashboard /></PrivateRoute>} />
        <Route path="/employee/settings" element={<PrivateRoute roles={['org_employee']}><JobSeekerSettings /></PrivateRoute>} />

        {/* College (TPO) */}
        <Route path="/college/dashboard" element={<PrivateRoute roles={['college']}><CollegeDashboard /></PrivateRoute>} />
        <Route path="/college" element={<Navigate to="/college/dashboard" replace />} />
        <Route path="/college/students" element={<PrivateRoute roles={['college']}><CollegeStudents /></PrivateRoute>} />
        <Route path="/college/drives" element={<PrivateRoute roles={['college']}><CollegeDrives /></PrivateRoute>} />
        <Route path="/college/drives/new" element={<PrivateRoute roles={['college']}><CollegeDrives /></PrivateRoute>} />
        <Route path="/college/reports" element={<PrivateRoute roles={['college']}><CollegeReports /></PrivateRoute>} />
        <Route path="/college/verification" element={<PrivateRoute roles={['college']}><CollegeVerification /></PrivateRoute>} />
        <Route path="/college/subscription" element={<PrivateRoute roles={['college']}><CompanySubscription /></PrivateRoute>} />
        <Route path="/college/payment-history" element={<PrivateRoute roles={['college']}><PaymentHistory /></PrivateRoute>} />
        <Route path="/college/settings" element={<PrivateRoute roles={['college']}><CollegeSettings /></PrivateRoute>} />
        <Route path="/college/placement-tools" element={<PrivateRoute roles={['college']}><CollegePlacementTools /></PrivateRoute>} />
        <Route path="/college/operations" element={<PrivateRoute roles={['college']}><CollegeOperations /></PrivateRoute>} />
        <Route path="/college-event-checkin/:token" element={<PrivateRoute roles={['jobseeker']}><EventCheckIn /></PrivateRoute>} />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute roles={['admin']}>
              <ManageUsers />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users/:id"
          element={
            <PrivateRoute roles={['admin']}>
              <UserProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <PrivateRoute roles={['admin']}>
              <ManageJobs />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/colleges"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminCollegeVerification />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/colleges/:id"
          element={
            <PrivateRoute roles={['admin']}>
              <CollegeKycDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/jobs/:jobId/applicants"
          element={
            <PrivateRoute roles={['admin']}>
              <Applicants />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/subscriptions/plans"
          element={
            <PrivateRoute roles={['admin']}>
              <ManageSubscriptions />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/subscriptions"
          element={<Navigate to="/admin/subscriptions/plans" replace />}
        />
        <Route
          path="/admin/subscriptions/renewals"
          element={
            <PrivateRoute roles={['admin']}>
              <ManageRenewals />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/subscriptions/refunds"
          element={
            <PrivateRoute roles={['admin']}>
              <ManageRefunds />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/subscriptions/buyers"
          element={
            <PrivateRoute roles={['admin']}>
              <ManageBuyers />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/subscriptions/buyers/:id"
          element={
            <PrivateRoute roles={['admin']}>
              <BuyerDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/subscriptions/pay-per"
          element={
            <PrivateRoute roles={['admin']}>
              <ManagePayPer />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/subscriptions/coupons"
          element={
            <PrivateRoute roles={['admin']}>
              <ManageCoupons />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <PrivateRoute roles={['admin']}>
              <Messages />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/payment-history"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminPaymentHistory />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <PrivateRoute roles={['admin']}>
              <ManageRequests />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminTickets />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <PrivateRoute roles={['admin']}>
              <ManageReviews />
            </PrivateRoute>
          }
        />
        {/* Ticket routes – all authenticated users */}
        <Route
          path="/tickets/raise"
          element={
            <PrivateRoute roles={['jobseeker','recruiter','company','college','org_employee','admin']}>
              <RaiseTicket />
            </PrivateRoute>
          }
        />
        <Route
          path="/tickets/my"
          element={
            <PrivateRoute roles={['jobseeker','recruiter','company','college','org_employee','admin']}>
              <MyTickets />
            </PrivateRoute>
          }
        />
        <Route
          path="/write-review"
          element={
            <PrivateRoute roles={['jobseeker','recruiter','company','college','org_employee']}>
              <WriteReview />
            </PrivateRoute>
          }
        />

        {/* Sub-Admin */}
        <Route
          path="/subadmin/*"
          element={
            <PrivateRoute roles={['subadmin']}>
              <SubAdminDashboard />
            </PrivateRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;
