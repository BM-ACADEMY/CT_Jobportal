import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import RecentBlogs from '../components/blog/RecentBlogs';
import SEOHead from '../components/seo/SEOHead';

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const showBlogRecommendations = !pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-ui-bg flex flex-col font-sans">
      <SEOHead title="Dashboard | Velaivaaipu" description="Your private Velaivaaipu account dashboard." robots="noindex, nofollow" />
      <Header />
      
      <div className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8 px-4 sm:px-6 py-8">
        {/* Left Sidebar - Hidden on mobile, fixed width on Desktop */}
        <aside className="hidden lg:block w-[280px] flex-shrink-0 sticky top-28 z-10" style={{ height: 'calc(100vh - 7rem)' }}>
          <Sidebar />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
          {showBlogRecommendations && (
            <div className="2xl:hidden mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <RecentBlogs compact />
            </div>
          )}
        </main>

        {showBlogRecommendations && (
          <aside className="hidden 2xl:block w-[250px] flex-shrink-0">
            <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <RecentBlogs compact />
            </div>
          </aside>
        )}
      </div>
      
      {/* Mobile Sidebar Trigger / Quick Actions could go here */}
    </div>
  );
};

export default DashboardLayout;
