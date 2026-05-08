import React from 'react';
import { UserPlus, Briefcase, FileText, Share2, Plus, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CompanyDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-12 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Recruitment Overview</h1>
          <p className="text-base text-slate-500 font-medium">Efficiently manage your organizational postings and applicant pipeline.</p>
        </div>
        <Button className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 group border-none uppercase text-xs tracking-widest">
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          Post Position
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">Quick Operations</p>
          <div className="flex flex-col gap-3">
            <button className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-200 transition-all shadow-sm text-left group">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                 <UserPlus size={20} />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-900">Invite Talent</p>
                 <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tight">Search Directory</p>
              </div>
            </button>
            <button className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-200 transition-all shadow-sm text-left group">
              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                 <FileText size={20} />
              </div>
              <div>
                 <p className="text-sm font-bold text-slate-900">Export Reports</p>
                 <p className="text-[9px] uppercase font-bold text-slate-400 tracking-tight">CSV / PDF Format</p>
              </div>
            </button>
          </div>
        </div>
        
        {/* Analytics Hub */}
        <div className="lg:col-span-3">
           <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="p-8 flex flex-col md:flex-row items-center justify-around gap-8">
                 <div className="text-center group flex-1 space-y-1">
                    <p className="text-3xl font-bold text-slate-900 transition-transform">12</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Postings</p>
                 </div>
                 <div className="w-px h-10 bg-slate-100 hidden md:block" />
                 <div className="text-center group flex-1 space-y-1">
                    <p className="text-3xl font-bold text-emerald-600 transition-transform">248</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Applicants</p>
                 </div>
                 <div className="w-px h-10 bg-slate-100 hidden md:block" />
                 <div className="text-center group flex-1 space-y-1">
                    <p className="text-3xl font-bold text-slate-900 transition-transform">08</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduled Interviews</p>
                 </div>
              </div>
           </Card>
        </div>
      </div>

      <div className="space-y-6">
         <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
               <Briefcase size={20} className="text-emerald-600" /> Recent Activity
            </h2>
            <Button variant="ghost" className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest p-0 h-auto">
               View All Listings
            </Button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Senior Product Designer', applicants: 128, type: 'Remote', posted: '2d ago' },
              { title: 'Backend Engineer (Go)', applicants: 45, type: 'Hybrid', posted: '5d ago' }
            ].map((job, i) => (
               <Card key={i} className="bg-white rounded-[24px] border-slate-200 shadow-sm hover:border-emerald-100 group transition-all">
                  <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex gap-4 items-center">
                       <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 text-base transition-all group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100">
                          {job.title[0]}
                       </div>
                       <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors tracking-tight">{job.title}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                             {job.type} • Posted {job.posted}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-center">
                       <Badge variant="outline" className="bg-emerald-50/50 text-emerald-600 border-emerald-100/50 px-3 py-1 rounded-lg flex items-center gap-2 font-bold text-[10px] tracking-tight">
                          <Users size={12} />
                          <span>{job.applicants} NEW</span>
                       </Badge>
                       <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg text-slate-300 hover:text-slate-400 hover:bg-slate-50">
                          <Share2 size={16} />
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
