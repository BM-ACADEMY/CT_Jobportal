import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Guards
import { GuestRoute, PrivateRoute } from './ProtectedRoutes';

// Pages
import HomePage from '../pages/Home';
import Jobs from '../pages/Jobs';
import JobDetails from '../pages/JobDetails';
import Companies from '../pages/Companies';
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
import ManageCompanies from '../pages/admin/ManageCompanies';
import ManageJobs from '../pages/admin/ManageJobs';
import ManageSubscriptions from '../pages/admin/ManageSubscriptions';
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

// Company/Recruiter feature pages
import AtsPipeline from '../pages/company/features/AtsPipeline';
import Analytics from '../pages/company/features/Analytics';
import BulkMessaging from '../pages/company/features/BulkMessaging';
import VideoInterview from '../pages/company/features/VideoInterview';
import TeamCollaboration from '../pages/company/features/TeamCollaboration';
import InterviewScheduling from '../pages/company/features/InterviewScheduling';
import AICandidateMatching from '../pages/company/features/AICandidateMatching';
import MyJobs from '../pages/company/MyJobs';

// Org Employee pages
import EmployeeDashboard from '../pages/employee/Dashboard';



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
  };
  return <Navigate to={routes[user.role] || '/jobseeker'} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>

      {/* ── Public Landing Page ───────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/job/:id" element={<JobDetails />} />
        <Route path="/companies" element={<Companies />} />
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
        <Route path="/jobseeker/resume-builder" element={<PrivateRoute roles={['jobseeker']}><ResumeBuilder /></PrivateRoute>} />
        <Route path="/jobseeker/job-alerts" element={<PrivateRoute roles={['jobseeker']}><JobAlerts /></PrivateRoute>} />
        <Route path="/jobseeker/profile-insights" element={<PrivateRoute roles={['jobseeker']}><ProfileInsights /></PrivateRoute>} />
        <Route path="/jobseeker/messages" element={<PrivateRoute roles={['jobseeker']}><Messages /></PrivateRoute>} />
        <Route path="/jobseeker/career-counselling" element={<PrivateRoute roles={['jobseeker']}><CareerCounselling /></PrivateRoute>} />
        <Route path="/jobseeker/interview-prep" element={<PrivateRoute roles={['jobseeker']}><InterviewPrep /></PrivateRoute>} />
        <Route path="/jobseeker/skill-tests" element={<PrivateRoute roles={['jobseeker']}><SkillTests /></PrivateRoute>} />
        <Route path="/jobseeker/salary-benchmarking" element={<PrivateRoute roles={['jobseeker']}><SalaryBenchmarking /></PrivateRoute>} />
        <Route path="/jobseeker/ai-resume-review" element={<PrivateRoute roles={['jobseeker']}><AiResumeReview /></PrivateRoute>} />
        <Route path="/jobseeker/payment-history" element={<PrivateRoute roles={['jobseeker']}><PaymentHistory /></PrivateRoute>} />


        <Route
          path="/company/settings"
          element={
            <PrivateRoute roles={['recruiter', 'company']}>
              <RecruiterSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/post-job"
          element={
            <PrivateRoute roles={['recruiter', 'company']}>
              <PostJob />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/applicants/:jobId"
          element={
            <PrivateRoute roles={['recruiter', 'company']}>
              <Applicants />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/subscription"
          element={
            <PrivateRoute roles={['recruiter', 'company']}>
              <CompanySubscription />
            </PrivateRoute>
          }
        />
        <Route path="/company/jobs" element={<PrivateRoute roles={['recruiter', 'company']}><MyJobs /></PrivateRoute>} />
        <Route path="/company/requests" element={<PrivateRoute roles={['recruiter', 'company']}><AssignedRequests /></PrivateRoute>} />
        <Route path="/company/ats-pipeline" element={<PrivateRoute roles={['recruiter', 'company']}><AtsPipeline /></PrivateRoute>} />
        <Route path="/company/analytics" element={<PrivateRoute roles={['recruiter', 'company']}><Analytics /></PrivateRoute>} />
        <Route path="/company/bulk-messaging" element={<PrivateRoute roles={['recruiter', 'company']}><BulkMessaging /></PrivateRoute>} />
        <Route path="/company/video-interview" element={<PrivateRoute roles={['recruiter', 'company']}><VideoInterview /></PrivateRoute>} />
        <Route path="/company/team" element={<PrivateRoute roles={['recruiter', 'company']}><TeamCollaboration /></PrivateRoute>} />
        <Route path="/company/interview-scheduling" element={<PrivateRoute roles={['recruiter', 'company']}><InterviewScheduling /></PrivateRoute>} />
        <Route path="/company/ai-matching" element={<PrivateRoute roles={['recruiter', 'company']}><AICandidateMatching /></PrivateRoute>} />
        <Route path="/company/messages" element={<PrivateRoute roles={['recruiter', 'company']}><Messages /></PrivateRoute>} />
        <Route path="/company/payment-history" element={<PrivateRoute roles={['recruiter', 'company']}><PaymentHistory /></PrivateRoute>} />
        <Route
          path="/company/*"
          element={
            <PrivateRoute roles={['recruiter', 'company']}>
              <CompanyDashboard />
            </PrivateRoute>
          }
        />

        {/* Org Employee */}
        <Route path="/employee" element={<PrivateRoute roles={['org_employee']}><EmployeeDashboard /></PrivateRoute>} />
        <Route path="/employee/settings" element={<PrivateRoute roles={['org_employee']}><JobSeekerSettings /></PrivateRoute>} />
        <Route path="/employee/applications" element={<PrivateRoute roles={['org_employee']}><MyApplications /></PrivateRoute>} />
        <Route path="/employee/messages" element={<PrivateRoute roles={['org_employee']}><Messages /></PrivateRoute>} />
        <Route path="/employee/video-interview" element={<PrivateRoute roles={['org_employee']}><VideoInterview /></PrivateRoute>} />
        <Route path="/employee/interview-scheduling" element={<PrivateRoute roles={['org_employee']}><InterviewScheduling /></PrivateRoute>} />

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
          path="/admin/companies"
          element={
            <PrivateRoute roles={['admin']}>
              <ManageCompanies />
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
          path="/admin/subscriptions"
          element={
            <PrivateRoute roles={['admin']}>
              <ManageSubscriptions />
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
