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
        
        <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-sm">N</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-primary">naukri</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/jobs" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Jobs</Link>
            <Link to="/companies" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Companies</Link>
            <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Services</Link>
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
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/login')}
                        className="text-xs font-medium"
                    >
                        Login
                    </Button>
                    <Button
                        onClick={() => navigate('/register')}
                        className="rounded-md text-xs font-medium h-9 px-4"
                    >
                        Join Us
                    </Button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
