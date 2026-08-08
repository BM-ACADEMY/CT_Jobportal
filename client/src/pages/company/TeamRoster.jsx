import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Users, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageSOPBanner from '@/components/common/PageSOPBanner';

const API = import.meta.env.VITE_API_BASE_URL;

// Read-only "who's on my team" view for delegated team members (recruiters and org_employees).
// Full management (invite/remove/edit-permissions/seat-toggle) is the owner-only /company/team page.
const TeamRoster = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/company/team/roster`, { headers: { Authorization: `Bearer ${token}` } });
        setMembers(res.data);
      } catch {
        toast.error('Failed to load team roster');
      } finally {
        setLoading(false);
      }
    };
    fetchRoster();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 size={32} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <PageSOPBanner pageKey="teamRoster" />
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
          <Users size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Team</h2>
          <p className="text-sm text-slate-500 mt-0.5">Everyone with access to your organization.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        {members.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Users size={24} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No teammates yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">You're the only one on this team so far.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map(m => (
              <div key={m._id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 rounded-xl border border-slate-100">
                    <AvatarImage src={m.avatar?.startsWith('http') ? m.avatar : `${import.meta.env.VITE_API_DOMAIN}${m.avatar}`} />
                    <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold">
                      {m.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{m.name}</h4>
                    <p className="text-xs text-slate-500 mb-1">{m.email}</p>
                    <div className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      m.role?.name === 'company' ? 'bg-amber-50 text-amber-700'
                        : m.role?.name === 'org_employee' ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {m.role?.name === 'company' ? 'Owner' : m.role?.name === 'org_employee' ? 'Employee' : 'Recruiter'}
                    </div>
                  </div>
                </div>
                {m.role?.name !== 'company' && (
                  <div className="flex items-center gap-2 border border-slate-100 px-3 py-1.5 rounded-xl bg-slate-50/50">
                    {m.isActiveSeat ? <ShieldCheck size={14} className="text-emerald-500" /> : <ShieldAlert size={14} className="text-slate-400" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {m.isActiveSeat ? 'Active Seat' : 'No Seat'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamRoster;
