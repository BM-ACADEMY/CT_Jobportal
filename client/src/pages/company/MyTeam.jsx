import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Plus, Trash2, Mail, Loader2, Pencil, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TeamTypePermissionPicker from '@/components/company/TeamTypePermissionPicker';
import PageSOPBanner from '@/components/common/PageSOPBanner';

const API = import.meta.env.VITE_API_BASE_URL;
const ACTIVITY_PAGE_SIZE = 10;

const MyTeam = () => {
  const [tab, setTab] = useState('members'); // 'members' | 'activity'
  const [members, setMembers] = useState([]); // merged roster: recruiters + org employees
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteType, setInviteType] = useState('employee');
  const [invitePermissions, setInvitePermissions] = useState([]);
  const [inviting, setInviting] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchRoster(); }, []);

  const fetchRoster = async () => {
    try {
      const [teamRes, employeesRes] = await Promise.all([
        axios.get(`${API}/company/team`, { headers }),
        axios.get(`${API}/company/employees`, { headers })
      ]);
      const recruiters = teamRes.data.map(m => ({ ...m, kind: 'recruiter' }));
      const employees = employeesRes.data.map(m => ({ ...m, kind: 'employee' }));
      setMembers([...recruiters, ...employees]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await axios.post(`${API}/company/team/invite`, {
        email: inviteEmail,
        type: inviteType,
        permissions: inviteType === 'recruiter' ? invitePermissions : []
      }, { headers });
      toast.success('Invite sent successfully');
      setInviteEmail('');
      setInviteType('employee');
      setInvitePermissions([]);
      setIsAdding(false);
      fetchRoster();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  };

  const [removeTarget, setRemoveTarget] = useState(null); // { _id, kind }
  const [removing, setRemoving] = useState(false);

  const confirmRemove = async () => {
    setRemoving(true);
    try {
      const path = removeTarget.kind === 'recruiter'
        ? `${API}/company/team/${removeTarget._id}`
        : `${API}/company/employees/${removeTarget._id}`;
      await axios.delete(path, { headers });
      toast.success('Team member removed');
      setRemoveTarget(null);
      fetchRoster();
    } catch (err) {
      toast.error('Failed to remove team member');
    } finally {
      setRemoving(false);
    }
  };

  const [permTarget, setPermTarget] = useState(null); // recruiter row being edited
  const [editPermissions, setEditPermissions] = useState([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const openEditPermissions = (member) => {
    setPermTarget(member);
    setEditPermissions(member.teamPermissions || []);
  };

  const saveEditPermissions = async () => {
    setSavingPermissions(true);
    try {
      await axios.put(`${API}/company/team/${permTarget._id}/permissions`, { permissions: editPermissions }, { headers });
      toast.success('Permissions updated');
      setPermTarget(null);
      fetchRoster();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  // Activity tab state
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityPage, setActivityPage] = useState(1);
  const [activityMemberId, setActivityMemberId] = useState('');
  const [loadingActivity, setLoadingActivity] = useState(false);

  const fetchActivity = async (page = 1, memberId = '') => {
    setLoadingActivity(true);
    try {
      const res = await axios.get(`${API}/company/team-activity`, {
        headers,
        params: { page, limit: ACTIVITY_PAGE_SIZE, memberId: memberId || undefined }
      });
      setActivityLogs(res.data.logs);
      setActivityTotal(res.data.total);
      setActivityPage(res.data.page);
    } catch (err) {
      toast.error('Failed to load activity');
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (tab === 'activity') fetchActivity(1, activityMemberId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, activityMemberId]);

  const activityTotalPages = Math.max(Math.ceil(activityTotal / ACTIVITY_PAGE_SIZE), 1);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 size={40} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Loading team data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <PageSOPBanner pageKey="myTeam" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Users size={20} strokeWidth={2.5} />
            </div>
            My Team
          </h2>
          <p className="text-sm text-slate-500 mt-2 ml-1">
            Manage your organization's team members and staff accounts.
          </p>
        </div>
        {tab === 'members' && (
          <Button
            onClick={() => setIsAdding(!isAdding)}
            className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 gap-2"
          >
            <Plus size={18} />
            {isAdding ? 'Cancel' : 'Add Team Member'}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-slate-100">
        {[['members', 'Members'], ['activity', 'Activity']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors ${
              tab === key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'members' && (
        <>
          {isAdding && (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Add Team Member</h3>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 ml-1">Email Address</label>
                  <div className="relative max-w-md">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 outline-none focus:border-emerald-400 text-sm transition-all"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>
                <TeamTypePermissionPicker
                  type={inviteType}
                  onTypeChange={setInviteType}
                  permissions={invitePermissions}
                  onPermissionsChange={setInvitePermissions}
                />
                <Button type="submit" disabled={inviting} className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {inviting ? 'Sending...' : 'Send Invite'}
                </Button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            {members.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Users size={24} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No team members yet</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                  You haven't added anyone to your organization's team. Add members to let them access the platform.
                </p>
                <Button onClick={() => setIsAdding(true)} className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Add Your First Member
                </Button>
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
                          m.kind === 'recruiter' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {m.kind === 'recruiter' ? 'Recruiter' : 'Employee'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.kind === 'recruiter' && (
                        <button
                          onClick={() => openEditPermissions(m)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all outline-none"
                          title="Manage Permissions"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => setRemoveTarget({ _id: m._id, kind: m.kind })}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all outline-none"
                        title="Remove Member"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'activity' && (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by member</label>
            <select
              value={activityMemberId}
              onChange={e => setActivityMemberId(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-emerald-400"
            >
              <option value="">All team members</option>
              {members.filter(m => m.kind === 'recruiter').map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          {loadingActivity ? (
            <div className="p-12 text-center text-slate-400 text-sm">Loading activity...</div>
          ) : activityLogs.length === 0 ? (
            <div className="p-12 text-center">
              <Clock size={24} className="text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activityLogs.map(log => (
                <div key={log._id} className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{log.actorName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{log.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activityTotalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <button
                disabled={activityPage <= 1}
                onClick={() => fetchActivity(activityPage - 1, activityMemberId)}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Page {activityPage} of {activityTotalPages}
              </span>
              <button
                disabled={activityPage >= activityTotalPages}
                onClick={() => fetchActivity(activityPage + 1, activityMemberId)}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove this member from your team?"
        confirmLabel="Remove"
        destructive
        loading={removing}
        onConfirm={confirmRemove}
      />

      <ConfirmDialog
        open={!!permTarget}
        onOpenChange={(open) => !open && setPermTarget(null)}
        title={`Manage permissions for ${permTarget?.name || 'this recruiter'}`}
        confirmLabel="Save"
        loading={savingPermissions}
        onConfirm={saveEditPermissions}
      >
        <TeamTypePermissionPicker
          type="recruiter"
          showTypeChoice={false}
          permissions={editPermissions}
          onPermissionsChange={setEditPermissions}
        />
      </ConfirmDialog>
    </div>
  );
};

export default MyTeam;
