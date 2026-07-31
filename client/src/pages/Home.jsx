import React from 'react';
import { useAuth } from '../context/AuthContext';
import HomeGuest from './home/HomeGuest';
import HomeJobseeker from './home/HomeJobseeker';
import HomeRecruiter from './home/HomeRecruiter';
import HomeCollege from './home/HomeCollege';

// Renders a different Home experience depending on who's logged in.
// admin/subadmin/org_employee/drive_incharge have their own dashboards
// elsewhere in the app, so they see the guest/marketing view here.
const HomePage = () => {
  const { user } = useAuth();

  if (!user) return <HomeGuest />;
  if (user.role === 'jobseeker') return <HomeJobseeker />;
  if (user.role === 'recruiter' || user.role === 'company') return <HomeRecruiter />;
  if (user.role === 'college') return <HomeCollege />;
  return <HomeGuest />;
};

export default HomePage;
