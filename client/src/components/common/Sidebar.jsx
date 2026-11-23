import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Briefcase, Building2, FileText, Star, LogOut,
  LayoutDashboard, Users, UserCog, TrendingUp, Bell,
  Activity, CreditCard, ChevronRight, ChevronLeft, PanelLeftClose, PanelLeftOpen,
  Lock, MessageCircle, Video, Layers, BarChart2, Mail,
  BookOpen, Mic, UserCheck, ArrowUpRight, List, History, Sparkles, ClipboardList, ShieldCheck, Headphones, MessageSquareQuote, ShoppingBag, Settings, GraduationCap, QrCode, BadgeCheck, Landmark, CalendarDays, ListChecks, Wallet, MessageSquareHeart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { findPermissionKeyForPath } from '../../config/teamPermissions';
import { staffMenuFor } from '../../config/staffPermissions';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    { icon: CalendarDays,    label: 'Send a Job Fair',   path: '/company/job-fairs' },
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
    { icon: GraduationCap,   label: 'College Funnel',    path: '/admin/college-funnel', group: 'Daily' },
    { icon: GraduationCap,   label: 'Duplicate Colleges', path: '/admin/duplicate-colleges', group: 'Daily' },
    { icon: LayoutDashboard, label: 'Balance Board',     path: '/admin/balance-board', group: 'Daily' },
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
    { icon: Building2,       label: 'Companies', path: '/admin/companies', group: 'Growth' },
    { icon: Briefcase,       label: 'Web jobs',  path: '/admin/web-jobs', group: 'Growth' },
    { icon: CalendarDays,    label: 'Walk-in Drives',   path: '/admin/drives', group: 'Growth' },
    { icon: CalendarDays,    label: 'Job Fairs',        path: '/admin/job-fairs', group: 'Growth' },
    { icon: Landmark,        label: 'Government jobs',  path: '/admin/govt-jobs', group: 'Growth' },
    { icon: FileText,        label: 'Applications',     path: '/admin/applications', group: 'Growth' },
    { icon: Activity,        label: 'Daily activity',   path: '/admin/activity', group: 'Growth' },
    { icon: Users,           label: 'Signup sources',   path: '/admin/growth', group: 'Growth' },
    { icon: Users,           label: 'Brand Leads',      path: '/admin/brand-leads', group: 'Growth' },
    { icon: MessageSquareQuote, label: 'Reviews', path: '/admin/reviews', group: 'Growth' },
    { icon: MessageSquareHeart, label: 'Feedback',   path: '/admin/feedback', group: 'Growth' },
    { icon: BookOpen,        label: 'Blog posts',     path: '/admin/blog', group: 'Growth' },
    { icon: BadgeCheck,      label: 'Skill tests',    path: '/admin/skill-tests', group: 'Growth' },
    { icon: ListChecks,      label: 'All Services',     path: '/admin/services', group: 'Setup' },
    { icon: UserCog,         label: 'Staff',          path: '/admin/staff', group: 'Setup' },
    { icon: ShieldCheck,     label: 'Admins',         path: '/admin/admins', group: 'Setup' },
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
    { icon: CalendarDays, label: 'Send a Job Fair', path: '/company/job-fairs' },
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

// ─── Look ────────────────────────────────────────────────────────────────────
// Modelled on the shadcn sidebar: compact rows, a soft highlight for the current
// page, small group labels, and the signed-in user pinned to the footer.
const itemCls = (active, isCollapsed, extra = '') =>
  `group relative flex items-center rounded-lg text-[13px] no-underline outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#34B678]/60
   ${isCollapsed ? 'mx-auto h-9 w-9 justify-center' : 'h-9 w-full gap-2.5 px-2.5'}
   ${active ? 'bg-white/[0.09] text-white font-medium' : 'text-slate-300 font-normal hover:bg-white/[0.05] hover:text-white'} ${extra}`;

const ItemIcon = ({ icon: Icon, active, size = 17 }) => (
  <Icon size={size} strokeWidth={active ? 2.2 : 1.8} className={`shrink-0 transition-colors ${active ? 'text-[#5fd39b]' : 'text-slate-400 group-hover:text-slate-200'}`} />
);

const GroupLabel = ({ children, action, isCollapsed }) => (
  isCollapsed
    ? <div className="mx-auto my-3 h-px w-6 bg-white/10" />
    : (
      <div className="flex h-8 items-center justify-between px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        <span>{children}</span>
        {action}
      </div>
    )
);

// Links that open the public website (outside the dashboard). They get their own group
// at the bottom of the sidebar so they are not mixed with the account pages.
const SITE_PATHS = ['/jobs', '/companies', '/blog'];

const NavItem = ({ item, active, isCollapsed }) => (
  <Link
    to={item.path}
    title={isCollapsed ? item.label : item.tagline || undefined}
    aria-current={active ? 'page' : undefined}
    className={itemCls(active, isCollapsed)}
  >
    <ItemIcon icon={item.icon} active={active} />
    {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
    {!isCollapsed && item.external && <ArrowUpRight size={13} className="shrink-0 text-slate-500 group-hover:text-slate-300" aria-hidden="true" />}
  </Link>
);

const CollapsibleNavItem = ({ item, location, isCollapsed }) => {
  const childActive = (child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/');
  const isAnyChildActive = (item.children || []).some(childActive);
  const [isOpen, setIsOpen] = React.useState(isAnyChildActive);

  if (isCollapsed) {
    return (
      <Link to={item.path || item.children?.[0]?.path} title={item.label} className={itemCls(isAnyChildActive, true)}>
        <ItemIcon icon={item.icon} active={isAnyChildActive} />
      </Link>
    );
  }

  return (
    <div>
      <button type="button" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} className={`${itemCls(isAnyChildActive && !isOpen, false)} border-none bg-transparent cursor-pointer text-left`}>
        <ItemIcon icon={item.icon} active={isAnyChildActive} />
        <span className="flex-1 truncate">{item.label}</span>
        <ChevronRight size={14} className={`shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <div className="ml-[18px] mt-0.5 space-y-0.5 border-l border-white/10 py-0.5 pl-2.5">
          {(item.children || []).map(child => {
            const active = childActive(child);
            return (
              <Link
                key={child.path}
                to={child.path}
                aria-current={active ? 'page' : undefined}
                className={`flex h-8 items-center rounded-md px-2.5 text-[13px] no-underline transition-colors ${active ? 'bg-white/[0.09] font-semibold text-white' : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'}`}
              >
                <span className="truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PremiumNavItem = ({ item, active, unlocked, isCollapsed }) => (
  <Link
    to={item.path}
    title={!unlocked ? `${item.label}: not in your current plan. Open it to see what you get and how to upgrade.` : (isCollapsed ? item.label : item.tagline || undefined)}
    aria-current={active ? 'page' : undefined}
    className={itemCls(active, isCollapsed)}
  >
    <ItemIcon icon={item.icon} active={active} />
    {!isCollapsed && (
      <>
        <span className={`flex-1 truncate ${unlocked || active ? '' : 'text-slate-400'}`}>{item.label}</span>
        {!unlocked && <Lock size={12} className="shrink-0 text-slate-500" aria-label="Locked" />}
      </>
    )}
  </Link>
);

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

  const siteItems = coreItems.filter(i => SITE_PATHS.includes(i.path)).map(i => ({ ...i, external: true }));
  const menuItems = coreItems.filter(i => !SITE_PATHS.includes(i.path));

  const settingsPath = {
    jobseeker: '/candidate/settings',
    recruiter: '/company/settings',
    company: '/company/settings',
    college: '/college/settings',
    admin: '/admin/settings',
    subadmin: '/subadmin',
    org_employee: '/employee/settings'
  }[role] || '/candidate/settings';
  const upgradePath = role === 'jobseeker' ? '/candidate/subscription' : role === 'college' ? '/college/subscription' : '/company/subscription';
  const showUpgrade = (!user?.subscription || user?.subscription?.price === 0) && premiumItems.some(i => i.featureKey && !hasFeature(user, i.featureKey));
  const avatarSrc = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_DOMAIN}${user.avatar}`) : '/usericon.webp';

  return (
    <aside className="flex h-full w-full flex-col bg-[#10213D] font-sans text-white select-none">
      {/* Header */}
      <div className={`flex h-16 shrink-0 items-center border-b border-white/[0.08] ${isCollapsed ? 'justify-center px-2' : 'justify-between pl-4 pr-3'}`}>
        {!isCollapsed && (
          <Link to="/" className="flex items-center" aria-label="Velaivaaipu home">
            <img src="/velaivaaipu-logo.webp" alt="Velaivaaipu" className="h-10 w-auto object-contain" />
          </Link>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white cursor-pointer"
        >
          {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto overscroll-contain py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {role === 'jobseeker' && !isCollapsed && (
          <Link to="/candidate/settings" className="mb-3 block rounded-xl bg-white/[0.05] p-3 no-underline ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Profile strength</span>
              <span className="font-bold text-[#5fd39b]">{profileCompletion}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={profileCompletion} aria-valuemin={0} aria-valuemax={100} aria-label="Profile strength">
              <div className="h-full rounded-full bg-[#34B678] transition-all duration-700" style={{ width: `${profileCompletion}%` }} />
            </div>
            {profileCompletion < 100 && <p className="m-0 mt-2 text-[11px] font-semibold text-[#5fd39b]">Complete your profile →</p>}
          </Link>
        )}

        <nav aria-label="Main" className="space-y-0.5">
          <GroupLabel isCollapsed={isCollapsed}>Menu</GroupLabel>
          {menuItems.map((item, idx) => {
            // Admin menu is grouped (Daily, Money, Growth, Setup); other roles have no groups.
            const startsGroup = item.group && item.group !== menuItems[idx - 1]?.group && idx > 0;
            return (
              <React.Fragment key={item.path}>
                {startsGroup && <GroupLabel isCollapsed={isCollapsed}>{item.group}</GroupLabel>}
                {item.children
                  ? <CollapsibleNavItem item={item} location={location} isCollapsed={isCollapsed} />
                  : <NavItem item={item} active={isActive(item.path)} isCollapsed={isCollapsed} />}
              </React.Fragment>
            );
          })}
        </nav>

        {premiumItems.length > 0 && (
          <nav aria-label="Premium" className="mt-4 space-y-0.5">
            <GroupLabel
              isCollapsed={isCollapsed}
              action={showUpgrade && <Link to={upgradePath} className="text-[11px] font-semibold normal-case tracking-normal text-[#5fd39b] no-underline hover:underline">Upgrade</Link>}
            >
              Premium
            </GroupLabel>
            {premiumItems.map(item => (
              <PremiumNavItem
                key={item.path}
                item={item}
                active={isActive(item.path)}
                unlocked={!item.featureKey || hasFeature(user, item.featureKey)}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>
        )}

        {siteItems.length > 0 && (
          <nav aria-label="Velaivaaipu website" className="mt-4 space-y-0.5">
            <GroupLabel isCollapsed={isCollapsed}>Velaivaaipu site</GroupLabel>
            {siteItems.map(item => (
              <NavItem key={item.path} item={item} active={false} isCollapsed={isCollapsed} />
            ))}
          </nav>
        )}

        {role === 'drive_incharge' && !isCollapsed && (
          <div className="mt-4 rounded-xl bg-white/[0.05] p-3 ring-1 ring-white/[0.08]">
            <p className="m-0 text-xs font-bold text-white">Unlock more features</p>
            <p className="m-0 mt-1 text-[11px] leading-relaxed text-slate-400">Finish signing up to post jobs, apply for jobs and use the full platform.</p>
            <button
              type="button"
              onClick={() => navigate('/complete-social-profile')}
              className="mt-2.5 h-8 w-full rounded-lg border-none bg-[#34B678] text-xs font-bold text-white transition hover:bg-[#2ca66b] cursor-pointer"
            >
              Complete registration
            </button>
          </div>
        )}
      </div>

      {/* Footer: signed-in user */}
      <div className={`shrink-0 border-t border-white/[0.08] p-2 ${isCollapsed ? 'space-y-1' : 'space-y-0.5'}`}>
        <Link
          to={settingsPath}
          title={isCollapsed ? `${user?.name || 'Account'} · Settings` : 'Account settings'}
          className={`group flex items-center rounded-lg no-underline transition-colors hover:bg-white/[0.06] ${isCollapsed ? 'mx-auto h-10 w-10 justify-center' : 'gap-2.5 p-2'}`}
        >
          <Avatar className="h-8 w-8 shrink-0 rounded-lg bg-white/10">
            <AvatarImage src={avatarSrc} className="object-cover" />
            <AvatarFallback className="rounded-lg bg-white/10 text-xs font-bold text-white">{user?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="flex items-center gap-1 truncate text-[13px] font-medium text-white">
                  <span className="truncate">{user?.name || 'Account'}</span>
                  {user?.profileVerificationStatus === 'Verified' && <BadgeCheck size={13} className="shrink-0 text-[#5fd39b]" aria-label="Verified" />}
                </span>
                <span className="block truncate text-[11px] text-slate-400">{ROLE_LABELS[role] || role}</span>
              </span>
              <Settings size={15} className="shrink-0 text-slate-500 transition-colors group-hover:text-slate-200" />
            </>
          )}
        </Link>
        <button
          type="button"
          onClick={() => { logout(); navigate('/'); }}
          title={isCollapsed ? 'Log out' : undefined}
          className={`${itemCls(false, isCollapsed)} border-none bg-transparent cursor-pointer`}
        >
          <LogOut size={16} className="shrink-0 text-slate-400 group-hover:text-rose-300" />
          {!isCollapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
