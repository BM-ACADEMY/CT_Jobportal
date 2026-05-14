import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Briefcase, FileText, Plus, Users, Loader2, TrendingUp, Eye, ChevronRight } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto space-y-10 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">
            Recruitment Overview
          </h1>
          <p className="text-base text-slate-500 font-medium">
            Welcome back, <span className="text-slate-700 font-bold">{user?.name || 'Recruiter'}</span>. Here's your hiring summary.
          </p>
        </div>
        <Button
          onClick={() => navigate('/company/post-job')}
          className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 group border-none uppercase text-xs tracking-widest"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          Post Position
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Active Postings', value: loading ? '...' : stats.activeJobs, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Briefcase },
          { label: 'Total Applicants', value: loading ? '...' : stats.totalApplicants, color: 'text-blue-600', bg: 'bg-blue-50', icon: Users },
          { label: 'Shortlisted', value: loading ? '...' : stats.shortlisted, color: 'text-violet-600', bg: 'bg-violet-50', icon: TrendingUp },
          { label: 'Total Jobs Posted', value: loading ? '...' : stats.totalJobs, color: 'text-amber-600', bg: 'bg-amber-50', icon: Eye },
        ].map(s => (
          <Card key={s.label} className="rounded-[20px] border-slate-200 shadow-sm bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <s.icon size={20} className={s.color} />
              </div>
              <div>
                {loading ? (
                  <Loader2 size={18} className="text-slate-300 animate-spin mb-1" />
                ) : (
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                )}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Quick Operations</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/jobs')}
              className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-200 transition-all shadow-sm text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <UserPlus size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Find Talent</p>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tight">Browse Candidates</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/company/analytics')}
              className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-200 transition-all shadow-sm text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Analytics</p>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tight">Hiring Metrics</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/company/messages')}
              className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-200 transition-all shadow-sm text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Messages</p>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tight">Candidate Inbox</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Recent Postings</p>
            <Button
              variant="ghost"
              onClick={() => navigate('/company/jobs')}
              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest h-auto p-0 gap-1"
            >
              View All <ChevronRight size={12} />
            </Button>
          </div>

          {loading ? (
            [1, 2].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />)
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 bg-white">
              <Briefcase size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No jobs posted yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Start attracting candidates by posting your first position.</p>
              <Button onClick={() => navigate('/company/post-job')} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                Post a Job
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {jobs.map(job => (
                <Card key={job._id} className="bg-white rounded-[20px] border-slate-200 shadow-sm hover:border-emerald-100 group transition-all cursor-pointer" onClick={() => navigate(`/company/applicants/${job._id}`)}>
                  <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 text-sm transition-all group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 shrink-0">
                        {job.title?.[0] || 'J'}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight truncate">{job.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {job.workMode || job.jobType || 'Full-time'} · {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${job.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {job.status}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100/50 px-2 py-0.5 rounded-lg flex items-center gap-1 font-bold text-[9px]">
                        <Users size={10} /> {job.applicantsCount || 0}
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
