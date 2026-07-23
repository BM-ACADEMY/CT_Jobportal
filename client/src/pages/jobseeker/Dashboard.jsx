import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DetailedJobCard from '../../components/jobseeker/DetailedJobCard';
import RecommendedJobCard from '../../components/jobseeker/RecommendedJobCard';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, QrCode, Smartphone, ExternalLink, Sparkles, TrendingUp, CircleCheck, Loader2 } from 'lucide-react';
import axios from 'axios';

import { useAuth } from '../../context/AuthContext';

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchingJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs/matching`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMatchingJobs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching matching jobs:', err);
        setMatchingJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchingJobs();
  }, []);

  // Map backend jobs to RecommendedJobCard format
  const recommendedJobs = (Array.isArray(matchingJobs) ? matchingJobs : []).slice(0, 4).map(job => ({
    id: job._id,
    title: job.title,
    company: job.company?.name || 'Unknown',
    location: job.location || 'Remote',
    postedAt: new Date(job.createdAt).toLocaleDateString(),
    logo: job.company?.logo || '/default-company-logo.png',
    rating: 4.0 // Mock rating
  }));

  // Map backend jobs to DetailedJobCard format
  const detailedJobs = (Array.isArray(matchingJobs) ? matchingJobs : []).map(job => ({
    id: job._id,
    title: job.title,
    company: job.company?.name || 'Unknown',
    location: job.location || 'Remote',
    experience: `${job.experience?.min || 0} - ${job.experience?.max || 0} Yrs`,
    salary: job.salary?.isRangeHidden ? 'Not disclosed' : `${job.salary?.min || 0} - ${job.salary?.max || 0} ${job.salary?.currency || 'INR'}`,
    summary: job.description?.substring(0, 150) + '...',
    tags: job.skillsRequired || [],
    postedAt: new Date(job.createdAt).toLocaleDateString(),
    logo: job.company?.logo || '/default-company-logo.png',
    rating: 4.0,
    reviews: '100+'
  }));

  return (
    <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-10 py-6">
      
      {/* Main Content Feed */}
      <div className="flex-1 min-w-0 space-y-12">
        {/* Premium Welcome Header */}
        <div className="relative rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-10 text-white shadow-2xl overflow-hidden group">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner border border-white/20 flex items-center justify-center">
                <QrCode className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="space-y-1">
                 <h2 className="text-3xl font-black text-white tracking-tight">Welcome back, {user?.name}</h2>
                 <div className="flex items-center gap-3">
                   <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold tracking-widest text-[10px] uppercase backdrop-blur-md">
                     Job Seeker Portal
                   </Badge>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     ID: <span className="text-emerald-400">{user?.display_id || 'Pending Generate'}</span>
                   </p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {user?.pendingCompanyInvite && (
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-lg shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 fade-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                {user.pendingCompanyInvite.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Organization Invitation</h3>
                <p className="text-sm text-slate-500">You have been invited to join <strong>{user.pendingCompanyInvite.name}</strong>'s team.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button 
                onClick={async () => {
                  try {
                    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/decline-company-invite`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                variant="outline" 
                className="flex-1 md:flex-none border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                Decline
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/accept-company-invite`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                Accept Invite
              </Button>
            </div>
          </div>
        )}
        
        {/* Recommended Jobs */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">Personalized Recommendations</h2>
              <p className="text-sm font-medium text-slate-500">Curated opportunities based on your profile interests.</p>
            </div>
            <Button variant="ghost" className="text-emerald-600 font-bold text-xs hover:bg-emerald-50 h-9 px-4 rounded-lg">View all</Button>
          </div>

          {loading ? (
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-[280px] h-40 bg-slate-50 rounded-2xl animate-pulse shrink-0 border border-slate-100" />
              ))}
            </div>
          ) : recommendedJobs.length === 0 ? (
             <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <Sparkles className="mx-auto text-slate-300 mb-2" size={24} />
               <p className="text-sm font-bold text-slate-500">No recommendations yet</p>
               <p className="text-[10px] text-slate-400">Complete your profile to get matched!</p>
             </div>
          ) : (
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 snap-x">
              {recommendedJobs.map(job => (
                <div key={job.id} className="snap-start shrink-0">
                  <RecommendedJobCard job={job} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CV Banner - Elegant Version */}
        <div className="relative p-8 rounded-[32px] bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100/60 overflow-hidden flex flex-col md:flex-row items-center gap-10 group hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-500">
           <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
             <Sparkles size={160} />
           </div>
           
           <div className="shrink-0 w-24 h-32 bg-white rounded-2xl shadow-md border border-slate-100/80 rotate-[-4deg] flex flex-col gap-2 p-4 transition-transform group-hover:rotate-[-2deg] group-hover:-translate-y-2 duration-500 relative z-10">
              <div className="h-2.5 w-2/3 bg-slate-100 rounded-full" />
              <div className="h-1.5 w-full bg-slate-50 rounded-full mt-2" />
              <div className="h-1.5 w-full bg-slate-50 rounded-full" />
              <div className="h-1.5 w-5/6 bg-slate-50 rounded-full" />
              <div className="mt-auto h-2.5 w-1/3 bg-emerald-100 rounded-full" />
           </div>
           
           <div className="flex-1 text-center md:text-left space-y-4 relative z-10">
              <h3 className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight tracking-tight">Elevate your application with a professional CV</h3>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                 <p className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-xl border border-white">
                    <CircleCheck size={14} className="text-emerald-500" /> AI-guided content
                 </p>
                 <p className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-xl border border-white">
                    <CircleCheck size={14} className="text-emerald-500" /> Pro templates
                 </p>
              </div>
           </div>

           <Button onClick={() => navigate('/jobseeker/resume-builder')} className="relative z-10 shrink-0 h-14 px-8 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:bg-emerald-600 transition-all duration-300 text-xs uppercase tracking-widest hover:-translate-y-1">
             Craft My Resume
           </Button>
        </div>

        {/* Job Listings Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
             <div className="space-y-0.5">
               <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Matches</h2>
               <p className="text-sm font-medium text-slate-500">Directly aligned with your profile requirements.</p>
             </div>
             <div className="flex items-center gap-3">
                {loading && <Loader2 size={16} className="text-emerald-500 animate-spin" />}
                <Button disabled variant="outline" className="h-9 px-4 border-slate-200 text-slate-400 font-bold rounded-lg text-[10px] uppercase tracking-widest">Quick Apply</Button>
             </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />)
            ) : detailedJobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-slate-400 font-medium">No matching jobs found today.</p>
              </div>
            ) : (
              detailedJobs.map(job => (
                <DetailedJobCard key={job.id} job={job} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column Widgets */}
      <div className="hidden xl:flex flex-col gap-8 w-[340px]">
        <Card className="p-8 rounded-[32px] border-slate-200/60 shadow-sm bg-white group hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-500">
          <CardContent className="p-0 space-y-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all duration-500 shadow-sm">
                 <QrCode size={24} />
              </div>
              <div>
                <p className="text-base font-black text-slate-900 leading-tight">Mobile Access</p>
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Scan to Download</p>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">Instant interview alerts, one-tap applications, and status tracking on the go.</p>
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 group-hover:border-slate-200 transition-colors">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Installs: <span className="text-slate-900 font-black">3.5k+</span></span>
               <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                 <ExternalLink size={12} className="text-slate-400" />
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[32px] bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none overflow-hidden h-72 flex flex-col justify-end group cursor-pointer hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 group-hover:rotate-[15deg] transition-all duration-1000 ease-out">
               <TrendingUp size={120} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-80" />
            <div className="p-8 relative z-10 space-y-4">
               <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-xl backdrop-blur-md">Market Report</Badge>
               <h4 className="text-xl font-black leading-tight tracking-tight">The Future of AI in Career Planning</h4>
               <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 group-hover:text-emerald-400 transition-colors uppercase tracking-[0.2em]">Read Insights <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></p>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
