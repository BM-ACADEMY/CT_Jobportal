import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Briefcase, Building2, FileText, Star, LogOut,
  LayoutDashboard, Users, UserCog, TrendingUp, Bell,
  Activity, CreditCard, ChevronRight,
  Lock, MessageCircle, Video, Layers, BarChart2, Mail,
  BookOpen, Mic, UserCheck, List, History, Sparkles, ClipboardList, ShieldCheck, Headphones, MessageSquareQuote, ShoppingBag, Settings, GraduationCap, QrCode
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { findPermissionKeyForPath } from '../../config/teamPermissions';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { hasFeature } from '../subscription/FeatureGate';

// ─── Core nav (always visible) ───────────────────────────────────────────────
const coreMenus = {
  jobseeker: [
    { icon: Home,        label: 'Overview',      path: '/jobseeker' },
    { icon: Briefcase,   label: 'Search Jobs',   path: '/jobs' },
    { icon: Building2,   label: 'Organizations', path: '/companies' },
    { icon: FileText,    label: 'Applications',  path: '/jobseeker/applications' },
    { icon: GraduationCap, label: 'Campus Drives', path: '/jobseeker/campus-drives' },
    { icon: Star,        label: 'Saved Jobs',    path: '/dashboard/saved-jobs' },
    { icon: CreditCard,  label: 'Subscription',  path: '/jobseeker/subscription' },
    { icon: ShoppingBag, label: 'Pay-per Features', path: '/jobseeker/pay-per-features' },
    { icon: History,     label: 'Payment History', path: '/jobseeker/payment-history' },
    { icon: Headphones,  label: 'Tickets & Queries', path: '/tickets/my' },
    { icon: MessageSquareQuote, label: 'Write a Review', path: '/write-review' },
  ],
  recruiter: [
    { icon: LayoutDashboard, label: 'Overview',          path: '/company' },
    { icon: List,            label: 'My Jobs',           path: '/company/jobs' },
    { icon: Briefcase,       label: 'Post Job',          path: '/company/post-job' },
    { icon: Users,           label: 'Find Candidates',   path: '/company/candidate-search' },
    { icon: ClipboardList,   label: 'Requests',          path: '/company/requests' },
    { icon: CreditCard,      label: 'Subscription',      path: '/company/subscription' },
    { icon: ShoppingBag,     label: 'Pay-per Features',  path: '/company/pay-per-features' },
    { icon: History,         label: 'Payment History',   path: '/company/payment-history' },
    { icon: Headphones,      label: 'Tickets & Queries', path: '/tickets/my' },
    { icon: MessageSquareQuote, label: 'Write a Review', path: '/write-review' },
  ],
  company: [
    { icon: LayoutDashboard, label: 'Overview',          path: '/company' },
    { icon: List,            label: 'My Jobs',           path: '/company/jobs' },
    { icon: Briefcase,       label: 'Post Job',          path: '/company/post-job' },
    { icon: Users,           label: 'Find Candidates',   path: '/company/candidate-search' },
    { icon: UserCog,         label: 'My Team',           path: '/company/team' },
    { icon: ClipboardList,   label: 'Requests',          path: '/company/requests' },
    { icon: CreditCard,      label: 'Subscription',      path: '/company/subscription' },
    { icon: ShoppingBag,     label: 'Pay-per Features',  path: '/company/pay-per-features' },
    { icon: History,         label: 'Payment History',   path: '/company/payment-history' },
    { icon: Headphones,      label: 'Tickets & Queries', path: '/tickets/my' },
    { icon: MessageSquareQuote, label: 'Write a Review', path: '/write-review' },
  ],
  college: [
    { icon: LayoutDashboard, label: 'Overview',          path: '/college' },
    { icon: Users,           label: 'Students',          path: '/college/students' },
    { icon: Activity,        label: 'Campus Drives',     path: '/college/drives' },
    { icon: ShieldCheck,     label: 'ID Verification',   path: '/college/verification' },
    { icon: FileText,        label: 'Reports & Passkey', path: '/college/reports' },
    { icon: CreditCard,      label: 'Subscription',      path: '/college/subscription' },
    { icon: History,         label: 'Payment History',   path: '/college/payment-history' },
    { icon: Settings,        label: 'Settings & Proof',  path: '/college/settings' },
    { icon: Headphones,      label: 'Tickets & Queries', path: '/tickets/my' },
    { icon: MessageSquareQuote, label: 'Write a Review', path: '/write-review' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Command Center', path: '/admin' },
    { icon: Users,           label: 'Users Account',  path: '/admin/users' },
    { icon: Briefcase,       label: 'Job Inventory',  path: '/admin/jobs' },
    { icon: GraduationCap,   label: 'College KYC',    path: '/admin/colleges' },
    {
      icon: CreditCard,
      label: 'Subscriptions',
      path: '/admin/subscriptions',
      children: [
        { label: 'Plans', path: '/admin/subscriptions/plans' },
        { label: 'Renewals', path: '/admin/subscriptions/renewals' },
        { label: 'Buyers', path: '/admin/subscriptions/buyers' },
        { label: 'Pay-per System', path: '/admin/subscriptions/pay-per' },
        { label: 'Coupons', path: '/admin/subscriptions/coupons' }
      ]
    },
    { icon: ClipboardList,   label: 'Requests',       path: '/admin/requests' },
    { icon: History,         label: 'Payment History', path: '/admin/payment-history' },
    { icon: MessageCircle,   label: 'Messages',       path: '/admin/messages' },
    { icon: Headphones,      label: 'Tickets & Queries', path: '/admin/tickets' },
    { icon: MessageSquareQuote, label: 'Manage Reviews', path: '/admin/reviews' },
  ],
  org_employee: [
    { icon: Home,           label: 'Overview',      path: '/employee' },
    { icon: Briefcase,      label: 'Search Jobs',   path: '/jobs' },
    { icon: Building2,      label: 'Organizations', path: '/companies' },
    { icon: FileText,       label: 'Applications',  path: '/employee/applications' },
    { icon: Star,           label: 'Saved Jobs',    path: '/dashboard/saved-jobs' },
    { icon: Headphones,     label: 'Tickets & Queries', path: '/tickets/my' },
    { icon: MessageSquareQuote, label: 'Write a Review', path: '/write-review' },
  ],
};

// ─── Premium feature nav per role ────────────────────────────────────────────
const premiumMenus = {
  jobseeker: [
    { icon: FileText,      label: 'Resume Builder',      path: '/jobseeker/resume-builder',      featureKey: 'hasResumeBuilder' },
    { icon: Bell,          label: 'Job Alerts',          path: '/jobseeker/job-alerts',          featureKey: 'jobAlerts' },
    { icon: Sparkles,      label: 'Take Assessment',     path: '/jobseeker/skill-tests' },
    { icon: Users,         label: 'Profile Insights',    path: '/jobseeker/profile-insights',    featureKey: 'hasProfileViewInsights' },
    { icon: Star,          label: 'Career Counselling',  path: '/jobseeker/career-counselling',  featureKey: 'hasCareerCounselling' },
    { icon: Mic,           label: 'Mock Interviews',     path: '/jobseeker/mock-interviews',     featureKey: 'hasMockInterviews' },
    { icon: BookOpen,      label: 'AI Profile Review',    path: '/jobseeker/ai-resume-review',    featureKey: 'hasAiResumeReview' },
    { icon: MessageCircle, label: 'Direct Messages',     path: '/jobseeker/messages',            featureKey: 'hasMessageRecruiters' },
  ],
  recruiter: [
    { icon: Layers,    label: 'ATS Pipeline',   path: '/company/ats-pipeline',         featureKey: 'hasATSPipeline' },
    { icon: BarChart2, label: 'Analytics',      path: '/company/analytics',            featureKey: 'hasAnalyticsDashboard' },
    { icon: Mail,      label: 'Bulk Messaging', path: '/company/bulk-messaging',       featureKey: 'hasBulkMessaging' },
    { icon: Video,     label: 'Video Interview', path: '/company/video-interview',     featureKey: 'hasInterviewScheduling' },
    { icon: MessageCircle, label: 'Messaging',      path: '/company/messages' },
  ],
  company: [
    { icon: Layers,    label: 'ATS Pipeline',   path: '/company/ats-pipeline',         featureKey: 'hasATSPipeline' },
    { icon: BarChart2, label: 'Analytics',      path: '/company/analytics',            featureKey: 'hasAnalyticsDashboard' },
    { icon: Mail,      label: 'Bulk Messaging', path: '/company/bulk-messaging',       featureKey: 'hasBulkMessaging' },
    { icon: Video,     label: 'Video Interview', path: '/company/video-interview',     featureKey: 'hasInterviewScheduling' },
    { icon: MessageCircle, label: 'Messaging',      path: '/company/messages' },
    { icon: ClipboardList, label: 'Campus Drive Requests', path: '/company/drive-requests' },
  ],
  college: [
    { icon: BarChart2, label: 'Reports',            path: '/college/reports',       featureKey: 'hasAnalyticsDashboard' },
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

const CollapsibleNavItem = ({ item, location }) => {
  const [isOpen, setIsOpen] = React.useState(() => {
    return (item.children || []).some(child => location.pathname === child.path || location.pathname.startsWith(child.path + '/'));
  });

  const Icon = item.icon;
  const isAnyChildActive = (item.children || []).some(child => location.pathname === child.path || location.pathname.startsWith(child.path + '/'));

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full group flex items-center gap-4 px-5 py-3.5 transition-all rounded-xl relative text-left
          ${isAnyChildActive
            ? 'bg-slate-50/50 text-slate-800 font-bold'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
      >
        <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all
          ${isAnyChildActive ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 group-hover:text-slate-900'}`}>
          <Icon size={16} strokeWidth={isAnyChildActive ? 2.5 : 1.5} />
        </div>
        <span className="text-[11px] uppercase font-bold tracking-widest flex-1">{item.label}</span>
        <ChevronRight
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90 text-emerald-600' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="pl-6 pr-2 py-1 space-y-1 border-l-2 border-slate-100 ml-9">
          {(item.children || []).map(child => {
            const childActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/');
            return (
              <Link
                key={child.path}
                to={child.path}
                className={`group flex items-center gap-2.5 px-3 py-2 transition-all rounded-lg text-xs font-semibold
                  ${childActive
                    ? 'text-emerald-700 font-bold bg-emerald-50/50'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <span className="flex-1 text-[10px] uppercase tracking-wider">{child.label}</span>
                {childActive && <div className="w-1 h-1 bg-emerald-600 rounded-full" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
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
  const profileCompletion = user?.profile?.profileCompletion || 0;

  let coreItems = [...(coreMenus[role] || [])];

  // If role is strictly drive_incharge, they get Manage Drive as their only core item
  if (role === 'drive_incharge') {
    if (!coreItems.find(i => i.path === '/incharge')) {
      coreItems.push({ icon: QrCode, label: 'Manage Drive', path: '/incharge' });
    }
  } else if (user?.hasInchargeDrives) {
    // If they have another role but also manage drives, append Manage Drive to their menu
    if (!coreItems.find(i => i.path === '/incharge')) {
      coreItems.push({ icon: QrCode, label: 'Manage Drive', path: '/incharge' });
    }
  }

  // A team-managed recruiter (delegated by an org admin, not the owner or a solo recruiter)
  // only sees nav entries for pages their admin has actually granted.
  const isPermissionBlocked = (path) => {
    if (!(role === 'recruiter' && user?.isTeamManaged === true)) return false;
    const key = findPermissionKeyForPath(path);
    return key ? !(user.teamPermissions || []).includes(key) : false;
  };
  coreItems = coreItems.filter(i => !isPermissionBlocked(i.path));

  const premiumItems = (premiumMenus[role] || []).filter(i => !isPermissionBlocked(i.path));

  const isActive = (path) => {
    const rootRoutes = ['/jobseeker', '/company', '/admin', '/subadmin', '/employee', '/college', '/incharge'];
    if (rootRoutes.includes(path)) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="w-full h-full bg-white border border-slate-200 rounded-[24px] flex flex-col font-sans select-none shadow-sm overflow-y-auto">

      {/* Brand */}
      <div className="p-8 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Activity size={16} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">
            Velaivaai<span className="text-emerald-600">pu</span>
          </span>
        </div>
        <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border-slate-100 text-slate-400 bg-slate-50/50">
          v2.4
        </Badge>
      </div>

      {/* User card */}
      <div className="px-6 pt-8 pb-4">
        <div onClick={() => {
            const routes = { 
                jobseeker: '/jobseeker/settings', 
                recruiter: '/company/settings',
                company: '/company/settings',
                college: '/college/settings',
                admin: '/admin/settings',
                subadmin: '/subadmin/settings',
                org_employee: '/employee/settings'
            };
            navigate(routes[role] || '/jobseeker/settings');
        }} className="p-4 rounded-2xl border border-slate-100 flex items-center gap-4 bg-slate-50/30 group hover:bg-white hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-600/5 transition-all duration-300 cursor-pointer">
          <div className="relative">
            <Avatar className="w-10 h-10 rounded-xl border-2 border-white shadow-sm bg-white">
              {user?.avatar && (
                  <AvatarImage 
                      src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_DOMAIN}${user.avatar}`} 
                      className="object-cover" 
                  />
              )}
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

      {/* Profile Completion for Jobseekers */}
      {role === 'jobseeker' && (
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-2xl p-4 border border-emerald-100/50 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-200/20 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-teal-200/20 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2.5 relative z-10">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={12} className="text-emerald-600" />
                Profile Score
              </span>
              <span className="text-xs font-black text-emerald-700">{profileCompletion}%</span>
            </div>
            
            <div className="h-1.5 w-full bg-emerald-100/60 rounded-full overflow-hidden relative z-10 mb-2.5">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            
            <p className="text-[10px] font-medium text-emerald-700/80 leading-relaxed relative z-10">
              {profileCompletion === 100 
                ? "Excellent! Your profile is fully optimized for top recruiters."
                : "Reach 100% to boost your visibility to recruiters by up to 3x."}
            </p>
            {profileCompletion < 100 && (
              <button onClick={() => navigate('/jobseeker/settings')} className="mt-2.5 w-full py-1.5 rounded-lg bg-white/60 hover:bg-white text-emerald-700 text-[10px] font-bold transition-colors border border-emerald-200/50 relative z-10">
                Complete Profile
              </button>
            )}
          </div>
        </div>
      )}

      {/* Core nav */}
      <div className="flex-1 px-4">
        <div className="space-y-1">
          <div className="px-5 mb-4 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
            <div className="w-1 h-1 bg-emerald-600 rounded-full" />
            Control Desk
          </div>
          {coreItems.map(item => {
            if (item.children) {
              return (
                <CollapsibleNavItem key={item.path} item={item} location={location} />
              );
            }
            return (
              <NavItem key={item.path} item={item} active={isActive(item.path)} />
            );
          })}
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
              const unlocked = !item.featureKey || hasFeature(user, item.featureKey);
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

      {role === 'drive_incharge' && (
        <div className="px-6 mt-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-2xl p-4 border border-emerald-100/50 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-200/20 rounded-full blur-xl pointer-events-none" />
            <h3 className="text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-2 relative z-10">
              Unlock Features
            </h3>
            <p className="text-[10px] font-medium text-emerald-700/80 leading-relaxed relative z-10 mb-3">
              Register fully to post jobs, apply for jobs, and access the complete platform.
            </p>
            <button
              onClick={() => navigate('/complete-social-profile')}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all shadow-sm shadow-emerald-600/20 relative z-10"
            >
              Complete Registration
            </button>
          </div>
        </div>
      )}

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
