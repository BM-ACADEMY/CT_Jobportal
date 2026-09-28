import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';
import { UserPlus, Briefcase, FileText, Plus, Users, Loader2, TrendingUp, Eye, ChevronRight, Sparkles, Building2, LayoutDashboard } from 'lucide-react';
import { Button, Card, Tag, Typography } from 'antd';
const { Title, Text } = Typography;
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
    <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-10 py-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex-1 min-w-0 space-y-12">
      {/* <PageSOPBanner pageKey="companyDashboard" /> */}
      {/* Header Area with Premium Gradient */}
      {/* Premium Welcome Header */}
      <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ background: 'linear-gradient(135deg, #1b496d 0%, #153e5e 50%, #0d2e49 100%)', borderRadius: 0 }} className="relative shadow-sm overflow-hidden group">
        <div className="p-8 sm:p-10 relative z-10">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#34b678]/10 blur-[80px] rounded-full transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-[#34b678] rounded-none flex items-center justify-center border border-white/10 shrink-0">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div>
                 <div className="flex items-center gap-3 mb-2">
                   <Tag style={{ background: 'rgba(52, 182, 120, 0.2)', borderColor: 'rgba(52, 182, 120, 0.3)', color: '#34b678', fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', fontSize: 9, padding: '2px 8px', borderRadius: 0 }}>
                     Recruitment Hub
                   </Tag>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">
                     ID: <span className="text-[#34b678]">{user?.display_id || 'Pending Generate'}</span>
                   </p>
                 </div>
                 <h2 className="text-2xl font-black text-white tracking-tight m-0">Welcome back, {user?.name || 'Recruiter'}</h2>
                 <p className="text-xs text-slate-400 font-medium max-w-xl leading-relaxed mt-1 m-0">
                   Monitor your active postings, analyze candidate funnels, and discover top-tier talent tailored to your organizational needs.
                 </p>
              </div>
            </div>
            
            <Button
              type="primary"
              onClick={() => navigate('/company/jobs/new')}
              icon={<Plus size={16} />}
              style={{ borderRadius: 0, backgroundColor: '#34b678', borderColor: '#34b678', height: 44, padding: '0 24px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}
            >
              Post New Position
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats - Premium Glassmorphic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Active Postings', value: loading ? '...' : stats.activeJobs, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100', icon: Briefcase, shadow: 'hover:shadow-emerald-500/10' },
          { label: 'Total Applicants', value: loading ? '...' : stats.totalApplicants, color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-blue-100', icon: Users, shadow: 'hover:shadow-blue-500/10' },
          { label: 'Shortlisted', value: loading ? '...' : stats.shortlisted, color: 'text-violet-600', bg: 'bg-gradient-to-br from-violet-50 to-violet-100', icon: TrendingUp, shadow: 'hover:shadow-violet-500/10' },
          { label: 'Total Jobs Posted', value: loading ? '...' : stats.totalJobs, color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-50 to-amber-100', icon: Eye, shadow: 'hover:shadow-amber-500/10' },
        ].map((s, i) => (
          <div key={s.label} className={`rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4 hover:-translate-y-1 transition-all duration-300 ${s.shadow}`}>
             <div className="flex items-center gap-4 relative overflow-hidden">
                <div className={`w-14 h-14 ${s.bg} rounded-none flex items-center justify-center shrink-0 border border-white/50 shadow-sm relative z-10`}>
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
             </div>
          </div>
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
              onClick={() => navigate('/company/candidates')}
              className="flex items-center gap-4 p-5 rounded-none bg-white border border-slate-200/60 hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-none bg-emerald-50 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-md shadow-sm">
                <UserPlus size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Find Talent</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5 group-hover:text-emerald-600/70">Browse Candidates</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/company/analytics')}
              className="flex items-center gap-4 p-5 rounded-none bg-white border border-slate-200/60 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-none bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm group-hover:shadow-md">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Analytics</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Hiring Metrics</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/company/messages')}
              className="flex items-center gap-4 p-5 rounded-none bg-white border border-slate-200/60 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-none bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-md">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Messages</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5 group-hover:text-blue-600/70">Candidate Inbox</p>
              </div>
            </button>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-0.5">
               <Title level={4} style={{ margin: 0 }}>Recent Postings</Title>
               <Text type="secondary">Latest job opportunities posted by your team.</Text>
            </div>
            <Button
              type="link"
              onClick={() => navigate('/company/jobs')}
              style={{ padding: 0, fontWeight: 'bold' }}
            >
              View All <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               {[1, 2].map(i => <div key={i} className="h-32 bg-slate-50 rounded-none animate-pulse border border-slate-100" />)}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-200 bg-slate-50/50 backdrop-blur-sm">
              <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                 <Briefcase size={28} className="text-slate-300" />
              </div>
              <p className="text-base font-bold text-slate-700">No active postings yet</p>
              <p className="text-xs font-medium text-slate-500 mt-2 mb-6 max-w-sm mx-auto">Build your team by creating your first job listing and connecting with our talent pool.</p>
              <Button onClick={() => navigate('/company/jobs/new')} className="rounded-none h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-md shadow-emerald-500/20">
                Create Posting
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {jobs.map(job => (
                <Card 
                  key={job._id} 
                  className="bg-white rounded-none border-slate-200/60 shadow-sm hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 group transition-all duration-300 cursor-pointer overflow-hidden relative" 
                  onClick={async () => {
                    if (job.hasNewCandidates) {
                      try {
                        await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/jobs/${job._id}/mark-viewed`, {}, { headers });
                      } catch (e) { /* ignore */ }
                    }
                    navigate(`/company/applicants/${job._id}`);
                  }}
                >
                  {/* Blue notification dot for new candidates */}
                  {job.hasNewCandidates && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-md shadow-blue-500/50"></span>
                      </span>
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 border border-blue-100">New</span>
                    </div>
                  )}
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-5">
                       <div className="flex gap-4 items-center min-w-0">
                         <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center font-black text-slate-300 text-lg transition-all group-hover:bg-emerald-50 group-hover:text-emerald-500 group-hover:border-emerald-100 shrink-0">
                           {job.title?.[0] || 'J'}
                         </div>
                         <div className="space-y-1 min-w-0">
                           <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight truncate">
                             {job.title}
                             {job.isCloned && <span className="ml-2 text-blue-500 font-bold text-[9px] uppercase tracking-wider bg-blue-50 px-1.5 py-0.5">Cloned</span>}
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
                      <Badge variant="outline" className={`px-2.5 py-1 rounded-none text-[10px] uppercase tracking-widest font-bold border ${job.status === 'active' ? 'bg-emerald-50/50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {job.status}
                      </Badge>
                      <Badge variant="outline" className={`px-2.5 py-1 rounded-none flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest ml-auto ${job.hasNewCandidates ? 'bg-blue-100/80 text-blue-700 border-blue-300' : 'bg-blue-50/50 text-blue-600 border-blue-200'}`}>
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
    </div>
  );
};

export default CompanyDashboard;
