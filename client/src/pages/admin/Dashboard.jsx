import React, { useEffect, useState } from 'react';
import { Users, Building2, Briefcase, TrendingUp, ShieldCheck, Activity, ChevronRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, jobs: 0, companies: 0 });
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header - Simple & Professional */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">System Overview</h1>
          <p className="text-base text-slate-500 font-medium">Platform intelligence and administrative audit telemetry.</p>
        </div>
        <div className="h-px bg-slate-200 w-full" />
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: loading ? '...' : stats.users, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { label: 'Job Inventory', value: loading ? '...' : stats.jobs, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          // { label: 'Organizations', value: loading ? '...' : stats.companies, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
          { label: 'Uptime', value: '99.9%', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50/50' }
        ].map((stat, i) => (
          <Card key={i} className="rounded-[24px] border-slate-200 shadow-sm bg-white hover:border-emerald-200 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 ${stat.bg} ${stat.color} rounded-xl border border-white shadow-sm`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Section */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Audit Logs */}
        <div className="flex-1 min-w-0">
          <section className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <Activity size={18} className="text-emerald-600" />
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Telemetry</h2>
               </div>
               <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[10px] font-bold uppercase tracking-tight">
                  Live Audit
               </div>
            </div>

            <div className="space-y-4">
              {[
                { msg: 'Global system synchronization finalized', time: '12:30 PM', status: 'SUCCESS' },
                { msg: 'Administrative session authorized: Root Admin', time: '11:45 AM', status: 'SECURITY' },
                { msg: 'Relational database integrity verified', time: '10:15 AM', status: 'STABLE' },
                // { msg: 'New organization registration request: TechCorp', time: '09:30 AM', status: 'PENDING' },
                { msg: 'Automated backup sequence initiated', time: '08:00 AM', status: 'SYSTEM' },
              ].map((log, i) => (
                <div key={i} className="p-4 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-between group border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                       <ShieldCheck size={16} className="text-slate-400" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">{log.msg}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{log.time}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-md border ${
                    log.status === 'SECURITY' ? 'bg-red-50 text-red-600 border-red-100' : 
                    log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
            
            <Button variant="ghost" className="w-full mt-6 text-emerald-600 font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-50 rounded-xl">
               Access Full Audit History <ChevronRight size={14} className="ml-1" />
            </Button>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <div className="xl:w-[340px] flex flex-col gap-8">
            <Card className="rounded-[24px] border-slate-900 bg-slate-900 text-white p-8 relative overflow-hidden group h-60 flex flex-col justify-end shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <TrendingUp size={100} />
              </div>
              <div className="relative z-10">
                 <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.2em] mb-2">Platform Integrity</p>
                 <h3 className="text-xl font-bold leading-tight tracking-tight">Infrastructure status is currently Optimal.</h3>
                 <div className="flex items-center gap-4 mt-6">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => (
                         <div key={i} className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-800" />
                       ))}
                    </div>
                    <span className="text-xs font-medium text-slate-400">99.98% Uptime</span>
                 </div>
              </div>
           </Card>

           <section className="bg-white p-8 rounded-[24px] border border-slate-200 shadow-sm">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Resource telemetry</h4>
              <div className="space-y-6">
                 {[
                   { label: 'Compute capacity', val: 78, color: 'bg-emerald-500' },
                   { label: 'Storage metrics', val: 42, color: 'bg-emerald-600' },
                   { label: 'Network throughput', val: 12, color: 'bg-emerald-400' }
                 ].map((item, i) => (
                   <div key={i} className="space-y-2.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-slate-400">
                         <span>{item.label}</span>
                         <span className="text-slate-900">{item.val}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.val}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
