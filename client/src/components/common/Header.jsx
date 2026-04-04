import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Avatar, Dropdown, Input } from 'antd';
import { Search, Bell, User, LogOut, Settings, Menu, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const roleConfig = {
  jobseeker: {
    label: 'Job Seeker',
    color: 'bg-blue-100 text-blue-700',
    navItems: [
      { label: 'Jobs', href: '/jobs' },
      { label: 'Companies', href: '/companies' },
      { label: 'Services', href: '/services' },
    ],
  },
  recruiter: {
    label: 'Recruiter',
    color: 'bg-green-100 text-green-700',
    navItems: [
      { label: 'Post Job', href: '/company/post-job' },
      { label: 'Applicants', href: '/company/applicants' },
      { label: 'Analytics', href: '/company/analytics' },
    ],
  },
  admin: {
    label: 'Admin',
    color: 'bg-red-100 text-red-700',
    navItems: [
      { label: 'Users', href: '/admin/users' },
      { label: 'Companies', href: '/admin/companies' },
      { label: 'Reports', href: '/admin/reports' },
    ],
  },
  subadmin: {
    label: 'Sub-Admin',
    color: 'bg-orange-100 text-orange-700',
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

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div className="py-1">
          <p className="font-bold text-gray-800">{user?.name || 'User'}</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'settings',
      label: 'Settings',
      icon: <Settings size={14} />,
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogOut size={14} />,
      danger: true,
      onClick: () => { logout(); navigate('/'); },
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-md shadow-blue-200">
            <span className="text-white font-black text-base">N</span>
          </div>
          <span className="text-xl font-black text-blue-700 tracking-tight hidden sm:block">naukri</span>
        </Link>

        {/* Role Badge */}
        <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 hidden md:inline-flex ${config.color}`}>
          {config.label}
        </span>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-6 flex-1 ml-4">
          {config.navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-gray-600 font-semibold text-sm hover:text-blue-600 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
          <Input
            prefix={<Search size={15} className="text-gray-400 mr-1" />}
            placeholder="Search..."
            className="rounded-full bg-gray-50 border-gray-200 hover:border-blue-300 text-sm h-9"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge count={3} size="small" offset={[-2, 4]}>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors">
              <Bell size={20} className="text-gray-500 hover:text-blue-600" />
            </button>
          </Badge>

          <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
            <div className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all rounded-xl px-3 py-2 border border-gray-100">
              <Avatar
                size={28}
                className="bg-blue-600 text-white font-bold text-sm flex-shrink-0"
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <div className="hidden xl:block max-w-[100px]">
                <p className="text-xs font-bold text-gray-700 truncate">{user?.name || 'User'}</p>
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default Header;
