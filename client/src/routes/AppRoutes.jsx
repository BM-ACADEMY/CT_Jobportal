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

// Jobseeker feature pages
import ResumeBuilder from '../pages/jobseeker/features/ResumeBuilder';
import JobAlerts from '../pages/jobseeker/features/JobAlerts';
import ProfileInsights from '../pages/jobseeker/features/ProfileInsights';
import Messages from '../pages/Messages';
import CareerCounselling from '../pages/jobseeker/features/CareerCounselling';
import InterviewPrep from '../pages/jobseeker/features/InterviewPrep';
import SkillTests from '../pages/jobseeker/features/SkillTests';
import SalaryBenchmarking from '../pages/jobseeker/features/SalaryBenchmarking';
import AiResumeReview from '../pages/jobseeker/features/AiResumeReview';
import MyApplications from '../pages/jobseeker/MyApplications';
import CampusDrives from '../pages/jobseeker/CampusDrives';

// Company/Recruiter feature pages
import AtsPipeline from '../pages/company/features/AtsPipeline';
import Analytics from '../pages/company/features/Analytics';
import BulkMessaging from '../pages/company/features/BulkMessaging';
import MyTeam from '../pages/company/MyTeam';
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
    admin: '/admin',
    subadmin: '/subadmin',
    recruiter: '/company',
    company: '/company',
    jobseeker: '/jobseeker',
    org_employee: '/employee',
    college: '/college',
    drive_incharge: '/incharge',
  };
  return <Navigate to={routes[user.role] || '/jobseeker'} replace />;
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
        <Route path="/company-profile/:id" element={<CompanyProfilePage />} />
        <Route path="/contact" element={<Contact />} />
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
          path="/admin-login"
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
        <Route
          path="/incharge"
          element={
            <PrivateRoute>
              <ManageDrive />
            </PrivateRoute>
          }
        />
        <Route
          path="/jobseeker/*"
          element={
            <PrivateRoute roles={['jobseeker']}>
              <JobSeekerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/jobseeker/profile/:id"
          element={
            <PrivateRoute>
              <PublicProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/jobseeker/settings"
          element={
            <PrivateRoute roles={['jobseeker']}>
              <JobSeekerSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/jobseeker/subscription"
          element={
            <PrivateRoute roles={['jobseeker']}>
              <JobSeekerSubscription />
            </PrivateRoute>
          }
        />
        <Route path="/jobseeker/applications" element={<PrivateRoute roles={['jobseeker']}><MyApplications /></PrivateRoute>} />
        <Route path="/jobseeker/campus-drives" element={<PrivateRoute roles={['jobseeker']}><CampusDrives /></PrivateRoute>} />
        <Route path="/jobseeker/resume-builder" element={<PrivateRoute roles={['jobseeker']}><ResumeBuilder /></PrivateRoute>} />
        <Route path="/jobseeker/job-alerts" element={<PrivateRoute roles={['jobseeker']}><JobAlerts /></PrivateRoute>} />
        <Route path="/jobseeker/profile-insights" element={<PrivateRoute roles={['jobseeker']}><ProfileInsights /></PrivateRoute>} />
        <Route path="/jobseeker/messages" element={<PrivateRoute roles={['jobseeker']}><FeatureGate featureKey="hasMessageRecruiters" subscriptionPath="/jobseeker/subscription"><Messages /></FeatureGate></PrivateRoute>} />
        <Route path="/jobseeker/career-counselling" element={<PrivateRoute roles={['jobseeker']}><CareerCounselling /></PrivateRoute>} />
        <Route path="/jobseeker/interview-prep" element={<PrivateRoute roles={['jobseeker']}><InterviewPrep /></PrivateRoute>} />
        <Route path="/jobseeker/skill-tests" element={<PrivateRoute roles={['jobseeker']}><SkillTests /></PrivateRoute>} />
        <Route path="/jobseeker/salary-benchmarking" element={<PrivateRoute roles={['jobseeker']}><SalaryBenchmarking /></PrivateRoute>} />
        <Route path="/jobseeker/ai-resume-review" element={<PrivateRoute roles={['jobseeker']}><AiResumeReview /></PrivateRoute>} />
        <Route path="/jobseeker/payment-history" element={<PrivateRoute roles={['jobseeker']}><PaymentHistory /></PrivateRoute>} />
        <Route path="/jobseeker/pay-per-features" element={<PrivateRoute roles={['jobseeker']}><PayPerFeatures /></PrivateRoute>} />

        <Route
          path="/company/settings"
          element={
            <PrivateRoute roles={['recruiter', 'company', 'college']}>
              <RecruiterSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/post-job"
          element={
            <PrivateRoute roles={['recruiter', 'company', 'college']}>
              <PostJob />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/applicants/:jobId"
          element={
            <PrivateRoute roles={['recruiter', 'company', 'college']}>
              <Applicants />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/subscription"
          element={
            <PrivateRoute roles={['recruiter', 'company', 'college']}>
              <CompanySubscription />
            </PrivateRoute>
          }
        />
        <Route path="/company/jobs" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><MyJobs /></PrivateRoute>} />
        <Route path="/company/candidate-search" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><CandidateSearch /></PrivateRoute>} />
        <Route path="/company/requests" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><AssignedRequests /></PrivateRoute>} />
        <Route path="/company/ats-pipeline" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><FeatureGate featureKey="hasATSPipeline" subscriptionPath="/company/subscription"><AtsPipeline /></FeatureGate></PrivateRoute>} />
        <Route path="/company/analytics" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><FeatureGate featureKey="hasAnalyticsDashboard" subscriptionPath="/company/subscription"><Analytics /></FeatureGate></PrivateRoute>} />
        <Route path="/company/bulk-messaging" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><FeatureGate featureKey="hasBulkMessaging" subscriptionPath="/company/subscription"><BulkMessaging /></FeatureGate></PrivateRoute>} />
        <Route path="/company/bulk-applications" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><FeatureGate featureKey="hasBulkApplicantManagement" subscriptionPath="/company/subscription"><BulkApplicantManagement /></FeatureGate></PrivateRoute>} />
        <Route path="/company/profile-management" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><CompanyProfileManagement /></PrivateRoute>} />
        <Route path="/company/team" element={<PrivateRoute roles={['company']}><MyTeam /></PrivateRoute>} />
        <Route path="/company/video-interview" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><FeatureGate featureKey="hasInterviewScheduling" subscriptionPath="/company/subscription"><VideoInterview /></FeatureGate></PrivateRoute>} />
        <Route path="/company/interview-scheduling" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><FeatureGate featureKey="hasInterviewScheduling" subscriptionPath="/company/subscription"><InterviewScheduling /></FeatureGate></PrivateRoute>} />
        <Route path="/company/ai-matching" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><FeatureGate featureKey="hasAICandidateMatching" subscriptionPath="/company/subscription"><AICandidateMatching /></FeatureGate></PrivateRoute>} />
        <Route path="/company/messages" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><Messages /></PrivateRoute>} />
        <Route path="/company/drive-requests" element={<PrivateRoute roles={['company']}><DriveRequests /></PrivateRoute>} />
        <Route path="/company/payment-history" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><PaymentHistory /></PrivateRoute>} />
        <Route path="/company/pay-per-features" element={<PrivateRoute roles={['recruiter', 'company', 'college']}><PayPerFeatures /></PrivateRoute>} />
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
        <Route path="/employee/applications" element={<PrivateRoute roles={['org_employee']}><MyApplications /></PrivateRoute>} />
        <Route path="/employee/messages" element={<PrivateRoute roles={['org_employee']}><FeatureGate featureKey="hasMessageRecruiters" subscriptionPath="/jobseeker/subscription"><Messages /></FeatureGate></PrivateRoute>} />
        <Route path="/employee/video-interview" element={<PrivateRoute roles={['org_employee']}><VideoInterview /></PrivateRoute>} />
        <Route path="/employee/interview-scheduling" element={<PrivateRoute roles={['org_employee']}><InterviewScheduling /></PrivateRoute>} />

        {/* College (TPO) */}
        <Route path="/college" element={<PrivateRoute roles={['college']}><CollegeDashboard /></PrivateRoute>} />
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
          path="/admin"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
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
