import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Briefcase, Building2, FileText, Star, LogOut,
  LayoutDashboard, Users, UserCog, TrendingUp, Bell,
  Activity, CreditCard, ChevronRight, ChevronLeft, PanelLeftClose, PanelLeftOpen,
  Lock, MessageCircle, Video, Layers, BarChart2, Mail,
  BookOpen, Mic, UserCheck, List, History, Sparkles, ClipboardList, ShieldCheck, Headphones, MessageSquareQuote, ShoppingBag, Settings, GraduationCap, QrCode, BadgeCheck, CalendarDays, ListChecks, Wallet, MessageSquareHeart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { findPermissionKeyForPath } from '../../config/teamPermissions';
import { staffMenuFor } from '../../config/staffPermissions';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, taglineFor } from '../../data/microcopy';
import { hasFeature } from '../subscription/FeatureGate';

// ─── Core nav (always visible) ───────────────────────────────────────────────
const coreMenus = {
  jobseeker: [
    { icon: Home,        label: 'Dashboard',      path: '/candidate' },
    { icon: Briefcase,   label: 'Find Jobs',   path: '/jobs' },
    { icon: Building2,   label: 'Companies', path: '/companies' },
    { icon: FileText,    label: 'My Applications',  path: '/candidate/applications' },
    { icon: GraduationCap, label: 'Campus Drives', path: '/candidate/campus-drives' },
    { icon: Star,        label: 'Saved Jobs',    path: '/dashboard/saved-jobs' },
    { icon: CreditCard,  label: 'My Plan',  path: '/candidate/subscription' },
    { icon: ShoppingBag, label: 'Buy Extras', path: '/candidate/pay-per-features' },
    { icon: History,     label: 'Payment History', path: '/candidate/payment-history' },
    { icon: Headphones,  label: 'Help & Support', path: '/tickets/my' },
    { icon: MessageSquareQuote, label: 'Review Velaivaaipu', path: '/write-review' },
  ],
  recruiter: [
    { icon: LayoutDashboard, label: 'Dashboard',          path: '/company/dashboard' },
    { icon: List,            label: 'My Jobs',           path: '/company/jobs' },
    { icon: Briefcase,       label: 'Post Job',          path: '/company/jobs/new' },
    { icon: Users,           label: 'Search Candidates',   path: '/company/candidates' },
    { icon: CalendarDays,    label: 'Walk-in Drives',    path: '/company/drives' },
    { icon: ClipboardList,   label: 'Requests',          path: '/company/requests' },
    { icon: CreditCard,      label: 'My Plan',      path: '/company/subscription' },
    { icon: History,         label: 'Payment History',   path: '/company/payment-history' },
    { icon: Headphones,      label: 'Help & Support', path: '/tickets/my' },
    { icon: MessageSquareQuote, label: 'Review Velaivaaipu', path: '/write-review' },
  ],
  company: [
    { icon: LayoutDashboard, label: 'Dashboard',          path: '/company/dashboard' },
    { icon: List,            label: 'My Jobs',           path: '/company/jobs' },
    { icon: Briefcase,       label: 'Post Job',          path: '/company/jobs/new' },
    { icon: Users,           label: 'Search Candidates',   path: '/company/candidates' },
    { icon: UserCog,         label: 'My Team',           path: '/company/team' },
    { icon: CalendarDays,    label: 'Walk-in Drives',    path: '/company/drives' },
    { icon: ClipboardList,   label: 'Requests',          path: '/company/requests' },
    { icon: CreditCard,      label: 'My Plan',      path: '/company/subscription' },
    { icon: History,         label: 'Payment History',   path: '/company/payment-history' },
    { icon: Headphones,      label: 'Help & Support', path: '/tickets/my' },
    { icon: MessageSquareQuote, label: 'Review Velaivaaipu', path: '/write-review' },
  ],
  college: [
    { icon: LayoutDashboard, label: 'Dashboard',          path: '/college/dashboard' },
    { icon: Users,           label: 'Students',          path: '/college/students' },
    { icon: GraduationCap,   label: 'Internships',       path: '/college/internships' },
    { icon: Activity,        label: 'Campus Drives',     path: '/college/drives' },
    { icon: ShieldCheck,     label: 'Student Verification',   path: '/college/verification' },
    { icon: Layers,          label: 'Placement Tools',    path: '/college/placement-tools' },
    { icon: CalendarDays,    label: 'Calendar & Employers', path: '/college/operations' },
    { icon: FileText,        label: 'Reports', path: '/college/reports' },
    { icon: CreditCard,      label: 'My Plan',      path: '/college/subscription' },
    { icon: History,         label: 'Payment History',   path: '/college/payment-history' },
    { icon: Settings,        label: 'College Settings & Documents',  path: '/college/settings' },
    { icon: Headphones,      label: 'Help & Support', path: '/tickets/my' },
    { icon: MessageSquareQuote, label: 'Review Velaivaaipu', path: '/write-review' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Command Center', path: '/admin/dashboard', group: 'Daily' },
    { icon: ListChecks,      label: 'Needs action',   path: '/admin/needs-action', group: 'Daily' },
    { icon: ClipboardList,   label: 'Requests',       path: '/admin/requests', group: 'Daily' },
    { icon: MessageCircle,   label: 'WhatsApp', path: '/admin/whatsapp', group: 'Daily' },
    { icon: Headphones,      label: 'Support Tickets', path: '/admin/tickets', group: 'Daily' },
    { icon: MessageCircle,   label: 'Messages',       path: '/admin/messages', group: 'Daily' },
    { icon: GraduationCap,   label: 'College Verification',    path: '/admin/colleges', group: 'Daily' },
    {
      icon: CreditCard,
      label: 'Subscriptions',
      path: '/admin/subscriptions',
      group: 'Money',
      children: [
        { label: 'Plans', path: '/admin/subscriptions/plans' },
        { label: 'Renewals', path: '/admin/subscriptions/renewals' },
        { label: 'Refunds', path: '/admin/subscriptions/refunds' },
        { label: 'Subscribers', path: '/admin/subscriptions/buyers' },
        { label: 'Pay-per-use Items', path: '/admin/subscriptions/pay-per' },
        { label: 'Coupons', path: '/admin/subscriptions/coupons' },
        { label: 'Job limits', path: '/admin/job-limits' }
      ]
    },
    { icon: History,         label: 'Payment History', path: '/admin/payment-history', group: 'Money' },
    { icon: Wallet,          label: 'Spend and income', path: '/admin/spend', group: 'Money' },
    { icon: Sparkles,        label: 'Business Advisor',   path: '/admin/advisor', group: 'Money' },
    { icon: Users,           label: 'Users',  path: '/admin/users', group: 'Growth' },
    { icon: Briefcase,       label: 'Jobs',  path: '/admin/jobs', group: 'Growth' },
    { icon: CalendarDays,    label: 'Walk-in Drives',   path: '/admin/drives', group: 'Growth' },
    { icon: Activity,        label: 'Daily activity',   path: '/admin/activity', group: 'Growth' },
    { icon: Users,           label: 'Signup sources',   path: '/admin/growth', group: 'Growth' },
    { icon: Users,           label: 'Brand Leads',      path: '/admin/brand-leads', group: 'Growth' },
    { icon: MessageSquareQuote, label: 'Reviews', path: '/admin/reviews', group: 'Growth' },
    { icon: MessageSquareHeart, label: 'Feedback',   path: '/admin/feedback', group: 'Growth' },
    { icon: BookOpen,        label: 'Blog posts',     path: '/admin/blog', group: 'Growth' },
    { icon: BadgeCheck,      label: 'Skill tests',    path: '/admin/skill-tests', group: 'Growth' },
    { icon: ListChecks,      label: 'All Services',     path: '/admin/services', group: 'Setup' },
    { icon: UserCog,         label: 'Staff',          path: '/admin/staff', group: 'Setup' },
    { icon: Settings,        label: 'Settings',       path: '/admin/settings', group: 'Setup' },
  ],
  // A team member added via the "employee" invite flow (role becomes org_employee rather than
  // staying 'recruiter') — same recruiter-shaped workspace as coreMenus.recruiter, just with its
  // own Overview page, since org_employee is functionally a delegated recruiter, not a jobseeker.
  org_employee: [
    { icon: LayoutDashboard, label: 'Dashboard',          path: '/employee' },
    { icon: List,            label: 'My Jobs',           path: '/company/jobs' },
    { icon: Briefcase,       label: 'Post Job',          path: '/company/jobs/new' },
    { icon: Users,           label: 'Search Candidates',   path: '/company/candidates' },
    { icon: ClipboardList,   label: 'Requests',          path: '/company/requests' },
    { icon: CreditCard,      label: 'My Plan',      path: '/company/subscription' },
    { icon: History,         label: 'Payment History',   path: '/company/payment-history' },
    { icon: Headphones,      label: 'Help & Support', path: '/tickets/my' },
    { icon: MessageSquareQuote, label: 'Review Velaivaaipu', path: '/write-review' },
  ],
};

// ─── Premium feature nav per role ────────────────────────────────────────────
const premiumMenus = {
  jobseeker: [
    { icon: FileText,      label: 'Resume Builder',      path: '/candidate/resume-builder',      featureKey: 'hasResumeBuilder' },
    { icon: Bell,          label: 'Job Alerts',          path: '/candidate/job-alerts',          featureKey: 'jobAlerts' },
    { icon: Sparkles,      label: 'Skill Tests',     path: '/candidate/skill-tests' },
    { icon: Users,         label: 'Who Viewed Me',    path: '/candidate/profile-insights',    featureKey: 'hasProfileViewInsights' },
    { icon: Star,          label: 'Career Counselling',  path: '/candidate/career-counselling' },
    { icon: Mic,           label: 'Mock Interviews',     path: '/candidate/mock-interviews',     featureKey: 'hasMockInterviews' },
    { icon: BookOpen,      label: 'AI Resume Review',    path: '/candidate/ai-resume-review',    featureKey: 'hasAiResumeReview' },
    { icon: MessageCircle, label: 'Messages',     path: '/candidate/messages',            featureKey: 'hasMessageRecruiters' },
  ],
  recruiter: [
    { icon: Layers,    label: 'Hiring Pipeline',   path: '/company/ats-pipeline',         featureKey: 'hasATSPipeline' },
    { icon: BarChart2, label: 'Hiring Reports',      path: '/company/analytics',            featureKey: 'hasAnalyticsDashboard' },
    { icon: Mail,      label: 'Message Candidates', path: '/company/bulk-messaging',       featureKey: 'hasBulkMessaging' },
    { icon: Video,     label: 'Interviews', path: '/company/video-interview',     featureKey: 'hasInterviewScheduling' },
    { icon: MessageCircle, label: 'Messages',      path: '/company/messages' },
  ],
  company: [
    { icon: Layers,    label: 'Hiring Pipeline',   path: '/company/ats-pipeline',         featureKey: 'hasATSPipeline' },
    { icon: BarChart2, label: 'Hiring Reports',      path: '/company/analytics',            featureKey: 'hasAnalyticsDashboard' },
    { icon: Mail,      label: 'Message Candidates', path: '/company/bulk-messaging',       featureKey: 'hasBulkMessaging' },
    { icon: Video,     label: 'Interviews', path: '/company/video-interview',     featureKey: 'hasInterviewScheduling' },
    { icon: MessageCircle, label: 'Messages',      path: '/company/messages' },
    { icon: ClipboardList, label: 'Campus Drives', path: '/company/drive-requests' },
  ],
  college: [
    { icon: MessageCircle, label: 'Messages',      path: '/company/messages' },
  ],
  org_employee: [
    { icon: Layers,    label: 'Hiring Pipeline',   path: '/company/ats-pipeline',         featureKey: 'hasATSPipeline' },
    { icon: BarChart2, label: 'Hiring Reports',      path: '/company/analytics',            featureKey: 'hasAnalyticsDashboard' },
    { icon: Mail,      label: 'Message Candidates', path: '/company/bulk-messaging',       featureKey: 'hasBulkMessaging' },
    { icon: Video,     label: 'Interviews', path: '/company/video-interview',     featureKey: 'hasInterviewScheduling' },
    { icon: MessageCircle, label: 'Messages',      path: '/company/messages' },
  ],
};

const NavItem = ({ item, active, isCollapsed }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      title={item.tagline ? (isCollapsed ? `${item.label}: ${item.tagline}` : item.tagline) : (isCollapsed ? item.label : undefined)}
      className={`group flex items-center transition-all rounded-none relative outline-none focus:outline-none
        ${isCollapsed ? 'justify-center p-3' : 'gap-4 px-4 py-3'}
        ${active
          ? 'bg-[#34b678]/25 text-white font-medium'
          : 'text-slate-300 hover:text-[#34b678] hover:bg-white/10'
        }`}
    >
      {active && <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#34b678]" />}
      <div className={`flex items-center justify-center w-5 h-5 transition-all
        ${active ? 'text-white' : 'text-slate-400 group-hover:text-[#34b678]'}`}>
        <Icon size={18} strokeWidth={active ? 2 : 1.5} />
      </div>
      {!isCollapsed && <span className="text-xs font-medium flex-1 tracking-wide">{item.label}</span>}
    </Link>
  );
};

const CollapsibleNavItem = ({ item, location, isCollapsed }) => {
  const [isOpen, setIsOpen] = React.useState(() => {
    return (item.children || []).some(child => location.pathname === child.path || location.pathname.startsWith(child.path + '/'));
  });

  const Icon = item.icon;
  const isAnyChildActive = (item.children || []).some(child => location.pathname === child.path || location.pathname.startsWith(child.path + '/'));

  if (isCollapsed) {
    return (
      <Link
        to={item.path || (item.children && item.children[0]?.path)}
        title={item.label}
        className={`group flex items-center justify-center p-3 transition-all relative rounded-none outline-none focus:outline-none
          ${isAnyChildActive
            ? 'bg-[#34b678]/25 text-white font-medium'
            : 'text-slate-300 hover:text-[#34b678] hover:bg-white/10'
          }`}
      >
        {isAnyChildActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#34b678]" />}
        <div className={`flex items-center justify-center w-5 h-5 transition-all
          ${isAnyChildActive ? 'text-white' : 'text-slate-400 group-hover:text-[#34b678]'}`}>
          <Icon size={18} strokeWidth={isAnyChildActive ? 2 : 1.5} />
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full group flex items-center gap-4 px-4 py-3 transition-all relative text-left rounded-none outline-none focus:outline-none
          ${isAnyChildActive
            ? 'bg-[#34b678]/25 text-white font-medium'
            : 'text-slate-300 hover:text-[#34b678] hover:bg-white/10'
          }`}
      >
        {isAnyChildActive && <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#34b678]" />}
        <div className={`flex items-center justify-center w-5 h-5 transition-all
          ${isAnyChildActive ? 'text-white' : 'text-slate-400 group-hover:text-[#34b678]'}`}>
          <Icon size={18} strokeWidth={isAnyChildActive ? 2 : 1.5} />
        </div>
        <span className="text-xs font-medium flex-1 tracking-wide">{item.label}</span>
        <ChevronRight
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90 text-white' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="pl-10 pr-2 py-1 space-y-1">
          {(item.children || []).map(child => {
            const childActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/');
            return (
              <Link
                key={child.path}
                to={child.path}
                className={`group flex items-center gap-2 py-1.5 transition-all text-xs font-medium relative rounded-none px-3 outline-none focus:outline-none
                  ${childActive
                    ? 'bg-[#34b678]/20 text-white font-medium'
                    : 'text-slate-400 hover:text-[#34b678] hover:bg-white/10'
                  }`}
              >
                {childActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#34b678]" />}
                <span className="absolute left-1 text-slate-500">-</span>
                <span className="flex-1 text-xs tracking-wide">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PremiumNavItem = ({ item, active, unlocked, isCollapsed }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      title={!unlocked ? `${item.label}: not in your current plan. Open it to see what you get and how to upgrade.` : (item.tagline ? (isCollapsed ? `${item.label}: ${item.tagline}` : item.tagline) : (isCollapsed ? item.label : undefined))}
      className={`group flex items-center transition-all relative rounded-none outline-none focus:outline-none
        ${isCollapsed ? 'justify-center p-3' : 'gap-4 px-4 py-3'}
        ${active
          ? 'bg-[#34b678]/25 text-white font-medium'
          : unlocked
            ? 'text-slate-300 hover:text-[#34b678] hover:bg-white/10'
            : 'text-slate-500 hover:bg-white/5'
        }`}
    >
      {active && <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#34b678]" />}
      <div className={`flex items-center justify-center w-5 h-5 transition-all
        ${active ? 'text-white' : 'text-slate-555 group-hover:text-[#34b678]'}`}>
        <Icon size={17} strokeWidth={active ? 2 : 1.5} />
      </div>
      {!isCollapsed && (
        <>
          <span className={`text-xs font-medium flex-1 tracking-wide ${unlocked ? '' : 'opacity-50'}`}>
            {item.label}
          </span>
          {active ? (
            <div className="w-1.5 h-1.5 bg-[#34b678] rounded-full" />
          ) : unlocked ? (
            <div className="w-1.5 h-1.5 bg-[#34b678] rounded-full opacity-60" />
          ) : (
            <Lock size={10} className="text-slate-500 shrink-0" />
          )}
        </>
      )}
    </Link>
  );
};

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || 'jobseeker';
  const profileCompletion = user?.profile?.profileCompletion || 0;

  let coreItems = [...(coreMenus[role] || [])];

  // Platform staff (support, counsellor, college verifier): one entry per area their permissions cover.
  if (role === 'subadmin') {
    const icons = { '/admin/tickets': Headphones, '/admin/users': Users, '/admin/requests': ClipboardList, '/admin/colleges': GraduationCap };
    coreItems = [
      { icon: LayoutDashboard, label: 'Home', path: '/subadmin' },
      ...staffMenuFor(user?.staff?.permissions).map(i => ({ ...i, icon: icons[i.path] || List })),
      { icon: Headphones, label: 'Help & Support', path: '/tickets/my' },
    ];
  }

  // If role is strictly drive_incharge, they get Manage Drive as their only core item
  if (role === 'drive_incharge') {
    if (!coreItems.find(i => i.path === '/incharge')) {
      coreItems.push({ icon: QrCode, label: 'My Drive', path: '/incharge' });
    }
  } else if (user?.hasInchargeDrives) {
    // If they have another role but also manage drives, append Manage Drive to their menu
    if (!coreItems.find(i => i.path === '/incharge')) {
      coreItems.push({ icon: QrCode, label: 'My Drive', path: '/incharge' });
    }
  }

  // Add Blog to core menus for everyone
  if (!coreItems.find(i => i.path === '/blog')) {
    coreItems.push({ icon: BookOpen, label: 'Blog', path: '/blog' });
  }

  // A team-managed recruiter (delegated by an org admin, not the owner or a solo recruiter)
  // only sees nav entries for pages their admin has actually granted. org_employee accounts
  // are NOT granularly gated this way — the "employee" invite type always grants a fixed
  // baseline (see acceptJoinRequest/acceptCompanyInvite forcing permissions to [] for them),
  // so they get the full org_employee menu unconditionally.
  const isPermissionBlocked = (path) => {
    if (!(role === 'recruiter' && user?.isTeamManaged === true)) return false;
    const key = findPermissionKeyForPath(path);
    return key ? !(user.teamPermissions || []).includes(key) : false;
  };
  coreItems = coreItems.filter(i => !isPermissionBlocked(i.path)).map(i => ({ ...i, tagline: taglineFor(role, i.label) }));

  // Delegated team members (not the owner, who already gets the full /company/team management
  // page from coreMenus.company) get a read-only "My Team" roster so they can see who else has
  // access — inserted after Find Candidates, before Requests, matching the owner's menu order.
  const isDelegatedTeamMember = (role === 'recruiter' && user?.isTeamManaged === true) || role === 'org_employee';
  if (isDelegatedTeamMember && !coreItems.find(i => i.path === '/company/team-roster')) {
    const requestsIdx = coreItems.findIndex(i => i.path === '/company/requests');
    const teamItem = { icon: UserCog, label: 'My Team', path: '/company/team-roster' };
    if (requestsIdx === -1) coreItems.push(teamItem);
    else coreItems.splice(requestsIdx, 0, teamItem);
  }

  const premiumItems = (premiumMenus[role] || []).filter(i => !isPermissionBlocked(i.path)).map(i => ({ ...i, tagline: taglineFor(role, i.label) }));

  const isActive = (path) => {
    const exactRoutes = ['/candidate', '/company/dashboard', '/admin/dashboard', '/subadmin', '/employee', '/college/dashboard', '/incharge', '/company/jobs'];
    if (exactRoutes.includes(path)) return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="w-full h-full bg-[#1b496d] flex flex-col font-sans select-none transition-all duration-300">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Brand */}
      <div className={`h-20 px-6 border-b border-white/10 flex items-center shrink-0 bg-white/5 ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
        {!isCollapsed && (
          <Link to="/" className="flex items-center">
            <img src="/velaivaaipu-logo.png" alt="Velaivaaipu" className="h-16 w-auto object-contain brightness-110 filter" />
          </Link>
        )}
        <button 
          onClick={toggleSidebar} 
          className="text-slate-300 hover:text-white transition-colors cursor-pointer p-1.5 focus:outline-none"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Scrollable Content */}
      <div
        className="flex-1 overflow-y-auto no-scrollbar flex flex-col"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {/* User card */}
        <div className={`pt-8 pb-4 shrink-0 ${isCollapsed ? 'px-3' : 'px-6'}`}>
          <div 
            onClick={() => {
                const routes = {
                    jobseeker: '/candidate/settings',
                    recruiter: '/company/settings',
                    company: '/company/settings',
                    college: '/college/settings',
                    admin: '/admin/settings',
                    subadmin: '/subadmin',
                    org_employee: '/employee/settings'
                };
                navigate(routes[role] || '/candidate/settings');
            }} 
            className={`rounded-none border border-white/10 flex items-center bg-white/5 group hover:border-[#34b678]/40 hover:bg-white/10 transition-all duration-300 cursor-pointer ${isCollapsed ? 'justify-center p-2' : 'p-3 gap-3'}`}
          >
            <div className="relative shrink-0">
              <Avatar className="w-8 h-8 rounded-full border border-white/10 shadow-sm bg-white/10">
                <AvatarImage
                    src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_DOMAIN}${user.avatar}`) : '/usericon.png'}
                    className="object-cover"
                />
                <AvatarFallback className="bg-white/10 text-white font-bold text-xs rounded-full">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#1b496d] rounded-full shadow-sm" />}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate tracking-tight flex items-center gap-1">
                    {user?.name || 'Authorized User'}
                    {user?.profileVerificationStatus === 'Verified' && <BadgeCheck size={13} className="text-blue-400 shrink-0" />}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate mt-0.5">{ROLE_LABELS[role] || role}</p>
                </div>
                <ChevronRight size={14} className="text-slate-500 group-hover:text-[#34b678] transition-colors shrink-0" />
              </>
            )}
          </div>
        </div>

        {/* Profile Completion for Jobseekers */}
        {role === 'jobseeker' && !isCollapsed && (
          <div className="px-6 pb-6">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-xl relative overflow-hidden group hover:bg-white/10 transition-all duration-300">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-400/30 transition-colors duration-500" />
              <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-teal-400/20 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-400/30 transition-colors duration-500" />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 drop-shadow-sm">
                  <Activity size={14} className="text-emerald-400" />
                  Profile Score
                </span>
                <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 drop-shadow-sm">{profileCompletion}%</span>
              </div>

              <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden relative z-10 mb-3 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${profileCompletion}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/40 animate-pulse" />
                </div>
              </div>

              <p className="text-[10px] font-medium text-slate-300/90 leading-relaxed relative z-10">
                {profileCompletion === 100
                  ? "Excellent! Your profile is fully optimized for top recruiters."
                  : "Reach 100% to make your profile easier for recruiters to find."}
              </p>
              {profileCompletion < 100 && (
                <button onClick={() => navigate('/candidate/settings')} className="mt-3 w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-[10px] font-bold transition-all border border-emerald-500/30 hover:border-emerald-500/50 relative z-10 shadow-sm backdrop-blur-sm">
                  Complete Profile
                </button>
              )}
            </div>
          </div>
        )}

        {/* Core nav */}
        <div className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className="space-y-1">
            {!isCollapsed ? (
              <div className="px-5 mb-4 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400 flex items-center gap-3">
                <span>Menu</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>
            ) : (
              <div className="h-[1px] bg-white/10 my-4 mx-2" />
            )}
            {coreItems.map((item, idx) => {
              // Admin menu is grouped (Daily, Money, Growth, Setup); other roles have no groups.
              const startsGroup = item.group && item.group !== coreItems[idx - 1]?.group && !isCollapsed;
              const header = startsGroup ? (
                <div key={`g-${item.group}`} className="px-5 pt-4 pb-1 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">{item.group}</div>
              ) : null;
              if (item.children) {
                return (
                  <React.Fragment key={item.path}>
                    {header}
                    <CollapsibleNavItem item={item} location={location} isCollapsed={isCollapsed} />
                  </React.Fragment>
                );
              }
              return (
                <React.Fragment key={item.path}>
                  {header}
                  <NavItem item={item} active={isActive(item.path)} isCollapsed={isCollapsed} />
                </React.Fragment>
              );
            })}
          </div>

          {/* Premium Features section */}
          {premiumItems.length > 0 && (
            <div className="mt-6 space-y-1">
              {!isCollapsed ? (
                <div className="px-5 mb-3 flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400">
                  <span>Premium Features</span>
                  <div className="h-[1px] flex-1 bg-white/10" />
                  {(!user?.subscription || user?.subscription?.price === 0) && premiumItems.some(i => i.featureKey && !hasFeature(user, i.featureKey)) && (
                    <Badge className="text-[8px] font-bold bg-amber-50 text-amber-600 border-amber-100 px-1.5 py-0 shrink-0 rounded-none">
                      Upgrade
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="h-[1px] bg-white/10 my-6 mx-2" />
              )}
              {premiumItems.map(item => {
                const unlocked = !item.featureKey || hasFeature(user, item.featureKey);
                return (
                  <PremiumNavItem
                    key={item.path}
                    item={item}
                    active={isActive(item.path)}
                    unlocked={unlocked}
                    isCollapsed={isCollapsed}
                  />
                );
              })}
            </div>
          )}
        </div>

        {role === 'drive_incharge' && !isCollapsed && (
          <div className="px-6 mt-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-none p-4 border border-emerald-100/50 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-200/20 rounded-full blur-xl pointer-events-none" />
              <h3 className="text-[11px] font-black text-emerald-800 uppercase tracking-wider mb-2 relative z-10">
                Unlock Features
              </h3>
              <p className="text-[10px] font-medium text-emerald-700/80 leading-relaxed relative z-10 mb-3">
                Register fully to post jobs, apply for jobs, and access the complete platform.
              </p>
              <button
                onClick={() => navigate('/complete-social-profile')}
                className="w-full py-2 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all shadow-sm shadow-emerald-600/20 relative z-10"
              >
                Complete Registration
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Logout */}
      <div className={`py-4 border-t border-white/10 bg-white/5 shrink-0 ${isCollapsed ? 'px-2' : 'px-6'}`}>
        <button
          onClick={() => { logout(); navigate('/'); }}
          title={isCollapsed ? 'Logout' : undefined}
          className={`flex items-center justify-between w-full rounded-none text-slate-300 hover:text-[#34b678] hover:bg-white/5 hover:border-white/10 border border-transparent transition-all duration-300 group ${isCollapsed ? 'p-3 justify-center' : 'px-5 py-2.5'}`}
        >
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
            <LogOut size={16} strokeWidth={2} className="group-hover:-translate-x-1 transition-transform" />
            {!isCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Logout</span>}
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
