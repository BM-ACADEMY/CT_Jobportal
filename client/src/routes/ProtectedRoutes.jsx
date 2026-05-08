import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const Loader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
    <Loader2 className="h-10 w-10 text-primary animate-spin" />
    <span className="text-sm font-black text-muted-foreground uppercase tracking-widest animate-pulse">Loading experience...</span>
  </div>
);

// Redirect logged-in users away from login/register to their dashboard
export const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (user) {
    const roleRedirects = { admin: '/admin', subadmin: '/subadmin', recruiter: '/company', jobseeker: '/jobseeker' };
    return <Navigate to={roleRedirects[user.role] || '/jobseeker'} replace />;
  }
  return children;
};

// Protect authenticated routes. If roles provided, also enforces role check.
export const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const roleRedirects = { admin: '/admin', subadmin: '/subadmin', recruiter: '/company', jobseeker: '/jobseeker' };
    return <Navigate to={roleRedirects[user.role] || '/jobseeker'} replace />;
  }
  return children;
};
