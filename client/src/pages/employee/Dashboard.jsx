import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, FileText, MessageCircle, Star, Settings,
  Building2, CheckCircle2, ArrowRight, Sparkles, Lock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { hasFeature } from '@/components/subscription/FeatureGate';
import { Badge } from '@/components/ui/badge';

const QuickCard = ({ icon: Icon, label, desc, to, color }) => (
  <Link
    to={to}
    className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-600/5 transition-all group"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-900 mb-0.5">{label}</p>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
    <ArrowRight size={15} className="text-slate-300 group-hover:text-emerald-500 transition-colors mt-1 shrink-0" />
  </Link>
);

const PlanFeatureRow = ({ label, active }) => (
  <div className="flex items-center gap-2.5">
    <CheckCircle2 size={13} className={active ? 'text-emerald-500' : 'text-slate-200'} />
    <span className={`text-xs font-medium ${active ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
    {!active && <Lock size={10} className="text-slate-300" />}
  </div>
);

const EmployeeDashboard = () => {
  const { user } = useAuth();

  const companyName = user?.employerCompanyName || 'Your Organization';
  const planName = user?.subscription?.name || null;

  const planFeatures = [
    { label: 'Video Interview',      key: 'hasVideoInterview' },
    { label: 'Interview Scheduling', key: 'hasInterviewScheduling' },
    { label: 'Bulk Messaging',       key: 'hasBulkMessaging' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome header */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-7 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Building2 size={15} className="opacity-80" />
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">{companyName}</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0] || 'Employee'}</h1>
          <p className="text-sm opacity-80">Browse jobs, track your applications, and use your organization's tools.</p>
          {planName && (
            <Badge className="mt-4 bg-white/20 text-white border-white/30 text-[10px] font-bold uppercase tracking-widest">
              <Sparkles size={9} className="mr-1" />
              {planName} Plan
            </Badge>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <QuickCard
            icon={Briefcase}
            label="Browse Jobs"
            desc="Explore thousands of open positions."
            to="/jobs"
            color="bg-blue-50 text-blue-600"
          />
          <QuickCard
            icon={FileText}
            label="My Applications"
            desc="Track the status of your job applications."
            to="/employee/applications"
            color="bg-violet-50 text-violet-600"
          />
          <QuickCard
            icon={Star}
            label="Saved Jobs"
            desc="Jobs you've bookmarked for later."
            to="/dashboard/saved-jobs"
            color="bg-amber-50 text-amber-600"
          />
          <QuickCard
            icon={MessageCircle}
            label="Messages"
            desc="Communicate with recruiters directly."
            to="/employee/messages"
            color="bg-emerald-50 text-emerald-600"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Organization plan */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Sparkles size={13} className="text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-900">Organization Plan</p>
          </div>
          {planName ? (
            <div className="space-y-2.5">
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold mb-3">{planName} — Active Features</p>
              {planFeatures.map(f => (
                <PlanFeatureRow key={f.key} label={f.label} active={hasFeature(user, f.key)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-slate-400">No active plan. Contact your organization admin.</p>
            </div>
          )}
        </div>

        {/* Profile & settings */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
              <Settings size={13} className="text-slate-600" />
            </div>
            <p className="text-sm font-bold text-slate-900">Your Profile</p>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : user?.name?.[0]?.toUpperCase() || 'E'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">{companyName}</p>
            </div>
          </div>
          <Link
            to="/employee/settings"
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group"
          >
            <span className="text-xs font-bold text-slate-700">Edit Profile & Settings</span>
            <ArrowRight size={13} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
