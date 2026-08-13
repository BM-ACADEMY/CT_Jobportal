import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Guards
import { GuestRoute, PrivateRoute } from './ProtectedRoutes';
import FeatureGate from '../components/subscription/FeatureGate';

// Pages
import HomePage from '../pages/Home';
import FreeAssessment from '../pages/public/FreeAssessment';
import CampusRegistration from '../pages/public/CampusRegistration';
import Jobs from '../pages/Jobs';
import JobDetails from '../pages/JobDetails';
import Companies from '../pages/Companies';
import CompanyProfilePage from '../pages/CompanyProfilePage';
import Contact from '../pages/Contact';
import HowItWorks from '../pages/HowItWorks';
import TermsAndConditions from '../pages/TermsAndConditions';
import LoginPage from '../pages/auth/Login';
import RegisterPage from '../pages/auth/Register';
import VerifyOtpPage from '../pages/auth/VerifyOtp';
import ForgotPasswordPage from '../pages/auth/ForgotPassword';
import SocialAuthSuccess from '../pages/auth/SocialAuthSuccess';
import CompleteSocialProfile from '../pages/auth/CompleteSocialProfile';
import CompanyLogin from '../pages/auth/CompanyLogin';
import JobSeekerDashboard from '../pages/jobseeker/Dashboard';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminLogin from '../pages/admin/AdminLogin';
import ManageUsers from '../pages/admin/ManageUsers';
import UserProfile from '../pages/admin/UserProfile';
import ManageJobs from '../pages/admin/ManageJobs';
import ManageSubscriptions from '../pages/admin/ManageSubscriptions';
import ManageRenewals from '../pages/admin/ManageRenewals';
import ManageRefunds from '../pages/admin/ManageRefunds';
import ManageBuyers from '../pages/admin/ManageBuyers';
import BuyerDetails from '../pages/admin/BuyerDetails';
import ManagePayPer from '../pages/admin/ManagePayPer';
import ManageCoupons from '../pages/admin/ManageCoupons';
import AdminSettings from '../pages/admin/AdminSettings';
import CompanyDashboard from '../pages/company/Dashboard';
import RecruiterSettings from '../pages/company/Settings';
import PostJob from '../pages/company/PostJob';
import SubAdminDashboard from '../pages/subadmin/Dashboard';
import JobSeekerSettings from '../pages/jobseeker/Settings';
import SavedJobs from '../pages/jobseeker/SavedJobs';
import Applicants from '../pages/company/Applicants';
import PublicProfile from '../pages/jobseeker/PublicProfile';
import JobSeekerSubscription from '../pages/jobseeker/Subscription';
import CompanySubscription from '../pages/company/Subscription';
import PaymentHistory from '../pages/shared/PaymentHistory';
import AdminPaymentHistory from '../pages/admin/PaymentHistory';
import ManageRequests from '../pages/admin/ManageRequests';
import AssignedRequests from '../pages/company/AssignedRequests';
import CompanyProfileManagement from '../pages/company/features/CompanyProfileManagement';
import PayPerFeatures from '../pages/shared/PayPerFeatures';
import MeetingRoom from '../pages/shared/MeetingRoom';

// Jobseeker feature pages
import ResumeBuilder from '../pages/jobseeker/features/ResumeBuilder';
import JobAlerts from '../pages/jobseeker/features/JobAlerts';
import ProfileInsights from '../pages/jobseeker/features/ProfileInsights';
import Messages from '../pages/Messages';
import CareerCounselling from '../pages/jobseeker/features/CareerCounselling';
import MockInterviews from '../pages/jobseeker/features/MockInterviews';
import SkillTests from '../pages/jobseeker/features/SkillTests';
import AiResumeReview from '../pages/jobseeker/features/AiResumeReview';
import MyApplications from '../pages/jobseeker/MyApplications';
import CampusDrives from '../pages/jobseeker/CampusDrives';
import CampusDriveDetails from '../pages/jobseeker/CampusDriveDetails';

// Company/Recruiter feature pages
import AtsPipeline from '../pages/company/features/AtsPipeline';
import Analytics from '../pages/company/features/Analytics';
import BulkMessaging from '../pages/company/features/BulkMessaging';
import MyTeam from '../pages/company/MyTeam';
import TeamRoster from '../pages/company/TeamRoster';
import VideoInterview from '../pages/company/features/VideoInterview';
import TeamCollaboration from '../pages/company/features/TeamCollaboration';
import InterviewScheduling from '../pages/company/features/InterviewScheduling';
import AICandidateMatching from '../pages/company/features/AICandidateMatching';
import BulkApplicantManagement from '../pages/company/features/BulkApplicantManagement';
import MyJobs from '../pages/company/MyJobs';
import CandidateSearch from '../pages/company/CandidateSearch';
import DriveRequests from '../pages/company/DriveRequests';
import RaiseTicket from '../pages/tickets/RaiseTicket';
import MyTickets from '../pages/tickets/MyTickets';
import AdminTickets from '../pages/admin/AdminTickets';

// Org Employee pages
import EmployeeDashboard from '../pages/employee/Dashboard';

import WriteReview from '../pages/shared/WriteReview';
import ManageReviews from '../pages/admin/ManageReviews';
import AdminCollegeVerification from '../pages/admin/CollegeVerification';
import CollegeKycDetails from '../pages/admin/CollegeKycDetails';

// College pages
import CollegeDashboard from '../pages/college/Dashboard';
import CollegeStudents from '../pages/college/Students';
import CollegeDrives from '../pages/college/Drives';
import CollegeSettings from '../pages/college/Settings';
import CollegeReports from '../pages/college/Reports';
import CollegeVerification from '../pages/college/Verification';
import PrincipalExecutiveSummary from '../pages/public/PrincipalExecutiveSummary';
import CompanyDriveView from '../pages/public/CompanyDriveView';
import AcceptInchargeInvite from '../pages/public/AcceptInchargeInvite';
import ManageDrive from '../pages/shared/ManageDrive';


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
        <Route path="/job/:id" element={<JobDetails />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/companies/:id" element={<CompanyProfilePage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/terms" element={<TermsAndConditions />} />
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
  );
};

export default AppRoutes;
