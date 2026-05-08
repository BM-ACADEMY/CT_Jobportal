import React from 'react';
import DetailedJobCard from '../../components/jobseeker/DetailedJobCard';
import RecommendedJobCard from '../../components/jobseeker/RecommendedJobCard';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, QrCode, Smartphone, ExternalLink, Sparkles, TrendingUp, CircleCheck } from 'lucide-react';

const mockRecommendedJobs = [
  { id: 1, title: 'HCL Tech-Hiring- B...', company: 'HCLTech', rating: 3.4, location: 'Bengaluru', postedAt: '3d ago', logo: 'https://logo.clearbit.com/hcltech.com' },
  { id: 2, title: 'Walk-in || Service D...', company: 'Wipro', rating: 3.6, location: 'Bengaluru', postedAt: '23h ago', logo: 'https://logo.clearbit.com/wipro.com' },
  { id: 3, title: 'Associate Analy...', company: 'GlobalLogic', rating: 3.5, location: 'Mahbubnagar', postedAt: '1d ago', logo: 'https://logo.clearbit.com/globallogic.com' },
  { id: 4, title: 'Software Engineer', company: 'TCS', rating: 3.8, location: 'Hyderabad', postedAt: '2d ago', logo: 'https://logo.clearbit.com/tcs.com' },
];

const mockDetailedJobs = [
  { 
    id: 1, 
    title: 'HCL Tech-Hiring- Bangalore Location-Freshers-Process Associate', 
    company: 'HCLTech', 
    rating: 3.4, 
    reviews: '45546', 
    experience: '0 Yrs', 
    salary: 'Not disclosed', 
    location: 'Bengaluru', 
    summary: 'HCL Tech-Hiring- Bangalore Location-Freshers-Process Associate / Customer ser...', 
    tags: ['Customer Support', 'BPO', 'Freshers'], 
    postedAt: '3 Days Ago', 
    logo: 'https://logo.clearbit.com/hcltech.com' 
  },
  { 
    id: 2, 
    title: 'Walk-in || Service Desk Administrator', 
    company: 'Wipro', 
    rating: 3.6, 
    reviews: '64633', 
    experience: '07 Apr - 10 Apr', 
    salary: 'Not disclosed', 
    location: 'Bengaluru', 
    summary: 'Shifts: Rotational ( 5 days WFO ). Flexible and Open to working in a 24x7 environ...', 
    tags: ['Service Desk', 'Communication Skills', 'IT Helpdesk', 'L1 Support'], 
    postedAt: '1 Day Ago', 
    logo: 'https://logo.clearbit.com/wipro.com' 
  },
];

const JobSeekerDashboard = () => {
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

          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 snap-x">
            {mockRecommendedJobs.map(job => (
              <div key={job.id} className="snap-start shrink-0">
                <RecommendedJobCard job={job} />
              </div>
            ))}
          </div>
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
               <p className="text-sm font-medium text-slate-500">Directly aligned with your recent search history.</p>
             </div>
             <div className="flex items-center gap-3">
                <Button disabled variant="outline" className="h-9 px-4 border-slate-200 text-slate-400 font-bold rounded-lg text-[10px] uppercase tracking-widest">Quick Apply</Button>
             </div>
          </div>

          <div className="space-y-4">
            {mockDetailedJobs.map(job => (
              <DetailedJobCard key={job.id} job={job} />
            ))}
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
