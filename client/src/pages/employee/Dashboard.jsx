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
    className={`flex items-start gap-4 p-6 rounded-[24px] border border-slate-200/60 bg-white hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group ${color.replace('text-', 'hover:border-').replace('-600', '-200')}`}
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white shadow-sm transition-all duration-300 ${color.replace('text-', 'bg-').replace('-600', '-50')} group-hover:scale-110`}>
      <Icon size={20} className={color} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">{label}</p>
      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${color.replace('text-', 'bg-').replace('-600', '-50/0')} group-hover:${color.replace('text-', 'bg-').replace('-600', '-50')}`}>
       <ArrowRight size={14} className={`text-slate-300 group-hover:${color} transition-colors`} />
    </div>
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
      {/* Premium Welcome Header */}
      <div className="relative rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-10 text-white shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/20 blur-[80px] rounded-full group-hover:bg-teal-500/30 transition-all duration-700" />
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md">
             <Building2 size={14} className="text-teal-300" />
             <span className="text-[10px] font-bold text-white uppercase tracking-widest">{companyName}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
             Welcome back, {user?.name?.split(' ')[0] || 'Employee'}
          </h1>
          <p className="text-sm md:text-base text-slate-400 font-medium max-w-xl leading-relaxed">
             Browse open roles, monitor application statuses, and collaborate seamlessly utilizing your organizational toolset.
          </p>
          {planName && (
            <Badge className="mt-2 bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-xl backdrop-blur-md">
              <Sparkles size={12} className="mr-1.5" />
              {planName} Tier
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
           <Sparkles size={12} className="text-emerald-500" /> Quick Access
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickCard
            icon={Briefcase}
            label="Browse Jobs"
            desc="Explore thousands of open positions."
            to="/jobs"
            color="text-blue-600"
          />
          <QuickCard
            icon={FileText}
            label="My Applications"
            desc="Track the status of your applications."
            to="/employee/applications"
            color="text-violet-600"
          />
          <QuickCard
            icon={Star}
            label="Saved Jobs"
            desc="Jobs you've bookmarked for later."
            to="/dashboard/saved-jobs"
            color="text-amber-600"
          />
          <QuickCard
            icon={MessageCircle}
            label="Messages"
            desc="Communicate with recruiters directly."
            to="/employee/messages"
            color="text-emerald-600"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        {/* Organization plan */}
        <div className="rounded-[32px] border border-slate-200/60 bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
              <Sparkles size={20} className="text-emerald-600" />
            </div>
            <div>
               <p className="text-lg font-black text-slate-900 tracking-tight">Organization Plan</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Features</p>
            </div>
          </div>
          {planName ? (
            <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-4">{planName} — Active Capability</p>
              <div className="space-y-3">
                 {planFeatures.map(f => (
                   <PlanFeatureRow key={f.key} label={f.label} active={hasFeature(user, f.key)} />
                 ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Building2 size={24} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">No active plan assigned</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">Contact your organization admin.</p>
            </div>
          )}
        </div>

        {/* Profile & settings */}
        <div className="rounded-[32px] border border-slate-200/60 bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-500 flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
              <Settings size={20} className="text-slate-600" />
            </div>
            <div>
               <p className="text-lg font-black text-slate-900 tracking-tight">Your Profile</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Settings</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-black text-2xl shrink-0 overflow-hidden shadow-inner border border-white/20">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : user?.name?.[0]?.toUpperCase() || 'E'}
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 tracking-tight">{user?.name}</p>
              <p className="text-xs font-medium text-slate-500 mb-1">{user?.email}</p>
              <p className="inline-flex text-[9px] text-teal-600 font-black uppercase tracking-[0.2em] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 mt-1">{companyName}</p>
            </div>
          </div>
          
          <div className="mt-auto">
             <Link
               to="/employee/settings"
               className="flex items-center justify-between px-6 py-4 rounded-2xl border border-slate-200/60 hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-md transition-all duration-300 group"
             >
               <span className="text-xs font-bold text-slate-700 uppercase tracking-widest group-hover:text-emerald-700 transition-colors">Edit Profile & Settings</span>
               <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
               </div>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
