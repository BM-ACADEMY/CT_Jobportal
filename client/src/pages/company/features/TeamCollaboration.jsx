import React from 'react';
import { Users, Plus, Shield, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';

const MEMBERS = [
  { name: 'Meera Patel', role: 'HR Lead', email: 'meera@co.in', status: 'active', perms: 'Admin' },
  { name: 'Rohit Das', role: 'Technical Recruiter', email: 'rohit@co.in', status: 'active', perms: 'Member' },
  { name: 'Sneha Raj', role: 'Talent Sourcer', email: 'sneha@co.in', status: 'invited', perms: 'Viewer' },
];

const permColor = { Admin: 'bg-rose-50 text-rose-700', Member: 'bg-blue-50 text-blue-700', Viewer: 'bg-slate-100 text-slate-600' };

const TeamCollaboration = () => {
  const { user } = useAuth();
  const maxSeats = user?.subscription?.teamCollaborationCount ?? 0;

  return (
    <FeatureGate
      featureKey="hasTeamCollaboration"
      featureName="Team Collaboration"
      description="Invite team members, assign roles, and collaborate on hiring pipelines together."
      subscriptionPath="/company/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Team Collaboration</h1>
            </div>
            <p className="text-sm text-slate-500">Manage team access and hiring permissions.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5 text-center shrink-0">
              <p className="text-base font-bold text-blue-700">{MEMBERS.filter(m => m.status === 'active').length} / {maxSeats === 0 ? '∞' : maxSeats}</p>
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">Seats Used</p>
            </div>
            <Button className="h-10 px-5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm gap-2 shrink-0">
              <Plus size={15} /> Invite Member
            </Button>
          </div>
        </div>

        {/* Roles explanation */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { role: 'Admin', desc: 'Full access: can manage jobs, candidates, billing, and team', color: 'bg-rose-50 border-rose-100' },
            { role: 'Member', desc: 'Can post jobs, review applicants, and message candidates', color: 'bg-blue-50 border-blue-100' },
            { role: 'Viewer', desc: 'Read-only access to pipeline and analytics', color: 'bg-slate-50 border-slate-100' },
          ].map(r => (
            <div key={r.role} className={`rounded-xl border p-4 ${r.color}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <Shield size={13} className="text-slate-600" />
                <p className="text-xs font-bold text-slate-800">{r.role}</p>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Team list */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Team Members</p>
          <div className="space-y-3">
            {MEMBERS.map((m, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-100 transition-all">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {m.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{m.name}</p>
                    {m.status === 'invited' && (
                      <Badge className="text-[9px] bg-amber-50 text-amber-700 border-none font-bold px-1.5 py-0">Pending</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{m.role} · {m.email}</p>
                </div>
                <Badge className={`text-[10px] font-bold border-none shrink-0 ${permColor[m.perms]}`}>{m.perms}</Badge>
                <button className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors shrink-0">Remove</button>
              </div>
            ))}
          </div>
        </div>

        {/* Invite via email */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-sm font-bold text-slate-900 mb-4">Invite by Email</p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400" placeholder="colleague@company.com" />
            </div>
            <select className="h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 bg-white">
              <option>Member</option>
              <option>Viewer</option>
              <option>Admin</option>
            </select>
            <Button className="h-10 px-5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm">Send</Button>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

export default TeamCollaboration;
