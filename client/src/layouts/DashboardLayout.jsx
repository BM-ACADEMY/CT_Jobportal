import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import RecentBlogs from '../components/blog/RecentBlogs';
import SEOHead from '../components/seo/SEOHead';

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const showBlogRecommendations = !pathname.startsWith('/admin');

  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  // Close mobile sidebar on page navigation
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  React.useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  return (
    <div className="min-h-screen bg-[#f4f7fa] flex flex-row font-sans">
      <SEOHead title="Dashboard | Velaivaaipu" description="Your private Velaivaaipu account dashboard." robots="noindex, nofollow" />
      
      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative flex w-[280px] h-full animate-in slide-in-from-left duration-300 bg-[#1b496d]">
            <Sidebar isCollapsed={false} toggleSidebar={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Left Sidebar - Hidden on mobile, fixed width on Desktop */}
      <aside className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'w-[75px]' : 'w-[280px]'} flex-shrink-0 sticky top-0 h-screen z-20 border-r border-slate-100 bg-[#1b496d]`}>
        <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      </aside>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header toggleMobileSidebar={() => setIsMobileOpen(true)} />
        
        <div className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-8 px-4 sm:px-6 py-8">
          <main className="flex-1 min-w-0">
            <Outlet />
            {showBlogRecommendations && (
              <div className="2xl:hidden mt-8 rounded-none border border-slate-200 bg-white p-5 shadow-sm">
                <RecentBlogs compact />
              </div>
            )}
          </main>

          {showBlogRecommendations && (
            <aside className="hidden 2xl:block w-[250px] flex-shrink-0">
              <div className="sticky top-28 rounded-none border border-slate-200 bg-white p-4 shadow-sm">
                <RecentBlogs compact />
              </div>
            </aside>
          )}
        </div>
      </div>
      
      {/* Mobile Sidebar Trigger / Quick Actions could go here */}
    </div>
  );
};

export default DashboardLayout;
