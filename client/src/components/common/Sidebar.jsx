import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Briefcase, Building2, BookOpen, ChevronRight, LayoutDashboard,
  Users, UserCog, Settings, FileText, TrendingUp, Star, Bell, LogOut,
  ShieldCheck, CircleUser
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const menuConfigs = {
  jobseeker: [
    { icon: Home, label: 'My Home', path: '/jobseeker' },
    { icon: Briefcase, label: 'Browse Jobs', path: '/jobs' },
    { icon: Building2, label: 'Companies', path: '/companies' },
    { icon: FileText, label: 'My Applications', path: '/jobseeker/applications' },
    { icon: Star, label: 'Saved Jobs', path: '/dashboard/saved-jobs' },
    { icon: BookOpen, label: 'Career Advice', path: '/blogs' },
  ],
  recruiter: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/company' },
    { icon: Star, label: 'Saved Jobs', path: '/dashboard/saved-jobs' },
    { icon: Briefcase, label: 'Post a Job', path: '/company/post-job' },
    { icon: Users, label: 'Applicants', path: '/company/applicants' },
    { icon: TrendingUp, label: 'Analytics', path: '/company/analytics' },
    { icon: Settings, label: 'Settings', path: '/company/settings' },
  ],
  company: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/company' },
    { icon: Star, label: 'Saved Jobs', path: '/dashboard/saved-jobs' },
    { icon: Briefcase, label: 'Post a Job', path: '/company/post-job' },
    { icon: Users, label: 'Applicants', path: '/company/applicants' },
    { icon: TrendingUp, label: 'Analytics', path: '/company/analytics' },
    { icon: Settings, label: 'Settings', path: '/company/settings' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Star, label: 'Saved Jobs', path: '/dashboard/saved-jobs' },
    { icon: Users, label: 'Manage Users', path: '/admin/users' },
    { icon: Building2, label: 'Companies', path: '/admin/companies' },
    { icon: TrendingUp, label: 'System Reports', path: '/admin/reports' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ],
  subadmin: [
    { icon: LayoutDashboard, label: 'Overview', path: '/subadmin' },
    { icon: Star, label: 'Saved Jobs', path: '/dashboard/saved-jobs' },
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
    const rootRoutes = ['/jobseeker', '/company', '/admin', '/subadmin'];
    if (rootRoutes.includes(path)) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="w-full h-full bg-white border-r border-slate-200 flex flex-col shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
      
      {/* Brand / Role Section */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Briefcase size={18} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 uppercase">
            CT <span className="text-emerald-600">Portal</span>
          </span>
        </div>
      </div>

      {/* User Profile Summary */}
      <div className="px-6 mb-6">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 border-white shadow-sm shrink-0">
            <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">{role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Main Menu</p>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm relative
                  ${active
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                {active && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-600" />
                )}
                <div className={`${active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {role === 'jobseeker' && (
          <div className="mt-8 px-4">
             <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Profile Strength</p>
             <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold">
                   <span className="text-slate-600">{user?.profile?.profileCompletion || 0}% Complete</span>
                </div>
                <Progress 
                  value={user?.profile?.profileCompletion || 0} 
                  className="h-1.5 bg-slate-100" 
                  indicatorClassName="bg-emerald-600"
                />
             </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 mt-auto border-t border-slate-100">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-bold group"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
            <LogOut size={16} />
          </div>
          <span className="flex-1 text-left">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

