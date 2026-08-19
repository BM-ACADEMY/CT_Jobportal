import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PublicHeader from '../components/common/PublicHeader';
import RecentBlogs from '../components/blog/RecentBlogs';
import PublicSEO from '../components/seo/PublicSEO';

// Public layout used for the landing page — has a header but no sidebar
const PublicLayout = () => {
  const { pathname } = useLocation();
  const showRecentBlogs = pathname === '/jobs' || pathname === '/companies';
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicSEO />
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
        {showRecentBlogs && <RecentBlogs />}
      </main>
    </div>
  );
};

export default PublicLayout;
