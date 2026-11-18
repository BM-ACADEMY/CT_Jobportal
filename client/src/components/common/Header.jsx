import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, LogOut, Settings, ChevronDown, BadgeCheck, CheckCheck, Menu, Trash2 } from 'lucide-react';
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
  // The box searches jobs (Enter opens the jobs page), so every hint must say jobs, never drives or reports.
  const placeholderText = role === 'admin' ? 'Search live jobs on the site'
    : role === 'college' ? 'Search jobs for your students'
    : 'Search jobs or companies';

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

  const deleteNotificationItem = async (e, notificationId) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(current => current.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const clearReadNotifications = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/notifications/read`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(current => current.filter(n => !n.isRead));
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo & Mobile Menu */}
        <div className="flex items-center gap-2.5 lg:hidden">
            <button 
              onClick={toggleMobileSidebar}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-[#10213D] bg-transparent border-none cursor-pointer transition-colors"
            >
              <Menu size={20} />
            </button>
            <Link to="/" className="flex items-center active:scale-95 transition-transform" aria-label="Velaivaaipu home">
                <img src="/velaivaaipu-logo.webp" alt="Velaivaaipu" loading="eager" decoding="async" className="h-10 w-auto object-contain" />
            </Link>
        </div>

        {/* Search */}
        <div className="hidden xl:flex flex-1 justify-center max-w-md">
            <div className="w-full flex items-center rounded-xl ring-1 ring-zinc-200 hover:ring-zinc-300 focus-within:ring-2 focus-within:ring-[#34B678] transition-all bg-zinc-50">
                <div className="pl-4 pr-1 text-slate-400">
                    <Search size={15} />
                </div>
                <input 
                    placeholder={placeholderText} 
                    className="flex-1 h-9 px-2 bg-transparent border-none outline-none text-zinc-800 font-normal text-[13px] placeholder:text-zinc-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                />
            </div>
        </div>



        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative h-10 w-10 text-zinc-500 hover:text-[#10213D] hover:bg-zinc-100 rounded-xl transition-all cursor-pointer">
                    <Bell size={19} className="cursor-pointer" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white border-2 border-white rounded-full text-[9px] font-bold flex items-center justify-center cursor-pointer">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={12} className="w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 shadow-xl p-0 bg-white text-zinc-900 overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-100">
                  <div>
                    <p className="text-sm font-bold text-[#10213D]">Notifications</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{unreadCount} unread</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {notifications.some(n => n.isRead) && (
                      <Button variant="ghost" size="sm" onClick={clearReadNotifications} className="h-7 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer px-2">
                        <Trash2 className="w-3 h-3 mr-1" /> Clear read
                      </Button>
                    )}
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllNotificationsRead} className="h-7 text-[11px] font-semibold text-[#1f8a57] hover:bg-[#eaf7f0] rounded-lg cursor-pointer px-2">
                        <CheckCheck className="w-3 h-3 mr-1" /> Mark all read
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <Bell className="w-5 h-5 mx-auto text-zinc-300 mb-1.5" />
                      <p className="text-sm font-bold text-[#10213D]">You're all caught up</p>
                      <p className="text-xs text-zinc-500 mt-0.5">No unread messages or notifications at this time.</p>
                    </div>
                  ) : notifications.map(notification => (
                    <DropdownMenuItem
                      key={notification._id}
                      onClick={() => openNotification(notification)}
                      className={`block px-4 py-3 rounded-none border-b border-zinc-100 cursor-pointer focus:bg-zinc-50 outline-none ${notification.isRead ? 'bg-white' : 'bg-[#f4faf7]'}`}
                    >
                      <div className="flex gap-2.5 w-full">
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${notification.isRead ? 'bg-zinc-300' : 'bg-[#34B678]'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-[#10213D] leading-tight">{notification.title}</p>
                          <p className="text-xs text-zinc-500 mt-0.5 leading-normal line-clamp-2">{notification.message}</p>
                          <p className="text-[10px] text-zinc-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                        {notification.isRead && (
                          <button
                            onClick={(e) => deleteNotificationItem(e, notification._id)}
                            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 bg-transparent border-none cursor-pointer transition-colors"
                            title="Delete notification"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button type="button" aria-label="Account menu" className="flex items-center gap-2.5 cursor-pointer rounded-xl p-1 lg:pl-2 lg:pr-1.5 h-11 bg-transparent border-none hover:bg-zinc-100 group transition-colors">
                        <div className="hidden lg:flex flex-col items-end leading-none cursor-pointer">
                            <p className="m-0 text-[13px] font-medium text-[#10213D] flex items-center gap-1.5 cursor-pointer">
                              {user?.name || 'Authorized User'}
                              {user?.profileVerificationStatus === 'Verified' && <BadgeCheck size={14} className="text-[#1f8a57] shrink-0 cursor-pointer" />}
                            </p>
                            <span className="mt-1 text-[11px] font-medium text-zinc-500 cursor-pointer">
                                {config.label}
                            </span>
                        </div>
                        <Avatar className="w-9 h-9 rounded-lg ring-1 ring-zinc-200 cursor-pointer">
                            {user?.avatar && (
                                <AvatarImage 
                                    src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_DOMAIN}${user.avatar}`} 
                                    className="object-cover cursor-pointer" 
                                />
                            )}
                            <AvatarFallback className="bg-[#eaf7f0] text-[#1f8a57] text-xs font-bold cursor-pointer rounded-lg">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <ChevronDown size={14} className="hidden lg:block text-zinc-400 cursor-pointer" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={12} className="w-56 rounded-2xl border border-zinc-200 shadow-xl p-1.5 bg-white text-zinc-900">
                    <DropdownMenuLabel className="px-2.5 py-2">
                        <div className="flex flex-col space-y-1.5">
                            <p className="text-[13px] font-semibold text-[#10213D] flex items-center gap-1 truncate">
                              {user?.name || 'User Account'}
                              {user?.profileVerificationStatus === 'Verified' && <BadgeCheck size={13} className="text-[#1f8a57] shrink-0" />}
                            </p>
                            <p className="text-xs font-normal text-zinc-500 truncate">{user?.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-100" />
                    <div>
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
                          className="rounded-lg px-2.5 py-2 text-[13px] font-medium text-zinc-700 cursor-pointer focus:bg-zinc-100 focus:text-[#10213D] outline-none"
                      >
                          <Settings className="w-3.5 h-3.5 mr-2 cursor-pointer" />
                          <span className="cursor-pointer">Settings</span>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator className="bg-zinc-100" />
                    <div>
                      <DropdownMenuItem 
                          onClick={() => { logout(); navigate('/'); }}
                          className="rounded-lg px-2.5 py-2 text-[13px] font-medium text-rose-600 cursor-pointer focus:bg-rose-50 focus:text-rose-700 outline-none"
                      >
                          <LogOut className="w-3.5 h-3.5 mr-2 cursor-pointer" />
                          <span className="cursor-pointer">Log out</span>
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
