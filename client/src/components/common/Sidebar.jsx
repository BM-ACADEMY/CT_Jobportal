import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Briefcase, Building2, BookOpen, ChevronRight, LayoutDashboard,
  Users, UserCog, Settings, FileText, TrendingUp, Star, Bell, LogOut,
  ShieldCheck, CircleUser, Activity, CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const menuConfigs = {
  jobseeker: [
    { icon: Home, label: 'Overview', path: '/jobseeker' },
    { icon: Briefcase, label: 'Search Jobs', path: '/jobs' },
    { icon: Building2, label: 'Organizations', path: '/companies' },
    { icon: FileText, label: 'Applications', path: '/jobseeker/applications' },
    { icon: Star, label: 'Registry', path: '/dashboard/saved-jobs' },
    { icon: CreditCard, label: 'Subscription', path: '/jobseeker/subscription' },
  ],
  recruiter: [
    { icon: LayoutDashboard, label: 'Statistics', path: '/company' },
    { icon: Briefcase, label: 'Publish Job', path: '/company/post-job' },
    { icon: Users, label: 'Candidates', path: '/company/applicants' },
    { icon: Activity, label: 'Metrics', path: '/company/analytics' },
    { icon: CreditCard, label: 'Subscription', path: '/company/subscription' },
  ],
  company: [
    { icon: LayoutDashboard, label: 'Corporate Desk', path: '/company' },
    { icon: Briefcase, label: 'New Listing', path: '/company/post-job' },
    { icon: Users, label: 'Talent Pool', path: '/company/applicants' },
    { icon: TrendingUp, label: 'Performance', path: '/company/analytics' },
    { icon: CreditCard, label: 'Subscription', path: '/company/subscription' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Command Center', path: '/admin' },
    { icon: Users, label: 'Users Account', path: '/admin/users' },
    { icon: Briefcase, label: 'Job Inventory', path: '/admin/jobs' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
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
    <aside className="w-full h-fit bg-white border border-slate-200 rounded-[24px] flex flex-col font-sans select-none shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4 duration-700">
      
      {/* Brand Section - Premium & Minimalist */}
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Activity size={16} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">
            CT <span className="text-emerald-600">Portal</span>
          </span>
        </div>
        <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border-slate-100 text-slate-400 bg-slate-50/50">
          v2.4
        </Badge>
      </div>

      {/* User Context - Premium Profile Card */}
      <div className="px-6 py-8">
        <div className="p-4 rounded-2xl border border-slate-100 flex items-center gap-4 bg-slate-50/30 group hover:bg-white hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-600/5 transition-all duration-300 cursor-pointer">
          <div className="relative">
            <Avatar className="w-10 h-10 rounded-xl border-2 border-white shadow-sm bg-white">
              <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold text-xs">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate tracking-tight">{user?.name || 'Authorized User'}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">{role} Access</p>
          </div>
          <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </div>
      </div>

      {/* Navigation Layer */}
      <div className="flex-1 px-4 pb-8">
        <div className="space-y-1">
          <div className="px-5 mb-4 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-600 rounded-full" />
            Control Desk
          </div>
          {menuItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-4 px-5 py-3.5 transition-all rounded-xl relative
                  ${active
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all
                  ${active ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 group-hover:text-slate-900'}`}>
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.5} />
                </div>
                <span className="text-[11px] uppercase font-bold tracking-widest">{item.label}</span>
                {active && (
                   <div className="ml-auto w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Control Actions */}
      <div className="px-6 py-8 border-t border-slate-50 bg-slate-50/20">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center justify-between px-5 py-4 w-full rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 border border-transparent transition-all duration-300 group"
        >
          <div className="flex items-center gap-4">
            <LogOut size={16} strokeWidth={2} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Terminate Session</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-rose-500 transition-colors" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
