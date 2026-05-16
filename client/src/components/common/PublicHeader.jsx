import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell, User, Settings, LogOut, ChevronDown,
  Menu, X, Briefcase, Building2, Mail, Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/jobs', label: 'Find Jobs', icon: Briefcase },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/contact', label: 'Contact', icon: Mail },
];

const PublicHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isDarkHero = ['/', '/companies', '/contact'].includes(location.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleDashboardRedirect = () => {
    const routes = { jobseeker: '/jobseeker', recruiter: '/company', company: '/company', admin: '/admin', subadmin: '/subadmin' };
    navigate(routes[user?.role] || '/jobseeker');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const headerBase = scrolled || mobileOpen
    ? 'bg-white border-b border-slate-100 shadow-sm'
    : isDarkHero
      ? 'bg-transparent border-b border-white/10'
      : 'bg-white border-b border-slate-100';

  const logoTextColor = (scrolled || mobileOpen || !isDarkHero) ? 'text-slate-900' : 'text-white';
  const navColor = (scrolled || !isDarkHero) ? 'text-slate-600 hover:text-emerald-600' : 'text-white/80 hover:text-white';
  const navActiveColor = (scrolled || !isDarkHero) ? 'text-emerald-600 font-bold' : 'text-white font-bold';

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBase}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <span className="text-slate-900 font-black text-base">C</span>
            </div>
            <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${logoTextColor}`}>
              careerpoint
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                  isActive(link.to) ? navActiveColor : navColor
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-xl ${(scrolled || !isDarkHero) ? 'text-slate-500 hover:bg-slate-100' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                >
                  <Bell size={18} />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className={`flex items-center gap-2 cursor-pointer rounded-xl px-2.5 py-1.5 border transition-all group ${
                      (scrolled || !isDarkHero)
                        ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}>
                      <Avatar className="h-7 w-7 rounded-lg">
                        <AvatarFallback className="bg-emerald-500 text-slate-900 font-bold text-xs rounded-lg">
                          {user.name?.[0]?.toUpperCase() || <User size={12} />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:flex flex-col items-start leading-none">
                        <span className={`text-xs font-bold truncate max-w-[80px] ${(scrolled || !isDarkHero) ? 'text-slate-900' : 'text-white'}`}>{user.name}</span>
                        <span className={`text-[9px] font-semibold uppercase tracking-wider mt-0.5 ${(scrolled || !isDarkHero) ? 'text-slate-400' : 'text-white/50'}`}>{user.role}</span>
                      </div>
                      <ChevronDown size={12} className={`transition-transform group-data-[state=open]:rotate-180 ${(scrolled || !isDarkHero) ? 'text-slate-400' : 'text-white/50'}`} />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl border border-slate-100 shadow-xl p-1.5">
                    <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleDashboardRedirect} className="rounded-xl px-3 py-2.5 text-sm font-semibold cursor-pointer hover:bg-emerald-50 hover:text-emerald-700">
                      <User size={15} className="mr-2.5" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const routes = { jobseeker: '/jobseeker/settings', recruiter: '/company/settings', company: '/company/settings' };
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
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className={`h-9 px-5 rounded-xl text-sm font-bold transition-colors ${
                    (scrolled || !isDarkHero)
                      ? 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="h-9 px-6 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
                >
                  Join Free
                </Button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                (scrolled || mobileOpen || !isDarkHero)
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-5 space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive(link.to)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <link.icon size={18} className={isActive(link.to) ? 'text-emerald-600' : 'text-slate-400'} />
                {link.label}
              </Link>
            ))}

            {!user && (
              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="flex-1 h-11 rounded-xl border-slate-200 text-slate-700 font-bold"
                >
                  Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold"
                >
                  Join Free
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

      {/* Spacer for non-hero pages */}
      {!isDarkHero && <div className="h-16" />}
    </>
  );
};

export default PublicHeader;
