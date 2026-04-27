import React from 'react';
import { Users, Building2, Briefcase, TrendingUp } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

const AdminDashboard = () => {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center gap-4">
        <div className="w-2 h-10 bg-indigo-600 rounded-full" />
        <h1 className="text-3xl font-black text-foreground tracking-tight">Admin Command Center</h1>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: '12,540', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Active Jobs', value: '842', icon: Briefcase, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
          { label: 'Companies', value: '450', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
          { label: 'Daily Traffic', value: '2,400', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' }
        ].map((stat, i) => (
          <Card key={i} className="bg-card p-6 rounded-[28px] border-border shadow-sm hover-lift transition-all group overflow-hidden">
            <CardContent className="p-0">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <p className="text-3xl font-black text-foreground mb-1">{stat.value}</p>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-foreground rounded-[32px] p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-black text-background mb-6">Recent System Activities</h3>
          <div className="space-y-3">
            {[
              { msg: 'New recruiter registration: tech_hire@corp.com', time: '2 mins ago' },
              { msg: 'System backup completed successfully', time: '15 mins ago' },
              { msg: 'New user registered: user_582@gmail.com', time: '45 mins ago' },
              { msg: 'Job post flagged for review: ID_8521', time: '1 hr ago' }
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-background/5 backdrop-blur-md rounded-2xl border border-background/5 hover:bg-background/10 transition-colors group">
                <span className="text-sm text-foreground/80 font-bold group-hover:text-foreground transition-colors">{log.msg}</span>
                <span className="text-[10px] text-foreground/40 font-black uppercase tracking-tighter">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600 opacity-20 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
};

export default AdminDashboard;


