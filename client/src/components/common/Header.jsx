import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Settings, ChevronDown, BadgeCheck, CheckCheck, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuArrow
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const roleConfig = {
  jobseeker: {
    label: 'Job Seeker',
    color: 'bg-primary/10 text-primary border-primary/20',
    navItems: [
      { label: 'Jobs', href: '/jobs' },
      { label: 'Companies', href: '/companies' },
      { label: 'Services', href: '/services' },
    ],
  },
  recruiter: {
    label: 'Recruiter',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    navItems: [
      { label: 'Post Job', href: '/company/jobs/new' },
      { label: 'Applicants', href: '/company/applicants' },
      { label: 'Analytics', href: '/company/analytics' },
      { label: 'Settings', href: '/company/settings' },
    ],
  },
  company: {
    label: 'Company',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    navItems: [
      { label: 'Post Job', href: '/company/jobs/new' },
      { label: 'Applicants', href: '/company/applicants' },
      { label: 'Analytics', href: '/company/analytics' },
      { label: 'Settings', href: '/company/settings' },
    ],
  },
  admin: {
    label: 'Admin',
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    navItems: [
      { label: 'Users', href: '/admin/users' },
      { label: 'Companies', href: '/admin/companies' },
      { label: 'Reports', href: '/admin/reports' },
    ],
  },
  subadmin: {
    label: 'Sub-Admin',
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    navItems: [
      { label: 'Moderation', href: '/subadmin/moderation' },
      { label: 'Reports', href: '/subadmin/reports' },
    ],
  },
  college: {
    label: 'College',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    navItems: [
      { label: 'Students', href: '/college/students' },
      { label: 'Campus Drives', href: '/college/drives' },
      { label: 'Reports', href: '/college/reports' },
    ],
  },
  org_employee: {
    label: 'Employee',
    color: 'bg-primary/10 text-primary border-primary/20',
    navItems: [
      { label: 'Jobs', href: '/jobs' },
      { label: 'Companies', href: '/companies' },
      { label: 'Services', href: '/services' },
    ],
  },
  drive_incharge: {
    label: 'Drive In-Charge',
    color: 'bg-primary/10 text-primary border-primary/20',
    navItems: [
      { label: 'Manage Drive', href: '/incharge' },
    ],
  },
};

const Header = ({ toggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const role = user?.role || 'jobseeker';
  const config = roleConfig[role] || roleConfig.jobseeker;
  const navItems = [...(config.navItems || []), { label: 'Blog', href: '/blog' }];

  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Typewriter placeholder animation
  const placeholders = [
    "Identify roles, companies or skillsets...",
    "Search jobs by title or keyword...",
    "Search for top organizations...",
    "Search campus drives...",
    "Explore placement reports & tools..."
  ];
  const [placeholderText, setPlaceholderText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    const currentFullText = placeholders[placeholderIndex];
    
    if (isDeleting) {
      timer = setTimeout(() => {
        setPlaceholderText(prev => prev.substring(0, prev.length - 1));
      }, 30);
    } else {
      timer = setTimeout(() => {
        setPlaceholderText(prev => currentFullText.substring(0, prev.length + 1));
      }, 70);
    }

    if (!isDeleting && placeholderText === currentFullText) {
      timer = setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && placeholderText === "") {
      setIsDeleting(false);
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }

    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, placeholderIndex]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/notifications?limit=30`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ data }) => {
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    }).catch(err => console.error('Failed to load notifications:', err));
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const receiveNotification = notification => {
      setNotifications(current => [notification, ...current].slice(0, 30));
      setUnreadCount(current => current + 1);
    };
    socket.on('notification:new', receiveNotification);
    return () => socket.off('notification:new', receiveNotification);
  }, [socket]);

  const openNotification = async notification => {
    if (!notification.isRead) {
      const token = localStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${notification._id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
      setNotifications(current => current.map(item => item._id === notification._id ? { ...item, isRead: true } : item));
      setUnreadCount(current => Math.max(0, current - 1));
    }
    if (notification.link) navigate(notification.link);
  };

  const markAllNotificationsRead = async () => {
    const token = localStorage.getItem('token');
    await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/notifications/read-all`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(current => current.map(item => ({ ...item, isRead: true })));
    setUnreadCount(0);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white shadow-sm">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10 h-20 flex items-center justify-between gap-6">

        {/* Logo & Mobile Menu */}
        <div className="flex items-center gap-2.5 lg:hidden">
            <button 
              onClick={toggleMobileSidebar}
              className="text-slate-500 hover:text-emerald-600 cursor-pointer focus:outline-none p-1 transition-colors"
            >
              <Menu size={24} />
            </button>
            <Link to="/" className="flex items-center active:scale-95 transition-transform" aria-label="Velaivaaipu home">
                <img src="/velaivaaipu-logo.png" alt="Velaivaaipu" loading="eager" decoding="async" className="h-12 w-auto object-contain" />
            </Link>
        </div>

        {/* Search */}
        <div className="hidden xl:flex flex-1 justify-center max-w-md">
            <div className="w-full flex items-center shadow-sm border border-slate-300 hover:border-slate-400 focus-within:border-[#34b678] focus-within:ring-1 focus-within:ring-[#34b678]/15 transition-all bg-slate-50/20">
                <div className="pl-4 pr-1 text-slate-400">
                    <Search size={15} />
                </div>
                <input 
                    placeholder={placeholderText} 
                    className="flex-1 h-11 px-2 bg-transparent border-none outline-none text-slate-800 font-semibold text-xs placeholder-slate-600/90"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                />
            </div>
        </div>



        {/* Actions */}
        <div className="flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-11 w-11 text-slate-400 hover:text-emerald-600 hover:bg-transparent rounded-none transition-all cursor-pointer group/bell">
                    <Bell size={20} className="cursor-pointer transition-transform group-hover/bell:scale-125" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white border-2 border-white rounded-full text-[9px] font-black flex items-center justify-center cursor-pointer">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={12} className="w-[280px] rounded-none border border-white/10 shadow-xl p-0 bg-[#1b496d] text-white overflow-visible">
                <DropdownMenuArrow className="fill-[#1b496d]" />
                <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
                  <div>
                    <p className="text-xs font-bold text-white">Notifications</p>
                    <p className="text-[9px] text-slate-300 mt-0.5">{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllNotificationsRead} className="h-7 text-[9px] font-bold text-emerald-400 hover:text-emerald-300 hover:bg-white/5 cursor-pointer px-2">
                      <CheckCheck className="w-3 h-3 mr-1" /> Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="w-5 h-5 mx-auto text-slate-400 mb-1.5" />
                      <p className="text-[11px] font-medium text-slate-300">No notifications yet</p>
                    </div>
                  ) : notifications.map(notification => (
                    <DropdownMenuItem
                      key={notification._id}
                      onClick={() => openNotification(notification)}
                      className={`block px-4 py-3 rounded-none border-b border-white/5 cursor-pointer focus:bg-white/10 focus:text-white outline-none border-l-4 border-transparent focus:border-[#34b678] ${notification.isRead ? 'bg-transparent text-slate-300' : 'bg-white/5 text-white'}`}
                    >
                      <div className="flex gap-2.5">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${notification.isRead ? 'bg-slate-500' : 'bg-emerald-400'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white leading-tight">{notification.title}</p>
                          <p className="text-[10px] text-slate-300 mt-0.5 leading-normal line-clamp-2">{notification.message}</p>
                          <p className="text-[8px] text-slate-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="hidden lg:flex items-center gap-3 cursor-pointer pl-6 border-l border-slate-300 h-10 group transition-all">
                        <div className="hidden sm:flex flex-col items-end leading-none cursor-pointer">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center gap-1.5 cursor-pointer">
                              {user?.name || 'Authorized User'}
                              {user?.profileVerificationStatus === 'Verified' && <BadgeCheck size={14} className="text-blue-500 shrink-0 cursor-pointer" />}
                            </p>
                            <span className="text-[8px] px-2 py-0.5 rounded-none border border-slate-200 bg-slate-50/50 mt-1 uppercase tracking-widest font-bold text-slate-400 cursor-pointer">
                                {config.label}
                            </span>
                        </div>
                        <Avatar className="w-10 h-10 rounded-none border-2 border-white shadow-sm ring-1 ring-slate-200 group-hover:ring-emerald-100 transition-all cursor-pointer">
                            {user?.avatar && (
                                <AvatarImage 
                                    src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_DOMAIN}${user.avatar}`} 
                                    className="object-cover cursor-pointer" 
                                />
                            )}
                            <AvatarFallback className="bg-emerald-50 text-emerald-600 text-xs font-black cursor-pointer rounded-none">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <ChevronDown size={14} className="text-slate-300 group-hover:text-emerald-500 transition-all cursor-pointer" />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={12} className="w-48 rounded-none border border-white/10 shadow-xl p-2 bg-[#1b496d] text-white animate-in slide-in-from-top-2 duration-300 overflow-visible">
                    <div className="absolute right-5 -top-1.5 w-3 h-3 bg-[#1b496d] rotate-45 border-t border-l border-white/10 z-0" />
                    <DropdownMenuLabel className="px-3 py-3 mb-1 relative z-10">
                        <div className="flex flex-col space-y-1.5">
                            <p className="text-xs font-bold text-white flex items-center gap-1 truncate max-w-[150px]">
                              {user?.name || 'User Account'}
                              {user?.profileVerificationStatus === 'Verified' && <BadgeCheck size={13} className="text-blue-400 shrink-0" />}
                            </p>
                            <p className="text-[10px] font-medium text-slate-300 truncate max-w-[150px]">{user?.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <div className="p-1 space-y-1 relative z-10">
                      <DropdownMenuItem 
                          onClick={() => {
                              const routes = {
                                  jobseeker: '/candidate/settings',
                                  recruiter: '/company/settings',
                                  company: '/company/settings',
                                  college: '/college/settings',
                                  admin: '/admin/settings',
                                  subadmin: '/subadmin/settings',
                                  org_employee: '/employee/settings'
                              };
                              navigate(routes[user?.role] || '/candidate/settings');
                          }}
                          className="rounded-none px-3 py-2 text-[10px] font-bold text-slate-300 cursor-pointer focus:bg-white/10 focus:text-white border-l-4 border-transparent focus:border-[#34b678] outline-none transition-all uppercase tracking-widest"
                      >
                          <Settings className="w-3.5 h-3.5 mr-2 cursor-pointer" />
                          <span className="cursor-pointer">Settings</span>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <div className="p-1 relative z-10">
                      <DropdownMenuItem 
                          onClick={() => { logout(); navigate('/'); }}
                          className="rounded-none px-3 py-2 text-[10px] font-bold text-rose-400 cursor-pointer focus:bg-white/10 focus:text-rose-300 border-l-4 border-transparent focus:border-[#34b678] outline-none transition-all uppercase tracking-widest"
                      >
                          <LogOut className="w-3.5 h-3.5 mr-2 cursor-pointer" />
                          <span className="cursor-pointer">Logout</span>
                      </DropdownMenuItem>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
