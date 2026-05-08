import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PublicHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDashboardRedirect = () => {
    const routes = { jobseeker: '/jobseeker', recruiter: '/company', admin: '/admin', subadmin: '/subadmin' };
    navigate(routes[user?.role] || '/jobseeker');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        
        <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl italic">C</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">careerpoint</span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
            <Link to="/" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Home</Link>
            <Link to="/jobs" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Find Jobs</Link>
            <Link to="/companies" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Companies</Link>
            <Link to="/services" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors">Services</Link>
        </nav>

        <div className="flex items-center gap-3">
            {user ? (
                <>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                        <Bell size={18} />
                    </Button>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className="flex items-center gap-2 cursor-pointer bg-muted/40 hover:bg-muted/60 transition-all rounded-md px-2 py-1 pr-3 border border-transparent hover:border-border group">
                                <Avatar className="h-7 w-7 rounded-full border">
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-[10px]">
                                        {user.name?.[0]?.toUpperCase() || <User size={12} />}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden sm:flex flex-col items-start leading-none">
                                    <span className="text-xs font-medium text-foreground truncate max-w-[80px]">{user.name}</span>
                                    <span className="text-[8px] text-muted-foreground uppercase tracking-wider mt-0.5">{user.role}</span>
                                </div>
                                <ChevronDown size={12} className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px] rounded-lg border shadow-lg p-1">
                            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Account</DropdownMenuLabel>
                            <DropdownMenuItem onClick={handleDashboardRedirect} className="rounded-md px-3 py-2 text-sm cursor-pointer">
                                <User size={15} className="mr-2 text-muted-foreground" />
                                Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                                onClick={() => {
                                    const routes = { jobseeker: '/jobseeker/settings', recruiter: '/company/profile' };
                                    navigate(routes[user?.role] || '/settings');
                                }}
                                className="rounded-md px-3 py-2 text-sm cursor-pointer"
                            >
                                <Settings size={15} className="mr-2 text-muted-foreground" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={() => { logout(); navigate('/'); }}
                                className="rounded-md px-3 py-2 text-sm cursor-pointer text-destructive focus:text-destructive"
                            >
                                <LogOut size={15} className="mr-2" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            ) : (
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/login')}
                        className="text-sm font-semibold text-slate-600 hover:text-primary hover:bg-emerald-50 rounded-md px-6"
                    >
                        Login
                    </Button>
                    <Button
                        onClick={() => navigate('/register')}
                        className="rounded-md text-sm font-bold h-10 px-8 bg-slate-900 hover:bg-primary text-white shadow-md transition-all"
                    >
                        Join Now
                    </Button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
