import React, { useEffect, useState } from 'react';
import { Users, Building2, Briefcase, TrendingUp, ShieldCheck, Activity, ChevronRight, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import axios from 'axios';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899'];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, jobs: 0, companies: 0, totalRevenue: 0, revenueData: [], subscriptionData: [] });
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null); // null = checking, then { ok, db, time }

  // Real site check (GET /api/health), repeated every minute while this page is open.
  useEffect(() => {
    let stop = false;
    const check = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/health`, { timeout: 8000 });
        if (!stop) setHealth(res.data);
      } catch {
        if (!stop) setHealth({ ok: false, db: 'down', time: new Date().toISOString() });
      }
    };
    check();
    const id = setInterval(check, 60000);
    return () => { stop = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/dashboard-stats`);
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Premium Header Container */}
      <div className="relative rounded-[32px] bg-slate-900 p-10 text-white shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-all duration-700" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/30 backdrop-blur-md mb-2">
             <Activity size={12} className="text-indigo-400" />
             <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Today at a glance</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Dashboard</h1>
          <p className="text-base text-slate-400 font-medium max-w-xl">Users, jobs, money received and what is waiting for you. All numbers are real.</p>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: loading ? '...' : `₹${Math.round(stats.totalRevenue || 0).toLocaleString('en-IN')}`, sub: loading ? '' : `₹${Math.round(stats.onlineRevenue || 0).toLocaleString('en-IN')} online · ₹${Math.round(stats.manualRevenue?.total || 0).toLocaleString('en-IN')} paid by hand (${stats.manualRevenue?.count || 0}), with GST`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'hover:border-indigo-200' },
          { label: 'Total Users', value: loading ? '...' : stats.users, icon: Users, sub: loading ? '' : Object.entries(stats.usersByRole || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`).join(' · '), color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'hover:border-emerald-200' },
          { label: 'Jobs', value: loading ? '...' : stats.jobs, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', border: 'hover:border-blue-200' },
          { label: 'Organizations', value: loading ? '...' : stats.companies, color: 'text-violet-600', bg: 'bg-violet-50', icon: Building2, border: 'hover:border-violet-200' }
        ].map((stat, i) => (
          <Card key={i} className={`rounded-[32px] border-slate-200/60 shadow-sm bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 ${stat.border}`}>
            <CardContent className="p-8 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-slate-50 rounded-full opacity-50" />
              <div className="flex flex-col gap-5 relative z-10">
                <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl border border-white shadow-sm flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className={`text-4xl font-black tracking-tight tabular-nums ${stat.color}`}>{stat.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                  {stat.sub ? <p className="text-[11px] text-slate-500 mt-2 leading-snug">{stat.sub}</p> : null}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today (India time) */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'New users today', value: stats.today?.newUsers },
          { label: 'New jobs today', value: stats.today?.newJobs },
          { label: 'Applications today', value: stats.today?.applications },
        ].map((t) => (
          <div key={t.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-2xl font-black tabular-nums text-slate-900">{loading ? '...' : (t.value ?? 0)}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Main Section */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Revenue Line Chart */}
        <div className="flex-1 min-w-0">
          <section className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <TrendingUp size={18} className="text-emerald-600" />
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Money received</h2>
               </div>
               <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[10px] font-bold uppercase tracking-tight">
                  By month
               </div>
            </div>

            <div className="flex-1 min-h-[350px]">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Graph...</p>
                </div>
              ) : !(stats.revenueData || []).some((m) => m.revenue > 0) ? (
                <div className="w-full h-full min-h-[350px] flex flex-col items-center justify-center text-center">
                  <p className="text-sm font-bold text-slate-500">No payments yet</p>
                  <p className="text-xs text-slate-400 mt-1">Money received online or marked paid by hand will show here, month by month.</p>
                </div>
              ) : stats.revenueData?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                      tickFormatter={(value) => `₹${value.toLocaleString()}`}
                      dx={-10}
                    />
                    <RechartsTooltip 
                      cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                      itemStyle={{ color: '#10b981', fontWeight: '900' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={4} 
                      dot={{ r: 6, strokeWidth: 3, fill: '#fff' }} 
                      activeDot={{ r: 8, fill: '#10b981', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No revenue data available</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Subscription Pie Chart */}
        <div className="xl:w-[420px] flex flex-col gap-8">
           <section className="bg-white p-8 rounded-[32px] border border-slate-200/60 shadow-sm flex flex-col flex-1">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  <PieChartIcon size={18} className="text-indigo-600" /> Subscription Distribution
                </h2>
              </div>
              
              <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
                {loading ? (
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Data...</p>
                ) : stats.subscriptionData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.subscriptionData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.subscriptionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        formatter={(value) => <span className="text-xs font-bold text-slate-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active subscriptions</p>
                )}
              </div>
           </section>
        </div>
      </div>

      {/* Site status: a real check of the server and database */}
      <section
        className={`rounded-[24px] border p-5 flex items-center justify-between gap-4 ${health === null ? 'bg-white border-slate-200' : health.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-300'}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${health === null ? 'bg-slate-300' : health.ok ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
          <div>
            <p className="text-sm font-bold text-slate-900">
              {health === null ? 'Checking the site...' : health.ok ? 'Site and database are up' : 'The site cannot reach its database'}
            </p>
            <p className="text-xs text-slate-500">
              {health === null ? ' ' : health.ok ? 'Checked just now, repeats every minute.' : 'Tell Sneha now. New sign-ups and payments may fail.'}
            </p>
          </div>
        </div>
      </section>

      {/* Waiting on you: real counts only */}
      <section className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Waiting on you</h2>
          </div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[10px] font-bold uppercase tracking-tight">
            <Link to="/admin/needs-action">See all with owners</Link>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: 'Colleges waiting for verification', count: stats.needsAction?.collegesPending, to: '/admin/colleges' },
            { label: 'Support tickets open', count: stats.needsAction?.ticketsOpen, to: '/admin/tickets' },
            { label: 'New contact messages', count: stats.needsAction?.messagesNew, to: '/admin/messages' },
            { label: 'Reviews waiting for approval', count: stats.needsAction?.reviewsPending, to: '/admin/reviews' },
            { label: 'Requests waiting', count: stats.needsAction?.requestsPending, to: '/admin/requests' },
            { label: 'Jobs flagged as possible scams', count: stats.needsAction?.jobsFlagged, to: '/admin/jobs' },
          ].map((row) => (
            <Link key={row.to} to={row.to} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-between border border-transparent hover:border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                  <ShieldCheck size={16} className="text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-800">{row.label}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-black tabular-nums px-2.5 py-0.5 rounded-md border ${row.count > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {loading ? '...' : (row.count ?? 0)}
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
