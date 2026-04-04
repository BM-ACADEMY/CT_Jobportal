import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Progress, Button, Avatar } from 'antd';
import { Home, Briefcase, Building2, BookOpen, ChevronRight, LayoutDashboard,
  Users, UserCog, Settings, FileText, TrendingUp, Star, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuConfigs = {
  jobseeker: [
    { icon: Home, label: 'My Home', path: '/jobseeker' },
    { icon: Briefcase, label: 'Browse Jobs', path: '/jobs' },
    { icon: Building2, label: 'Companies', path: '/companies' },
    { icon: FileText, label: 'My Applications', path: '/jobseeker/applications' },
    { icon: Star, label: 'Saved Jobs', path: '/jobseeker/saved' },
    { icon: BookOpen, label: 'Career Advice', path: '/blogs' },
  ],
  recruiter: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/company' },
    { icon: Briefcase, label: 'Post a Job', path: '/company/post-job' },
    { icon: Users, label: 'Applicants', path: '/company/applicants' },
    { icon: TrendingUp, label: 'Analytics', path: '/company/analytics' },
    { icon: Building2, label: 'Company Profile', path: '/company/profile' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Manage Users', path: '/admin/users' },
    { icon: Building2, label: 'Companies', path: '/admin/companies' },
    { icon: TrendingUp, label: 'System Reports', path: '/admin/reports' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ],
  subadmin: [
    { icon: LayoutDashboard, label: 'Overview', path: '/subadmin' },
    { icon: FileText, label: 'Job Moderation', path: '/subadmin/moderation' },
    { icon: Bell, label: 'Reports', path: '/subadmin/reports' },
    { icon: Users, label: 'User Reports', path: '/subadmin/users' },
  ],
};

const roleColors = {
  jobseeker: { active: 'bg-blue-50 text-blue-700 border-blue-100', icon: 'text-blue-600', dot: 'bg-blue-600' },
  recruiter: { active: 'bg-green-50 text-green-700 border-green-100', icon: 'text-green-600', dot: 'bg-green-600' },
  admin: { active: 'bg-red-50 text-red-700 border-red-100', icon: 'text-red-600', dot: 'bg-red-600' },
  subadmin: { active: 'bg-orange-50 text-orange-700 border-orange-100', icon: 'text-orange-600', dot: 'bg-orange-600' },
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || 'jobseeker';
  const menuItems = menuConfigs[role] || menuConfigs.jobseeker;
  const colors = roleColors[role] || roleColors.jobseeker;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <aside className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">

      {/* User Profile Section */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Avatar
              size={44}
              className={`${colors.dot.replace('bg-', 'bg-')} text-white font-black text-lg`}
              style={{ background: role === 'recruiter' ? '#16a34a' : role === 'admin' ? '#dc2626' : role === 'subadmin' ? '#ea580c' : '#2563eb' }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${colors.dot} rounded-full border-2 border-white`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Profile completion for job seekers */}
        {role === 'jobseeker' && (
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-orange-700">Profile Strength</span>
              <span className="text-xs font-black text-orange-600">5%</span>
            </div>
            <div className="w-full bg-orange-100 rounded-full h-1.5">
              <div className="bg-orange-500 h-1.5 rounded-full w-[5%]" />
            </div>
            <Button
              type="primary"
              danger
              size="small"
              block
              className="mt-3 rounded-lg font-bold text-xs"
              onClick={() => navigate('/jobseeker/profile')}
            >
              Complete Profile
            </Button>
          </div>
        )}

        {/* Quick stats for recruiters */}
        {role === 'recruiter' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 rounded-xl p-2.5 text-center border border-green-100">
              <p className="text-lg font-black text-green-700">12</p>
              <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Active Jobs</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
              <p className="text-lg font-black text-blue-700">248</p>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Applicants</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 flex-1">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all group font-semibold text-sm
                ${active
                  ? `${colors.active} border`
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent'
                }`}
            >
              <Icon size={17} className={active ? colors.icon : 'text-gray-400 group-hover:text-gray-500'} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-50">
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-red-500 hover:bg-red-50 transition-all font-semibold text-sm group"
        >
          <LogOut size={17} className="group-hover:rotate-180 transition-transform duration-300" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
