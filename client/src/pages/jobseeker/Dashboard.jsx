import React from 'react';
import DetailedJobCard from '../../components/jobseeker/DetailedJobCard';
import RecommendedJobCard from '../../components/jobseeker/RecommendedJobCard';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="flex flex-col xl:flex-row gap-8">
      
      {/* Main Content Feed */}
      <div className="flex-1 min-w-0">
        
        {/* Recommended Jobs */}
        <section className="mb-10 bg-card p-8 rounded-[32px] border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-foreground tracking-tight">Recommended for you</h2>
            <Button variant="link" className="text-primary font-extrabold text-sm h-auto p-0 hover:underline">View all</Button>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 snap-x">
            {mockRecommendedJobs.map(job => (
              <div key={job.id} className="snap-start shrink-0">
                <RecommendedJobCard job={job} />
              </div>
            ))}
          </div>
        </section>

        {/* CV Banner */}
        <div className="relative mb-10 p-10 rounded-[32px] bg-primary/5 border border-primary/10 overflow-hidden flex flex-col md:flex-row items-center gap-10">
           <div className="shrink-0 w-24 h-32 bg-background rounded-xl shadow-lg shadow-primary/5 border border-primary/10 rotate-[-4deg] flex flex-col gap-2 p-3">
              <div className="h-3 w-2/3 bg-muted rounded" />
              <div className="h-2 w-full bg-muted/50 rounded" />
              <div className="h-2 w-full bg-muted/50 rounded" />
              <div className="mt-auto h-3 w-1/3 bg-primary rounded" />
           </div>
           
           <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-black text-foreground mb-3 leading-tight">Design a CV that stands out in 10 minutes</h3>
              <div className="space-y-2 text-sm text-muted-foreground font-bold">
                 <p className="flex items-center gap-2 justify-center md:justify-start">
                    <CircleCheck size={16} className="text-green-500" /> AI-powered content suggestions
                 </p>
                 <p className="flex items-center gap-2 justify-center md:justify-start">
                    <CircleCheck size={16} className="text-green-500" /> Recruiter-approved templates
                 </p>
              </div>
           </div>

           <Button className="shrink-0 px-8 py-7 bg-primary text-primary-foreground font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-base">
             Craft My Resume
           </Button>
        </div>

        {/* Job Listings Header */}
        <div className="flex items-center justify-between mb-6 px-1">
           <h2 className="text-xl font-black text-foreground">Recent Job Matches</h2>
           <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Select multiple to quick apply</span>
              <Button disabled variant="outline" className="px-6 py-2 bg-muted/50 text-muted-foreground font-black rounded-xl text-xs">Quick Apply</Button>
           </div>
        </div>

        <div className="space-y-4">
          {mockDetailedJobs.map(job => (
            <DetailedJobCard key={job.id} job={job} />
          ))}
        </div>
      </div>

      {/* Right Column Widgets */}
      <div className="hidden xl:flex flex-col gap-8 w-[340px]">
        <Card className="bg-card p-8 rounded-[32px] border border-border shadow-sm group">
          <CardContent className="p-0">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-muted rounded-2xl border border-border group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                 <QrCode size={40} />
              </div>
              <div>
                <p className="text-base font-black text-foreground leading-tight">Get the App</p>
                <p className="text-xs font-bold text-muted-foreground">Scan to Download</p>
              </div>
            </div>
            <p className="text-sm font-bold text-muted-foreground leading-relaxed mb-6">Never miss an interview alert with our mobile app.</p>
            <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-between border border-primary/10">
               <span className="text-xs font-black text-primary uppercase tracking-tighter">Verified Users: 3.5k+</span>
               <ExternalLink size={16} className="text-primary" />
            </div>
          </CardContent>
        </Card>

        <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden h-64 flex flex-col justify-end group cursor-pointer hover:bg-slate-800 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <TrendingUp size={120} />
            </div>
            <div className="relative z-10">
               <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">Industry Report</span>
               <h4 className="text-lg font-black leading-tight">50% of women hide marriage & family plans from recruiters</h4>
               <p className="text-xs font-bold text-slate-400 mt-3 flex items-center gap-1 group-hover:text-white transition-colors">Read Full Survey <ChevronRight size={14} /></p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
