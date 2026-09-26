import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell, BellOff, User, Settings, LogOut, ChevronDown, CheckCheck,
  Menu, X, Briefcase, Building2, Mail, Home, Newspaper, Trash2
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/jobs', label: 'Find Jobs', icon: Briefcase },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/contact', label: 'Contact', icon: Mail },
];

const PublicHeader = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
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
    }).catch(() => {});
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

  const isDarkHero = false; // Always white header like Apna

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleDashboardRedirect = () => {
    const routes = { jobseeker: '/candidate', recruiter: '/company/dashboard', company: '/company/dashboard', admin: '/admin/dashboard', subadmin: '/subadmin' };
    navigate(routes[user?.role] || '/candidate');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const headerBase = 'bg-white border-b border-slate-200 shadow-sm';
  const navColor = 'text-slate-800 hover:text-[#138060]';
  const navActiveColor = 'text-[#138060] font-bold';

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBase}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="group shrink-0 flex flex-col items-start gap-1" aria-label="Velaivaaipu home">
            <img src="/velaivaaipu-logo.png" alt="Velaivaaipu" loading="eager" decoding="async" className="h-14 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.filter(link => !(link.label === 'Find Jobs' && (user?.role === 'recruiter' || user?.role === 'company'))).map((link, index) => {
              // Add orange 'New' badge to some nav items to match Apna theme
              const hasBadge = link.label === 'Companies' || link.label === 'Blog';
              const hasChevron = link.label === 'Find Jobs';
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 py-2 text-sm font-semibold transition-colors duration-200 ${
                    isActive(link.to) ? navActiveColor : navColor
                  }`}
                >
                  {link.label}
                  {hasChevron && <ChevronDown size={14} className="text-slate-500" />}
                  {hasBadge && (
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded ml-1 uppercase tracking-wider scale-90">
                      New
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Notification Bell Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-9 w-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
                      aria-label="Notifications"
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white border-2 border-white rounded-full text-[9px] font-black flex items-center justify-center animate-in zoom-in-50">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="w-[320px] sm:w-[360px] rounded-2xl border border-slate-200/80 shadow-2xl p-0 bg-white text-slate-800 overflow-hidden z-50">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
                      <div>
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Bell size={13} className="text-emerald-600" /> Notifications
                        </p>
                        <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                          {unreadCount > 0 ? `${unreadCount} unread` : 'No unread messages'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {notifications.some(n => n.isRead) && (
                          <button
                            type="button"
                            onClick={clearReadNotifications}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={11} /> Clear read
                          </button>
                        )}
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsRead}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCheck size={12} /> Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-10 px-4 text-center space-y-2">
                          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                            <BellOff size={22} />
                          </div>
                          <p className="text-xs font-bold text-slate-700">No unread notifications</p>
                          <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto font-medium">
                            You have no unread messages or notifications at this time.
                          </p>
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <DropdownMenuItem
                            key={notification._id}
                            onClick={() => openNotification(notification)}
                            className={`block px-4 py-3 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors ${
                              notification.isRead ? 'bg-white opacity-75' : 'bg-emerald-50/30'
                            }`}
                          >
                          <div className="flex items-start gap-3 w-full">
                              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notification.isRead ? 'bg-slate-300' : 'bg-emerald-500 ring-4 ring-emerald-100'}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{notification.title}</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notification.message}</p>
                                <p className="text-[9px] text-slate-400 font-medium mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              {notification.isRead && (
                                <button
                                  onClick={(e) => deleteNotificationItem(e, notification._id)}
                                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors mt-0.5"
                                  title="Delete notification"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer rounded-xl px-2.5 py-1.5 border transition-all group bg-slate-50 border-slate-200 hover:bg-slate-100">
                      <Avatar className="h-7 w-7 rounded-lg">
                        <AvatarFallback className="bg-[#138060] text-white font-bold text-xs rounded-lg">
                          {user.name?.[0]?.toUpperCase() || <User size={12} />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:flex flex-col items-start leading-none">
                        <span className="text-xs font-bold truncate max-w-[80px] text-slate-900">{user.name}</span>
                        <span className="text-[9px] font-semibold uppercase tracking-wider mt-0.5 text-slate-400">{user.role}</span>
                      </div>
                      <ChevronDown size={12} className="transition-transform group-data-[state=open]:rotate-180 text-slate-400" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl border border-slate-100 shadow-xl p-1.5">
                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleDashboardRedirect} className="rounded-xl px-3 py-2.5 text-sm font-semibold cursor-pointer hover:bg-emerald-50 hover:text-[#138060]">
                      <User size={15} className="mr-2.5" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const routes = { jobseeker: '/candidate/settings', recruiter: '/company/settings', company: '/company/settings' };
                        navigate(routes[user?.role] || '/settings');
                      }}
                      className="rounded-xl px-3 py-2.5 text-sm font-semibold cursor-pointer hover:bg-slate-50"
                    >
                      <Settings size={15} className="mr-2.5" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1.5" />
                    <DropdownMenuItem
                      onClick={() => { logout(); navigate('/'); }}
                      className="rounded-xl px-3 py-2.5 text-sm font-semibold cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-600"
                    >
                      <LogOut size={15} className="mr-2.5" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-5">
                <Link
                  to="/login"
                  className="text-[#138060] hover:text-[#0f664d] text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Button
                  onClick={() => navigate('/register')}
                  className="h-10 px-6 rounded-[3px] text-sm font-bold bg-[#138060] hover:bg-[#0f664d] text-white shadow-sm transition-all cursor-pointer"
                >
                  Join free
                </Button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors text-slate-700 hover:bg-slate-100"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-5 space-y-1">
            {NAV_LINKS.filter(link => !(link.label === 'Find Jobs' && (user?.role === 'recruiter' || user?.role === 'company'))).map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive(link.to)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <link.icon size={18} className={isActive(link.to) ? 'text-[#138060]' : 'text-slate-400'} />
                {link.label}
              </Link>
            ))}

            {!user && (
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-100 mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full h-11 rounded-[8px] border-slate-200 text-slate-750 font-bold"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="w-full h-11 rounded-[8px] bg-[#138060] hover:bg-[#0f664d] text-white font-bold"
                >
                  Join free
                </Button>
              </div>
            )}

            {user && (
              <div className="pt-4 border-t border-slate-100 mt-4 space-y-1">
                <button onClick={handleDashboardRedirect} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  <User size={18} className="text-slate-400" /> Dashboard
                </button>
                <button onClick={() => { logout(); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50">
                  <LogOut size={18} /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Spacer for pages */}
      <div className="h-20" />
    </>
  );
};

export default PublicHeader;
