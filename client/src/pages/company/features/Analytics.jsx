import React from 'react';
import { BarChart2, TrendingUp, Eye, Users, Briefcase, Clock } from 'lucide-react';
import FeatureGate from '@/components/subscription/FeatureGate';

const BARS = [65, 82, 48, 91, 73, 55, 88, 62, 79, 95, 70, 84];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX = Math.max(...BARS);

const FUNNEL = [
  { label: 'Views', value: 1240, pct: 100 },
  { label: 'Applications', value: 312, pct: 25 },
  { label: 'Screening', value: 96, pct: 8 },
  { label: 'Interviews', value: 28, pct: 2 },
  { label: 'Offers', value: 6, pct: 0.5 },
];

const TOP_JOBS = [
  { title: 'Frontend Developer', apps: 48, views: 320 },
  { title: 'Backend Engineer', apps: 35, views: 210 },
  { title: 'Product Manager', apps: 27, views: 180 },
  { title: 'UI/UX Designer', apps: 22, views: 155 },
];

const Analytics = () => (
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

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Views', value: '1,240', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
          { label: 'Applications', value: '312', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', trend: '+8%' },
          { label: 'Active Jobs', value: '7', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+2' },
          { label: 'Time to Hire', value: '14d', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', trend: '-3d' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${k.bg} rounded-xl flex items-center justify-center`}>
                <k.icon size={16} className={k.color} />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{k.trend}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Applications Chart */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-bold text-slate-900">Monthly Applications</p>
          <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <TrendingUp size={13} /> +18% YoY
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-28">
          {BARS.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-emerald-500 rounded-t-md transition-all hover:bg-emerald-600"
                style={{ height: `${(v / MAX) * 100}%` }}
                title={`${MONTHS[i]}: ${v}`}
              />
              <span className="text-[8px] font-semibold text-slate-400">{MONTHS[i].slice(0, 1)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <p className="text-sm font-bold text-slate-900 mb-5">Hiring Funnel</p>
          <div className="space-y-3">
            {FUNNEL.map((f, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700">{f.label}</span>
                  <span className="text-xs font-bold text-slate-900">{f.value.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: `${f.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Jobs */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <p className="text-sm font-bold text-slate-900 mb-5">Top Performing Jobs</p>
          <div className="space-y-3">
            {TOP_JOBS.map((j, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-amber-700">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{j.title}</p>
                  <p className="text-[10px] text-slate-500">{j.apps} apps · {j.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </FeatureGate>
);

export default Analytics;
