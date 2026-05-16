import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Briefcase, Building2, FileText, Star, LogOut,
  LayoutDashboard, Users, UserCog, TrendingUp, Bell,
  Activity, CreditCard, ChevronRight,
  Lock, MessageCircle, Video, Layers, BarChart2, Mail,
  BookOpen, Mic, UserCheck, List, History, Sparkles, ClipboardList
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { hasFeature } from '../subscription/FeatureGate';

// ─── Core nav (always visible) ───────────────────────────────────────────────
const coreMenus = {
  jobseeker: [
    { icon: Home,        label: 'Overview',      path: '/jobseeker' },
    { icon: Briefcase,   label: 'Search Jobs',   path: '/jobs' },
    // { icon: Building2,   label: 'Organizations', path: '/companies' },
    { icon: FileText,    label: 'Applications',  path: '/jobseeker/applications' },
    { icon: Star,        label: 'Saved Jobs',    path: '/dashboard/saved-jobs' },
    { icon: CreditCard,  label: 'Subscription',  path: '/jobseeker/subscription' },
    { icon: UserCog,     label: 'Settings',      path: '/jobseeker/settings' },
    { icon: History,     label: 'Payment History', path: '/jobseeker/payment-history' },
  ],
  recruiter: [
    { icon: LayoutDashboard, label: 'Overview',          path: '/company' },
    { icon: List,            label: 'My Jobs',           path: '/company/jobs' },
    { icon: Briefcase,       label: 'Post Job',          path: '/company/post-job' },
    { icon: Users,           label: 'Find Candidates',   path: '/company/candidate-search' },
    { icon: CreditCard,      label: 'Subscription',      path: '/company/subscription' },
    { icon: UserCog,         label: 'Settings',          path: '/company/settings' },
    { icon: History,         label: 'Payment History',   path: '/company/payment-history' },
  ],
  company: [
    { icon: LayoutDashboard, label: 'Overview',          path: '/company' },
    { icon: List,            label: 'My Jobs',           path: '/company/jobs' },
    { icon: Briefcase,       label: 'Post Job',          path: '/company/post-job' },
    { icon: Users,           label: 'Find Candidates',   path: '/company/candidate-search' },
    { icon: CreditCard,      label: 'Subscription',      path: '/company/subscription' },
    { icon: UserCog,         label: 'Settings',          path: '/company/settings' },
    { icon: History,         label: 'Payment History',   path: '/company/payment-history' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Command Center', path: '/admin' },
    { icon: Users,           label: 'Users Account',  path: '/admin/users' },
    { icon: Briefcase,       label: 'Job Inventory',  path: '/admin/jobs' },
    { icon: CreditCard,      label: 'Subscriptions',  path: '/admin/subscriptions' },
    { icon: ClipboardList,   label: 'Requests',       path: '/admin/requests' },
    { icon: History,         label: 'Payment History', path: '/admin/payment-history' },
    { icon: MessageCircle,   label: 'Messages',       path: '/admin/messages' },
  ],
  org_employee: [
    { icon: Home,           label: 'Overview',      path: '/employee' },
    { icon: Briefcase,      label: 'Search Jobs',   path: '/jobs' },
    // { icon: Building2,      label: 'Organizations', path: '/companies' },
    { icon: FileText,       label: 'Applications',  path: '/employee/applications' },
    { icon: Star,           label: 'Saved Jobs',    path: '/dashboard/saved-jobs' },
    { icon: UserCog,        label: 'Settings',      path: '/employee/settings' },
  ],
};

// ─── Premium feature nav per role ────────────────────────────────────────────
const premiumMenus = {
  jobseeker: [
    { icon: FileText,      label: 'Resume Builder',      path: '/jobseeker/resume-builder',      featureKey: 'hasResumeBuilder' },
    { icon: Bell,          label: 'Job Alerts',          path: '/jobseeker/job-alerts',          featureKey: 'jobAlerts' },
    { icon: Users,         label: 'Profile Insights',    path: '/jobseeker/profile-insights',    featureKey: 'hasProfileViewInsights' },
    { icon: Star,          label: 'Career Counselling',  path: '/jobseeker/career-counselling',  featureKey: 'hasCareerCounselling' },
    { icon: Mic,           label: 'Interview Prep',      path: '/jobseeker/interview-prep',      featureKey: 'hasInterviewPrep' },
    { icon: TrendingUp,    label: 'Salary Benchmarking', path: '/jobseeker/salary-benchmarking', featureKey: 'hasSalaryBenchmarking' },
    { icon: BookOpen,      label: 'AI Resume Review',    path: '/jobseeker/ai-resume-review',    featureKey: 'hasAiResumeReview' },
    { icon: MessageCircle, label: 'Direct Messages',     path: '/jobseeker/messages',            featureKey: 'hasMessageRecruiters' },
  ],
  recruiter: [
    { icon: Layers,    label: 'ATS Pipeline',   path: '/company/ats-pipeline',         featureKey: 'hasATSPipeline' },
    { icon: BarChart2, label: 'Analytics',      path: '/company/analytics',            featureKey: 'hasAnalyticsDashboard' },
    { icon: Mail,      label: 'Bulk Messaging', path: '/company/bulk-messaging',       featureKey: 'hasBulkMessaging' },
    { icon: Users,     label: 'Bulk Applications', path: '/company/bulk-applications', featureKey: 'hasBulkApplicantManagement' },
    { icon: Video,     label: 'Video Interview', path: '/company/video-interview',     featureKey: 'hasInterviewScheduling' },
    // { icon: Building2, label: 'Company Profile', path: '/company/profile-management',  featureKey: 'companyProfileType' },
    { icon: Sparkles,  label: 'AI Matching',    path: '/company/ai-matching',          featureKey: 'hasAICandidateMatching' },
    { icon: ClipboardList, label: 'Requests',       path: '/company/requests',             featureKey: 'hasRequests' },
    { icon: MessageCircle, label: 'Messaging',      path: '/company/messages' },
  ],
  company: [
    { icon: Layers,    label: 'ATS Pipeline',   path: '/company/ats-pipeline',         featureKey: 'hasATSPipeline' },
    { icon: BarChart2, label: 'Analytics',      path: '/company/analytics',            featureKey: 'hasAnalyticsDashboard' },
    { icon: Mail,      label: 'Bulk Messaging', path: '/company/bulk-messaging',       featureKey: 'hasBulkMessaging' },
    { icon: Users,     label: 'Bulk Applications', path: '/company/bulk-applications', featureKey: 'hasBulkApplicantManagement' },
    { icon: Video,     label: 'Video Interview', path: '/company/video-interview',     featureKey: 'hasInterviewScheduling' },
    // { icon: Building2, label: 'Company Profile', path: '/company/profile-management',  featureKey: 'companyProfileType' },
    { icon: Sparkles,  label: 'AI Matching',    path: '/company/ai-matching',          featureKey: 'hasAICandidateMatching' },
    { icon: ClipboardList, label: 'Requests',       path: '/company/requests',             featureKey: 'hasRequests' },
    { icon: MessageCircle, label: 'Messaging',      path: '/company/messages' },
  ],
  org_employee: [
    { icon: Video,     label: 'Video Interview', path: '/employee/video-interview',     featureKey: 'hasVideoInterview' },
    { icon: Activity,  label: 'Scheduling',      path: '/employee/interview-scheduling', featureKey: 'hasInterviewScheduling' },
    { icon: MessageCircle, label: 'Messaging',      path: '/employee/messages',             featureKey: 'hasMessageRecruiters' },
  ],
};

const NavItem = ({ item, active }) => {
  const Icon = item.icon;
  return (
    <Link
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
      <span className="text-[11px] uppercase font-bold tracking-widest flex-1">{item.label}</span>
      {active && <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />}
    </Link>
  );
};

const PremiumNavItem = ({ item, active, unlocked }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={`group flex items-center gap-4 px-5 py-3 transition-all rounded-xl relative
        ${active
          ? 'bg-emerald-50 text-emerald-700 font-bold'
          : unlocked
            ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            : 'text-slate-400 hover:bg-slate-50/60'
        }`}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all
        ${active ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 group-hover:text-slate-700'}`}>
        <Icon size={15} strokeWidth={active ? 2.5 : 1.5} />
      </div>
      <span className={`text-[10px] uppercase font-bold tracking-widest flex-1 ${unlocked ? '' : 'opacity-60'}`}>
        {item.label}
      </span>
      {active ? (
        <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
      ) : unlocked ? (
        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-60" />
      ) : (
        <Lock size={10} className="text-slate-300 shrink-0" />
      )}
    </Link>
  );
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || 'jobseeker';

  const coreItems = coreMenus[role] || coreMenus.jobseeker;
  const premiumItems = premiumMenus[role] || [];

  const isActive = (path) => {
    const rootRoutes = ['/jobseeker', '/company', '/admin', '/subadmin', '/employee'];
    if (rootRoutes.includes(path)) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="w-full h-full bg-white border border-slate-200 rounded-[24px] flex flex-col font-sans select-none shadow-sm overflow-y-auto animate-in fade-in slide-in-from-left-4 duration-700">

      {/* Brand */}
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

      {/* User card */}
      <div className="px-6 py-8">
        <div className="p-4 rounded-2xl border border-slate-100 flex items-center gap-4 bg-slate-50/30 group hover:bg-white hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-600/5 transition-all duration-300 cursor-pointer">
          <div className="relative">
            <Avatar className="w-10 h-10 rounded-xl border-2 border-white shadow-sm bg-white">
              <AvatarImage src={user?.avatar} />
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

      {/* Core nav */}
      <div className="flex-1 px-4">
        <div className="space-y-1">
          <div className="px-5 mb-4 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-600 rounded-full" />
            Control Desk
          </div>
          {coreItems.map(item => (
            <NavItem key={item.path} item={item} active={isActive(item.path)} />
          ))}
        </div>

        {/* Premium Features section */}
        {premiumItems.length > 0 && (
          <div className="mt-6 space-y-1">
            <div className="px-5 mb-3 flex items-center gap-2">
              <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">Premium Features</div>
              {(!user?.subscription || user?.subscription?.price === 0) && (
                <Badge className="text-[8px] font-bold bg-amber-50 text-amber-600 border-amber-100 px-1.5 py-0">
                  Upgrade
                </Badge>
              )}
            </div>
            {premiumItems.map(item => {
              const unlocked = hasFeature(user, item.featureKey);
              return (
                <PremiumNavItem
                  key={item.path}
                  item={item}
                  active={isActive(item.path)}
                  unlocked={unlocked}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="px-6 py-8 mt-6 border-t border-slate-50 bg-slate-50/20">
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
