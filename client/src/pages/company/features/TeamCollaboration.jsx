import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Shield, Mail, Loader2, Trash2, UserCheck, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const PERM_COLOR = {
  Admin:  'bg-rose-50 text-rose-700',
  Member: 'bg-blue-50 text-blue-700',
  Viewer: 'bg-slate-100 text-slate-600',
};

// ─── Team Members Tab ─────────────────────────────────────────────────────────
const TeamMembersTab = ({ user }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [inviting, setInviting] = useState(false);
  const maxSeats = user?.subscription?.teamCollaborationCount ?? 0;

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchTeam(); }, []);

  const fetchTeam = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/company/team`, { headers });
      setMembers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Team fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/company/team/invite`,
        { email: inviteEmail.trim(), role: inviteRole },
        { headers }
      );
      toast.success(res.data.msg || 'Member added successfully');
      setInviteEmail('');
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId, name) => {
    if (!window.confirm(`Remove ${name} from your team?`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/company/team/${memberId}`, { headers });
      toast.success('Member removed');
      setMembers(prev => prev.filter(m => m._id !== memberId));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Team Members</h2>
          </div>
          <p className="text-sm text-slate-500">Manage hiring team access and permissions.</p>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5 text-center shrink-0">
          <p className="text-base font-bold text-blue-700">
            {loading ? '...' : members.length} / {maxSeats === 0 ? '∞' : maxSeats}
          </p>
          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">Seats Used</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { role: 'Admin',  desc: 'Full access: manage jobs, candidates, billing, and team', color: 'bg-rose-50 border-rose-100' },
          { role: 'Member', desc: 'Post jobs, review applicants, and message candidates',     color: 'bg-blue-50 border-blue-100' },
          { role: 'Viewer', desc: 'Read-only access to pipeline and analytics',               color: 'bg-slate-50 border-slate-100' },
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

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          Team Members {loading ? '' : `(${members.length})`}
        </p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />)}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 bg-white">
            <Users size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-500">No team members yet</p>
            <p className="text-xs text-slate-400 mt-1">Invite colleagues using their registered email below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(m => {
              const memberRole = m.companyProfile?.adminRole || 'Member';
              return (
                <div key={m._id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-100 transition-all">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                    {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : m.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{m.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {m.recruiterProfile?.jobTitle || m.companyProfile?.jobTitle || 'Team Member'} · {m.email}
                    </p>
                  </div>
                  <Badge className={`text-[10px] font-bold border-none shrink-0 ${PERM_COLOR[memberRole] || PERM_COLOR.Member}`}>
                    {memberRole}
                  </Badge>
                  <button onClick={() => handleRemove(m._id, m.name)} className="text-slate-300 hover:text-rose-500 transition-colors shrink-0" title="Remove member">
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <p className="text-sm font-bold text-slate-900 mb-4">Invite by Email</p>
        <p className="text-xs text-slate-500 mb-3">
          The person must already have an account on CT Portal. They'll be linked to your company immediately.
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400"
              placeholder="colleague@company.com"
            />
          </div>
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 bg-white"
          >
            <option>Member</option>
            <option>Viewer</option>
            <option>Admin</option>
          </select>
          <Button
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="h-10 px-5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm gap-2"
          >
            {inviting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Employees Tab ────────────────────────────────────────────────────────────
const EmployeesTab = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', designation: '' });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/company/employees`, { headers });
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Employees fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.email.trim() || !form.name.trim()) {
      toast.error('Name and email are required');
      return;
    }
    setAdding(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/company/employees`,
        form,
        { headers }
      );
      toast.success(res.data.msg);
      setForm({ name: '', email: '', designation: '' });
      setShowForm(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add employee');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (employeeId, name) => {
    if (!window.confirm(`Remove ${name} from your organization? They will lose access.`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/company/employees/${employeeId}`, { headers });
      toast.success('Employee removed');
      setEmployees(prev => prev.filter(e => e._id !== employeeId));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to remove employee');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <UserCheck size={16} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Organization Employees</h2>
          </div>
          <p className="text-sm text-slate-500">
            Employees get their own login and can browse jobs using your organization's plan features.
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5 text-center shrink-0">
          <p className="text-base font-bold text-emerald-700">{loading ? '...' : employees.length}</p>
          <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">Total Employees</p>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 text-sm text-slate-600 leading-relaxed">
        <p className="font-semibold text-slate-800 mb-1">How it works</p>
        <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside">
          <li>Each employee gets a separate login with their own email and password.</li>
          <li>They see a job portal panel (browse, apply, messages) powered by your organization's plan.</li>
          <li>New employees receive an invite email with their temporary login credentials.</li>
          <li>Removing an employee immediately revokes their access.</li>
        </ul>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Employees {loading ? '' : `(${employees.length})`}
          </p>
          <Button
            onClick={() => setShowForm(v => !v)}
            className="h-8 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-1.5"
          >
            <Plus size={13} />
            Add Employee
          </Button>
        </div>

        {showForm && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 mb-5">
            <p className="text-sm font-bold text-slate-900 mb-4">New Employee Details</p>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="relative">
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400"
                  placeholder="Full name *"
                />
              </div>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400"
                  placeholder="Email address *"
                  type="email"
                />
              </div>
              <input
                value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-400"
                placeholder="Designation (optional)"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleAdd}
                disabled={adding || !form.email.trim() || !form.name.trim()}
                className="h-9 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm gap-2"
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create & Send Invite
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowForm(false); setForm({ name: '', email: '', designation: '' }); }}
                className="h-9 px-5 rounded-xl text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />)}
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 bg-white">
            <Building2 size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-500">No employees added yet</p>
            <p className="text-xs text-slate-400 mt-1">Add employees to give them access to the portal under your organization's plan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {employees.map(e => (
              <div key={e._id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-emerald-100 transition-all">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {e.avatar ? <img src={e.avatar} alt={e.name} className="w-full h-full object-cover" /> : e.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{e.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {e.companyProfile?.adminRole || 'Employee'} · {e.email}
                  </p>
                </div>
                <Badge className="text-[10px] font-bold border-none shrink-0 bg-emerald-50 text-emerald-700">
                  Employee
                </Badge>
                <button onClick={() => handleRemove(e._id, e.name)} className="text-slate-300 hover:text-rose-500 transition-colors shrink-0" title="Remove employee">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TeamCollaboration = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('team');

  return (
    <FeatureGate
      featureKey="hasTeamCollaboration"
      featureName="Team Collaboration"
      description="Invite team members, assign roles, collaborate on hiring, and manage your organization's employees."
      subscriptionPath="/company/subscription"
    >
      <div className="space-y-6 pb-12">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('team')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'team' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Team Members
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'employees' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Employees
          </button>
        </div>

        {activeTab === 'team' ? <TeamMembersTab user={user} /> : <EmployeesTab />}
      </div>
    </FeatureGate>
  );
};

export default TeamCollaboration;
