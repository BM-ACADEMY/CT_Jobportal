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
import LoginPage from '../pages/auth/Login';
import RegisterPage from '../pages/auth/Register';
import VerifyOtpPage from '../pages/auth/VerifyOtp';
import ForgotPasswordPage from '../pages/auth/ForgotPassword';
import SocialAuthSuccess from '../pages/auth/SocialAuthSuccess';
import JobSeekerDashboard from '../pages/jobseeker/Dashboard';
import AdminDashboard from '../pages/admin/Dashboard';
import CompanyDashboard from '../pages/company/Dashboard';
import RecruiterSettings from '../pages/company/Settings';
import PostJob from '../pages/company/PostJob';
import SubAdminDashboard from '../pages/subadmin/Dashboard';
import JobSeekerSettings from '../pages/jobseeker/Settings';


// Role-based redirect after login
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const routes = {
    admin: '/admin',
    subadmin: '/subadmin',
    recruiter: '/company',
    jobseeker: '/jobseeker',
  };
  return <Navigate to={routes[user.role] || '/jobseeker'} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>

      {/* ── Public Landing Page ───────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
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
        {/* Job Seeker */}
        <Route
          path="/jobseeker/*"
          element={
            <PrivateRoute roles={['jobseeker']}>
              <JobSeekerDashboard />
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
          path="/company/profile"
          element={
            <PrivateRoute roles={['recruiter']}>
              <RecruiterSettings />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/post-job"
          element={
            <PrivateRoute roles={['recruiter']}>
              <PostJob />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/*"
          element={
            <PrivateRoute roles={['recruiter']}>
              <CompanyDashboard />
            </PrivateRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
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
