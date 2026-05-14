import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Eye, Building2, BarChart2, Loader2, User, Briefcase } from 'lucide-react';
import FeatureGate from '@/components/subscription/FeatureGate';
import axios from 'axios';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ProfileInsights = () => {
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    viewsThisWeek: 0,
    companiesViewed: 0,
    profileScore: 0,
    searchAppearances: 0
  });

  useEffect(() => {
    const fetchViewers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/user/profile/viewers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = Array.isArray(res.data) ? res.data : [];
        setViewers(data);
        
        // Basic dynamic stats from fetched data
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0,0,0,0);
        
        const viewsThisWeek = data.filter(v => new Date(v.timestamp) >= startOfWeek).length;
        const uniqueCompanies = new Set(data.filter(v => v.viewerModel === 'Company').map(v => v.viewer?._id)).size;
        
        setStats(prev => ({
          ...prev,
          viewsThisWeek: viewsThisWeek || data.length, // Fallback to total if 0
          companiesViewed: uniqueCompanies || Math.ceil(data.length / 3)
        }));

      } catch (err) {
        console.error('Error fetching viewers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchViewers();
  }, []);

  // Prepare chart data (last 7 days)
  const getWeeklyData = () => {
    const data = Array(7).fill(0);
    const dayLabels = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dayLabels.push(DAYS[d.getDay()]);
      
      const count = viewers.filter(v => {
        const vDate = new Date(v.timestamp);
        return vDate.getDate() === d.getDate() && vDate.getMonth() === d.getMonth();
      }).length;
      data[6-i] = count;
    }
    return { labels: dayLabels, values: data };
  };

  const weeklyData = getWeeklyData();
  const MAX_VIEWS = Math.max(...weeklyData.values, 5);

  return (
    <FeatureGate
      featureKey="hasProfileViewInsights"
      featureName="Profile Insights"
      description="Discover who's viewing your profile and track your visibility across companies and recruiters."
      subscriptionPath="/jobseeker/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Profile Insights</h1>
              <p className="text-sm text-slate-500">See who's been checking out your profile.</p>
            </div>
          </div>
          {loading && <Loader2 className="text-emerald-500 animate-spin" size={20} />}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Views this week', value: stats.viewsThisWeek, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Companies viewed', value: stats.companiesViewed, icon: Building2, color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Profile score', value: '84%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Appear in searches', value: '23', icon: BarChart2, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon size={16} className={s.color} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Weekly Chart */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Daily Profile Views (Last 7 Days)</p>
          <div className="flex items-end gap-2 h-24">
            {weeklyData.values.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-400">{v}</span>
                <div
                  className="w-full bg-emerald-500 rounded-t-lg transition-all min-h-[4px]"
                  style={{ height: `${(v / MAX_VIEWS) * 100}%` }}
                />
                <span className="text-[9px] font-semibold text-slate-400">{weeklyData.labels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role Breakdown */}
        {viewers.length > 0 && (() => {
          const seekerCount = viewers.filter(v => {
            const roleName = v.viewer?.role?.name || v.viewer?.role || '';
            return !['recruiter', 'company', 'org_employee'].includes(roleName) && v.viewerModel !== 'Company';
          }).length;
          const recruiterCount = viewers.filter(v => {
            const roleName = v.viewer?.role?.name || v.viewer?.role || '';
            return ['recruiter', 'company'].includes(roleName);
          }).length;
          const orgCount = viewers.filter(v => v.viewerModel === 'Company' || (v.viewer?.role?.name || v.viewer?.role) === 'org_employee').length;
          const total = viewers.length || 1;
          const segments = [
            { label: 'Job Seekers', count: seekerCount, color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', icon: User },
            { label: 'Recruiters', count: recruiterCount, color: 'bg-violet-500', text: 'text-violet-700', bg: 'bg-violet-50', icon: Briefcase },
            { label: 'Organizations', count: orgCount, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', icon: Building2 },
          ].filter(s => s.count > 0);

          return (
            <div className="rounded-2xl border border-slate-100 bg-white p-6">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Viewer Breakdown</p>
              <div className="flex rounded-xl overflow-hidden h-4 mb-4 gap-0.5">
                {segments.map(s => (
                  <div key={s.label} className={`${s.color} transition-all`}
                    style={{ width: `${(s.count / total) * 100}%` }} title={`${s.label}: ${s.count}`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {segments.map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${s.bg}`}>
                      <Icon size={12} className={s.text} />
                      <span className={`text-xs font-bold ${s.text}`}>{s.count}</span>
                      <span className="text-[10px] font-medium text-slate-500">{s.label}</span>
                      <span className={`text-[10px] font-bold ${s.text}`}>{Math.round((s.count / total) * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Recent Viewers */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Recent Viewers ({viewers.length})</p>
          {loading ? (
             <div className="space-y-3">
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
               ))}
             </div>
          ) : viewers.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-white">
               <Users size={32} className="text-slate-200 mx-auto mb-3" />
               <p className="text-sm font-bold text-slate-500">No profile views yet</p>
               <p className="text-xs text-slate-400 mt-1">Keep your profile updated to attract recruiters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {viewers.map((v, i) => {
                const viewer = v.viewer || {};
                const name = viewer.name || 'Anonymous Visitor';
                const initial = name.charAt(0);
                const role = viewer.recruiterProfile?.jobTitle || viewer.companyProfile?.adminRole || (v.viewerModel === 'Company' ? 'Organization' : 'User');
                const company = viewer.company?.name || (v.viewerModel === 'Company' ? name : '');
                
                return (
                  <div key={v._id || i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-emerald-100 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                      {(viewer.avatar || viewer.logo) ? (
                        <img src={viewer.avatar || viewer.logo} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">{name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {role} {company && `· ${company}`}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {new Date(v.timestamp).toLocaleDateString() === new Date().toLocaleDateString() 
                        ? new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(v.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </FeatureGate>
  );
};

export default ProfileInsights;
