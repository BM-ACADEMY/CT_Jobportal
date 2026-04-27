import React from 'react';
import { UserPlus, Briefcase, FileText, Share2, Plus, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CompanyDashboard = () => {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Recruiter Command Center</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1">Manage your postings and applicants efficiently</p>
        </div>
        <Button className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 group border-none">
          <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          Post a New Position
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card className="rounded-[32px] border-border shadow-sm p-6 flex flex-col gap-4 bg-card">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-2 mb-2">Quick Actions</h3>
            <button className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/50 text-emerald-700 hover:scale-[1.02] transition-transform border border-emerald-500/10 shadow-sm text-left group">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                 <UserPlus size={24} />
              </div>
              <div>
                 <p className="text-sm font-black">Invite Talent</p>
                 <p className="text-[10px] uppercase font-black opacity-60 tracking-tighter">Premium Feature</p>
              </div>
            </button>
            <button className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 text-muted-foreground hover:bg-muted transition-colors border border-border shadow-sm text-left group">
              <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground">
                 <FileText size={24} />
              </div>
              <div>
                 <p className="text-sm font-black">Export Reports</p>
                 <p className="text-[10px] uppercase font-black opacity-60 tracking-tighter">CSV / PDF format</p>
              </div>
            </button>
          </Card>
        </div>
        
        {/* Analytics Hub */}
        <div className="lg:col-span-3">
           <div className="bg-foreground rounded-[32px] p-1 shadow-lg overflow-hidden">
              <div className="bg-background rounded-[30px] p-8 flex flex-col md:flex-row items-center justify-around gap-8">
                 <div className="text-center group flex-1">
                    <p className="text-4xl font-black text-emerald-600 group-hover:scale-110 transition-transform">12</p>
                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mt-2">Active Postings</p>
                 </div>
                 <div className="w-px h-12 bg-border hidden md:block" />
                 <div className="text-center group flex-1">
                    <p className="text-4xl font-black text-orange-500 group-hover:scale-110 transition-transform">248</p>
                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mt-2">New Applicants</p>
                 </div>
                 <div className="w-px h-12 bg-border hidden md:block" />
                 <div className="text-center group flex-1">
                    <p className="text-4xl font-black text-indigo-600 group-hover:scale-110 transition-transform">08</p>
                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mt-2">Interviews Set</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="space-y-6">
         <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-black text-foreground flex items-center gap-3">
               <Briefcase size={22} className="text-emerald-600" /> Recent Job Postings
            </h2>
            <Button variant="link" className="text-sm font-black text-muted-foreground hover:text-emerald-600 transition-colors uppercase tracking-widest p-0 h-auto">
               View Full History
            </Button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Senior Product Designer', applicants: 128, type: 'Remote', posted: '2d ago' },
              { title: 'Backend Engineer (Go)', applicants: 45, type: 'Hybrid', posted: '5d ago' }
            ].map((job, i) => (
               <Card key={i} className="bg-card rounded-[28px] border-border shadow-sm hover-lift group overflow-hidden">
                  <CardContent className="p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex gap-5 items-center">
                       <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center font-black text-muted-foreground text-lg border border-border group-hover:border-emerald-600/20 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/20 transition-all">
                          {job.title[0]}
                       </div>
                       <div>
                          <h4 className="text-lg font-black text-foreground group-hover:text-emerald-600 transition-colors leading-tight mb-1">{job.title}</h4>
                          <p className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                             {job.type} • Posted {job.posted}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                       <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900 px-3 py-1.5 rounded-full flex items-center gap-2 hover:bg-emerald-50 transition-none font-black text-xs whitespace-nowrap">
                          <Users size={14} />
                          <span>{job.applicants} New</span>
                       </Badge>
                       <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl bg-muted/30 border-transparent hover:border-border transition-all">
                          <Share2 size={18} className="text-muted-foreground" />
                       </Button>
                    </div>
                  </CardContent>
               </Card>
            ))}
         </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
