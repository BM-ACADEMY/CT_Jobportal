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
  Menu, X, Briefcase, Building2, Mail, Home, Newspaper
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/jobs', label: 'Find Jobs', icon: Briefcase },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/blog', label: 'Blog', icon: Newspaper },
  { to: '/contact', label: 'Contact', icon: Mail },
];

const PublicHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  <Bell size={18} />
                </Button>

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
                  Employer Login
                </Link>
                <Button
                  onClick={() => navigate('/register')}
                  className="h-10 px-6 rounded-[3px] text-sm font-bold bg-[#138060] hover:bg-[#0f664d] text-white shadow-sm transition-all cursor-pointer"
                >
                  Candidate Login
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
                  Employer Login
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="w-full h-11 rounded-[8px] bg-[#138060] hover:bg-[#0f664d] text-white font-bold"
                >
                  Candidate Login
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
