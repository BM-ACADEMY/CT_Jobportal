import React, { useState, useEffect } from 'react';
import DetailedJobCard from '../../components/jobseeker/DetailedJobCard';
import RecommendedJobCard from '../../components/jobseeker/RecommendedJobCard';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, QrCode, Smartphone, ExternalLink, Sparkles, TrendingUp, CircleCheck, Loader2 } from 'lucide-react';
import axios from 'axios';

const JobSeekerDashboard = () => {
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchingJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/jobs/matching`, {
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
        <div className="relative p-8 rounded-[24px] bg-emerald-50/50 border border-emerald-100 overflow-hidden flex flex-col md:flex-row items-center gap-10 group">
           <div className="shrink-0 w-20 h-28 bg-white rounded-xl shadow-sm border border-slate-100 rotate-[-4deg] flex flex-col gap-2 p-3 transition-transform group-hover:rotate-0 duration-500">
              <div className="h-2 w-2/3 bg-slate-100 rounded" />
              <div className="h-1.5 w-full bg-slate-50 rounded" />
              <div className="h-1.5 w-full bg-slate-50 rounded" />
              <div className="mt-auto h-2 w-1/3 bg-emerald-100 rounded" />
           </div>
           
           <div className="flex-1 text-center md:text-left space-y-3">
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">Elevate your application with a professional CV</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 font-semibold">
                 <p className="flex items-center gap-2">
                    <CircleCheck size={14} className="text-emerald-600" /> AI-guided content
                 </p>
                 <p className="flex items-center gap-2">
                    <CircleCheck size={14} className="text-emerald-600" /> Professional templates
                 </p>
              </div>
           </div>

           <Button className="shrink-0 h-12 px-8 bg-slate-900 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-600 transition-all text-xs uppercase tracking-widest">
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
      <div className="hidden xl:flex flex-col gap-8 w-[320px]">
        <Card className="p-6 rounded-[24px] border-slate-200 shadow-sm bg-white group hover:border-emerald-100 transition-all">
          <CardContent className="p-0 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all duration-500">
                 <QrCode size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">Mobile Access</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Scan to Download</p>
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 leading-relaxed">Instant interview alerts and application tracking on the go.</p>
            <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between border border-slate-100">
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Installs: 3.5k+</span>
               <ExternalLink size={14} className="text-slate-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] bg-slate-900 text-white border-none overflow-hidden h-64 flex flex-col justify-end group cursor-pointer hover:bg-slate-800 transition-all shadow-lg">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
               <TrendingUp size={100} />
            </div>
            <div className="p-8 relative z-10 space-y-3">
               <Badge className="bg-emerald-600 text-white border-none text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">Market Report</Badge>
               <h4 className="text-lg font-bold leading-tight">Gender disparity in career planning transparency</h4>
               <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 group-hover:text-emerald-400 transition-colors uppercase tracking-widest">Read Insights <ChevronRight size={12} /></p>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
