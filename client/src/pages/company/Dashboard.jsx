import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';
import { UserPlus, Briefcase, FileText, Plus, Users, Loader2, TrendingUp, Eye, ChevronRight, Sparkles, Building2, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../../context/AuthContext';

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ totalJobs: 0, activeJobs: 0, totalApplicants: 0, shortlisted: 0 });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, analyticsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs/company-jobs-stats`, { headers }),
          axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs/analytics`, { headers }),
        ]);
        const jobsData = Array.isArray(jobsRes.data) ? jobsRes.data : [];
        setJobs(jobsData.slice(0, 4));
        if (analyticsRes.data) {
          setStats({
            totalJobs: analyticsRes.data.totalJobs || 0,
            activeJobs: analyticsRes.data.activeJobs || 0,
            totalApplicants: analyticsRes.data.totalApplicants || 0,
            shortlisted: analyticsRes.data.shortlisted || 0,
          });
        }
      } catch (err) {
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageSOPBanner pageKey="companyDashboard" />
      {/* Header Area with Premium Gradient */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-10 text-white shadow-xl overflow-hidden group">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-700" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                <LayoutDashboard size={20} className="text-emerald-400" />
              </div>
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold tracking-widest text-[10px] uppercase backdrop-blur-md">
                Recruitment Hub
              </Badge>
              {user?.display_id && (
                <Badge variant="secondary" className="bg-white/10 text-white/80 border border-white/10 font-bold tracking-widest text-[10px] uppercase backdrop-blur-md">
                  ID: {user.display_id}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Welcome back, {user?.name || 'Recruiter'}
            </h1>
            <p className="text-sm md:text-base text-slate-400 font-medium max-w-xl leading-relaxed">
              Monitor your active postings, analyze candidate funnels, and discover top-tier talent tailored to your organizational needs.
            </p>
          </div>
          
          <Button
            onClick={() => navigate('/company/post-job')}
            className="shrink-0 h-14 px-8 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-2xl transition-all duration-300 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.7)] flex items-center gap-2 group/btn hover:-translate-y-1 border-none uppercase text-[11px] tracking-[0.2em]"
          >
            <Plus size={18} className="group-hover/btn:rotate-90 transition-transform duration-500" />
            Post New Position
          </Button>
        </div>
      </div>

      {/* Stats - Premium Glassmorphic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Active Postings', value: loading ? '...' : stats.activeJobs, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', icon: Briefcase, shadow: 'hover:shadow-emerald-500/10' },
          { label: 'Total Applicants', value: loading ? '...' : stats.totalApplicants, color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-blue-100', icon: Users, shadow: 'hover:shadow-blue-500/10' },
          { label: 'Shortlisted', value: loading ? '...' : stats.shortlisted, color: 'text-violet-600', bg: 'bg-gradient-to-br from-violet-50 to-violet-100', icon: TrendingUp, shadow: 'hover:shadow-violet-500/10' },
          { label: 'Total Jobs Posted', value: loading ? '...' : stats.totalJobs, color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-50 to-amber-100', icon: Eye, shadow: 'hover:shadow-amber-500/10' },
        ].map((s, i) => (
          <Card key={s.label} className={`rounded-[24px] border-slate-200/60 bg-white hover:-translate-y-1 transition-all duration-300 hover:border-slate-300 shadow-sm ${s.shadow}`}>
            <CardContent className="p-6 flex items-center gap-5 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-slate-50 to-transparent rounded-full opacity-50 pointer-events-none" />
              <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center shrink-0 border border-white/50 shadow-sm relative z-10`}>
                <s.icon size={22} className={s.color} />
              </div>
              <div className="relative z-10">
                {loading ? (
                  <Loader2 size={20} className="text-slate-300 animate-spin mb-1" />
                ) : (
                  <p className={`text-3xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                )}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Quick Actions sidebar */}
        <div className="xl:col-span-1 space-y-5">
          <div className="flex items-center gap-2 px-1">
             <Sparkles size={14} className="text-emerald-500" />
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Quick Operations</p>
          </div>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate('/company/candidate-search')}
              className="flex items-center gap-4 p-5 rounded-[20px] bg-white border border-slate-200/60 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-md shadow-sm">
                <UserPlus size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Find Talent</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5 group-hover:text-emerald-600/70">Browse Candidates</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/company/analytics')}
              className="flex items-center gap-4 p-5 rounded-[20px] bg-white border border-slate-200/60 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm group-hover:shadow-md">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Analytics</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Hiring Metrics</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/company/messages')}
              className="flex items-center gap-4 p-5 rounded-[20px] bg-white border border-slate-200/60 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-md">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Messages</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5 group-hover:text-blue-600/70">Candidate Inbox</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="xl:col-span-3 space-y-5">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
               <Briefcase size={14} className="text-slate-400" />
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Recent Postings</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/company/jobs')}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 uppercase tracking-widest h-8 px-3 rounded-lg flex items-center gap-1"
            >
              View All <ChevronRight size={12} />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               {[1, 2].map(i => <div key={i} className="h-32 bg-slate-50 rounded-[24px] animate-pulse border border-slate-100" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 rounded-[32px] border border-dashed border-slate-200 bg-slate-50/50 backdrop-blur-sm">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                 <Briefcase size={28} className="text-slate-300" />
              </div>
              <p className="text-base font-bold text-slate-700">No active postings yet</p>
              <p className="text-xs font-medium text-slate-500 mt-2 mb-6 max-w-sm mx-auto">Build your team by creating your first job listing and connecting with our talent pool.</p>
              <Button onClick={() => navigate('/company/post-job')} className="rounded-xl h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-md shadow-emerald-500/20">
                Create Posting
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {jobs.map(job => (
                <Card 
                  key={job._id} 
                  className="bg-white rounded-[24px] border-slate-200/60 shadow-sm hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 group transition-all duration-300 cursor-pointer overflow-hidden relative" 
                  onClick={() => navigate(`/company/applicants/${job._id}`)}
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-5">
                       <div className="flex gap-4 items-center min-w-0">
                         <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-300 text-lg transition-all group-hover:bg-emerald-50 group-hover:text-emerald-500 group-hover:border-emerald-100 shrink-0">
                           {job.title?.[0] || 'J'}
                         </div>
                         <div className="space-y-1 min-w-0">
                           <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight truncate">
                             {job.title}
                             {job.isCloned && <span className="ml-2 text-blue-500 font-bold text-[9px] uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded-md">Cloned</span>}
                           </h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                             <span>{job.workMode || job.jobType || 'Full-time'}</span>
                             <span className="w-1 h-1 rounded-full bg-slate-300" />
                             <span>{new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                           </p>
                         </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-auto">
                      <Badge variant="outline" className={`px-2.5 py-1 rounded-xl text-[10px] uppercase tracking-widest font-bold border ${job.status === 'active' ? 'bg-emerald-50/50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {job.status}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest ml-auto">
                        <Users size={12} /> {job.applicantsCount || 0} Candidates
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
