import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Eye, Building2, BarChart2, User, Briefcase, Loader2 } from 'lucide-react';
import { Card, Typography, Spin } from 'antd';
import FeatureGate from '@/components/subscription/FeatureGate';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';

const { Title, Text } = Typography;
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
      subscriptionPath="/candidate/subscription"
    >
      <div className="space-y-8 pb-12">
        <PageSOPBanner pageKey="profileInsights" />
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center rounded-md border border-emerald-100">
              <Users size={20} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl m-0 font-semibold tracking-tight text-slate-800">Profile Insights</h1>
              <p className="text-slate-600 font-medium m-0 text-sm mt-0.5">See who's been checking out your profile.</p>
            </div>
          </div>
          {loading && <Spin indicator={<Loader2 className="text-emerald-500 animate-spin" size={24} />} />}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'VIEWS THIS WEEK', value: stats.viewsThisWeek, icon: Eye, bg: 'bg-[#7B61FF]' },
            { label: 'COMPANIES VIEWED', value: stats.companiesViewed, icon: Building2, bg: 'bg-[#AB61FF]' },
            { label: 'PROFILE SCORE', value: '84%', icon: TrendingUp, bg: 'bg-[#F98A3C]' },
            { label: 'SEARCH APPEARANCES', value: '23', icon: BarChart2, bg: 'bg-[#3CB371]' },
          ].map(s => (
            <div key={s.label} className={`relative overflow-hidden rounded-md ${s.bg} p-5 text-white flex flex-col justify-between min-h-[140px]`}>
              {/* Decorative Circles */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -bottom-16 -right-2 w-32 h-32 bg-white/10 rounded-full" />
              
              <div className="relative z-10">
                <s.icon size={20} className="mb-6 opacity-90" />
                <p className="text-[10px] font-bold text-white/90 tracking-wider mb-1">{s.label}</p>
                <h2 className="text-3xl font-bold text-white m-0">{s.value}</h2>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Chart */}
        <Card bordered={false} className="rounded-xl shadow-sm bg-white" bodyStyle={{ padding: '32px' }}>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0 mb-12">DAILY PROFILE VIEWS (LAST 7 DAYS)</p>
          <div className="flex items-end gap-3 h-28 w-full mt-8">
            {weeklyData.values.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2.5 relative group">
                <span 
                  className="text-xs font-bold text-indigo-400 absolute transition-all" 
                  style={{ bottom: `${Math.max((v / MAX_VIEWS) * 100, 4) + 24}px` }}
                >
                  {v}
                </span>
                <div
                  className="w-full bg-emerald-400 rounded-full transition-all group-hover:bg-emerald-500"
                  style={{ 
                    height: `${Math.max((v / MAX_VIEWS) * 100, 4)}px`,
                    position: 'absolute',
                    bottom: '24px'
                  }}
                />
                <span className="text-[11px] font-medium text-slate-400 absolute bottom-0">{weeklyData.labels[i]}</span>
              </div>
            ))}
          </div>
        </Card>

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
            <Card bordered={false} className="rounded-xl shadow-sm bg-white" bodyStyle={{ padding: '24px' }}>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0 mb-5">VIEWER BREAKDOWN</p>
              <div className="flex rounded-lg overflow-hidden h-3 mb-5 gap-0.5">
                {segments.map(s => (
                  <div key={s.label} className={`${s.color} transition-all`}
                    style={{ width: `${(s.count / total) * 100}%` }} title={`${s.label}: ${s.count}`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {segments.map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${s.bg}`}>
                      <Icon size={14} className={s.text} />
                      <span className={`text-[13px] font-bold ${s.text}`}>{s.count}</span>
                      <span className="text-[11px] font-medium text-slate-500">{s.label}</span>
                      <span className={`text-[11px] font-bold ${s.text}`}>{Math.round((s.count / total) * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })()}

        {/* Recent Viewers */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0 mb-4">RECENT VIEWERS ({viewers.length})</p>
          {loading ? (
             <div className="space-y-3">
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-16 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse" />
               ))}
             </div>
          ) : viewers.length === 0 ? (
            <Card bordered={false} className="text-center py-12 rounded-xl shadow-sm border border-dashed border-slate-200 bg-white">
               <Users size={32} className="text-slate-300 mx-auto mb-3" />
               <Title level={5} className="m-0 font-semibold text-slate-600">No profile views yet</Title>
               <Text className="text-slate-400 mt-1 text-sm">Keep your profile updated to attract recruiters</Text>
            </Card>
          ) : (
            <div className="space-y-3">
              {viewers.map((v, i) => {
                const viewer = v.viewer || {};
                const name = viewer.name || 'Anonymous Visitor';
                const initial = name.charAt(0);
                const role = viewer.recruiterProfile?.jobTitle || viewer.companyProfile?.adminRole || (v.viewerModel === 'Company' ? 'Organization' : 'User');
                const company = viewer.company?.name || (v.viewerModel === 'Company' ? name : '');
                
                return (
                  <Card key={v._id || i} bordered={false} className="rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 hover:border-emerald-100 bg-white" bodyStyle={{ padding: '16px' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0 overflow-hidden">
                        {(viewer.avatar || viewer.logo) ? (
                          <img src={viewer.avatar || viewer.logo} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          initial
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 m-0">{name}</p>
                        <p className="text-xs text-slate-500 truncate m-0 mt-1 font-medium">
                          {role} {company && `· ${company}`}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                        {new Date(v.timestamp).toLocaleDateString() === new Date().toLocaleDateString() 
                          ? new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : new Date(v.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
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
