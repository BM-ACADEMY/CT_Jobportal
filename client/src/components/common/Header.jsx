import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut, Settings, Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
      { label: 'Post Job', href: '/company/post-job' },
      { label: 'Applicants', href: '/company/applicants' },
      { label: 'Analytics', href: '/company/analytics' },
      { label: 'Settings', href: '/company/settings' },
    ],
  },
  company: {
    label: 'Company',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    navItems: [
      { label: 'Post Job', href: '/company/post-job' },
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
};

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'jobseeker';
  const config = roleConfig[role] || roleConfig.jobseeker;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-semibold text-sm">N</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-semibold tracking-tight text-foreground leading-none">CT Job Portal</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Professional</span>
                </div>
            </Link>
        </div>

        {/* Search */}
        <div className="hidden xl:flex flex-1 justify-center max-w-md">
            <div className="w-full relative group">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                    placeholder="Search jobs, skills..." 
                    className="h-10 pl-9 rounded-md bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-sm"
                />
            </div>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
            {config.navItems?.map((item) => (
                <Link 
                    key={item.href} 
                    to={item.href}
                    className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors whitespace-nowrap"
                >
                    {item.label}
                </Link>
            ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer pl-4 border-l border-border h-8 hover:opacity-80 transition-opacity">
                        <div className="hidden sm:flex flex-col items-end leading-none">
                            <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded border mt-0.5 uppercase tracking-wider ${config.color}`}>
                                {config.label}
                            </span>
                        </div>
                        <Avatar className="w-8 h-8 rounded-full border">
                            <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <ChevronDown size={12} className="text-muted-foreground" />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1 rounded-lg border shadow-lg p-1">
                    <DropdownMenuLabel className="px-3 py-2 font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                            <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => {
                            const routes = { 
                                jobseeker: '/jobseeker/settings', 
                                recruiter: '/company/settings',
                                company: '/company/settings'
                            };
                            navigate(routes[user?.role] || '/jobseeker/settings');
                        }}
                        className="rounded-md px-3 py-2 text-sm cursor-pointer"
                    >
                        <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => { logout(); navigate('/'); }}
                        className="rounded-md px-3 py-2 text-sm cursor-pointer text-destructive focus:text-destructive"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
