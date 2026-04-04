import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Badge, Avatar, Dropdown } from 'antd';
import { Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PublicHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userMenuItems = [
    {
      key: 'dashboard',
      label: 'My Dashboard',
      icon: <User size={14} />,
      onClick: () => {
        const routes = { jobseeker: '/jobseeker', recruiter: '/company', admin: '/admin', subadmin: '/subadmin' };
        navigate(routes[user?.role] || '/jobseeker');
      },
    },
    { key: 'settings', label: 'Settings', icon: <Settings size={14} /> },
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
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-md shadow-blue-200">
          <span className="text-white font-black text-lg">N</span>
        </div>
        <span className="text-2xl font-black text-blue-700 tracking-tight">naukri</span>
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        <Link to="/" className="text-gray-600 font-semibold hover:text-blue-600 transition-colors text-sm">Home</Link>
        <a href="#" className="text-gray-600 font-semibold hover:text-blue-600 transition-colors text-sm">Jobs</a>
        <a href="#" className="text-gray-600 font-semibold hover:text-blue-600 transition-colors text-sm">Companies</a>
        <a href="#" className="text-gray-600 font-semibold hover:text-blue-600 transition-colors text-sm">Services</a>
      </nav>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Badge count={2} size="small" offset={[-2, 5]}>
              <Bell size={22} className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors" />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <div className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all rounded-xl px-3 py-2 border border-gray-100">
                <Avatar size={28} icon={<User size={14} />} className="bg-blue-100 text-blue-600 border border-blue-200" />
                <span className="text-sm font-bold text-gray-700 hidden sm:block">{user.name}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </Dropdown>
          </>
        ) : (
          <>
            <Button
              type="text"
              onClick={() => navigate('/login')}
              className="font-bold text-gray-700 hover:text-blue-600"
            >
              Login
            </Button>
            <Button
              type="primary"
              onClick={() => navigate('/register')}
              className="rounded-full font-bold shadow-md shadow-blue-200"
            >
              Register Free
            </Button>
          </>
        )}
      </div>
    </header>
  );
};

export default PublicHeader;
