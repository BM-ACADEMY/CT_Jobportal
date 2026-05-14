import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart2, TrendingUp, Eye, Users, Briefcase, Clock, Loader2 } from 'lucide-react';
import FeatureGate from '@/components/subscription/FeatureGate';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const monthlyValues = data?.monthlyData?.map(m => m.count) || [];
  const maxMonthly = Math.max(...monthlyValues, 1);

  const funnel = data
    ? [
        { label: 'Applications', value: data.totalApplicants ?? 0 },
        { label: 'Reviewed', value: data.reviewed ?? 0 },
        { label: 'Shortlisted', value: data.shortlisted ?? 0 },
        { label: 'Rejected', value: data.rejected ?? 0 },
      ]
    : [];

  const funnelMax = funnel[0]?.value || 1;

  return (
    <FeatureGate
      featureKey="hasAnalyticsDashboard"
      featureName="Analytics Dashboard"
      description="Deep insights into your job post performance, candidate funnels, and hiring efficiency metrics."
      subscriptionPath="/company/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <BarChart2 size={16} className="text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Analytics Dashboard</h1>
          </div>
          <p className="text-sm text-slate-500">Monitor hiring performance and optimize your recruitment funnel.</p>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-amber-500" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Jobs', value: data?.totalJobs ?? 0, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Applications', value: data?.totalApplicants ?? 0, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Active Jobs', value: data?.activeJobs ?? 0, icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Shortlisted', value: data?.shortlisted ?? 0, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(k => (
                <div key={k.label} className="rounded-2xl border border-slate-100 bg-white p-5">
                  <div className={`w-9 h-9 ${k.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <k.icon size={16} className={k.color} />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{k.value.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* Monthly Applications Chart */}
            {monthlyValues.length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-bold text-slate-900">Monthly Applications (Last 12 Months)</p>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <TrendingUp size={13} /> Live Data
                  </div>
                </div>
                <div className="flex items-end gap-1.5 h-28">
                  {data.monthlyData.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[8px] font-bold text-slate-400">{m.count || ''}</span>
                      <div
                        className="w-full bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600 min-h-[4px]"
                        style={{ height: `${(m.count / maxMonthly) * 100}%` }}
                        title={`${m.month}: ${m.count} applications`}
                      />
                      <span className="text-[8px] font-semibold text-slate-400">{m.month.slice(0, 1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Hiring Funnel */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6">
                <p className="text-sm font-bold text-slate-900 mb-5">Hiring Funnel</p>
                <div className="space-y-3">
                  {funnel.map((f, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700">{f.label}</span>
                        <span className="text-xs font-bold text-slate-900">{f.value.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${funnelMax > 0 ? (f.value / funnelMax) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversion Rates */}
              <div className="rounded-2xl border border-slate-100 bg-white p-6">
                <p className="text-sm font-bold text-slate-900 mb-5">Conversion Rates</p>
                <div className="space-y-4">
                  {[
                    {
                      label: 'Review Rate',
                      value: data?.totalApplicants
                        ? Math.round(((data.reviewed || 0) / data.totalApplicants) * 100)
                        : 0,
                      color: 'bg-blue-500',
                    },
                    {
                      label: 'Shortlist Rate',
                      value: data?.totalApplicants
                        ? Math.round(((data.shortlisted || 0) / data.totalApplicants) * 100)
                        : 0,
                      color: 'bg-emerald-500',
                    },
                    {
                      label: 'Rejection Rate',
                      value: data?.totalApplicants
                        ? Math.round(((data.rejected || 0) / data.totalApplicants) * 100)
                        : 0,
                      color: 'bg-rose-400',
                    },
                  ].map(r => (
                    <div key={r.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700">{r.label}</span>
                        <span className="text-xs font-bold text-slate-900">{r.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {data?.totalApplicants === 0 && (
                  <p className="text-xs text-slate-400 text-center mt-4">
                    No applicants yet. Post jobs to start seeing metrics.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </FeatureGate>
  );
};

export default Analytics;
