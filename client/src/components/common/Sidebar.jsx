import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Building2, BookOpen, ChevronRight, LayoutDashboard,
  Users, UserCog, Settings, FileText, TrendingUp, Star, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const menuConfigs = {
  jobseeker: [
    { icon: Home, label: 'My Home', path: '/jobseeker' },
    { icon: Briefcase, label: 'Browse Jobs', path: '/jobs' },
    { icon: Building2, label: 'Companies', path: '/companies' },
    { icon: FileText, label: 'My Applications', path: '/jobseeker/applications' },
    { icon: Star, label: 'Saved Jobs', path: '/jobseeker/saved' },
    { icon: BookOpen, label: 'Career Advice', path: '/blogs' },
  ],
  recruiter: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/company' },
    { icon: Briefcase, label: 'Post a Job', path: '/company/post-job' },
    { icon: Users, label: 'Applicants', path: '/company/applicants' },
    { icon: TrendingUp, label: 'Analytics', path: '/company/analytics' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Manage Users', path: '/admin/users' },
    { icon: Building2, label: 'Companies', path: '/admin/companies' },
    { icon: TrendingUp, label: 'System Reports', path: '/admin/reports' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ],
  subadmin: [
    { icon: LayoutDashboard, label: 'Overview', path: '/subadmin' },
    { icon: FileText, label: 'Job Moderation', path: '/subadmin/moderation' },
    { icon: Bell, label: 'Reports', path: '/subadmin/reports' },
    { icon: Users, label: 'User Reports', path: '/subadmin/users' },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || 'jobseeker';
  const menuItems = menuConfigs[role] || menuConfigs.jobseeker;

  const isActive = (path) => {
    // Exact match for root dashboard routes to prevent sub-pages from highlighting them
    const rootRoutes = ['/jobseeker', '/company', '/admin', '/subadmin'];
    if (rootRoutes.includes(path)) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full">

      {/* Profile Section */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
           <Avatar className="w-10 h-10 border border-border shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                 {user?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
           </Avatar>
           <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate leading-none">{user?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-1">{user?.email}</p>
           </div>
        </div>

        {role === 'jobseeker' && (
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider leading-none">Strength</span>
               <span className="text-[10px] font-medium text-primary leading-none">{user?.profile?.profileCompletion || 0}%</span>
            </div>
            <Progress value={user?.profile?.profileCompletion || 0} className="h-1.5" />
          </div>
        )}

        {/* Global Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm
                  ${active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <div className={`shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Icon size={18} strokeWidth={active ? 2 : 1.5} />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="mt-auto p-4 bg-muted/20 border-t border-border">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-destructive hover:bg-destructive/10 transition-all text-sm font-medium"
        >
          <LogOut size={18} />
          <span className="flex-1 text-left">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
