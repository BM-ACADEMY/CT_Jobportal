import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { UserPlus, Trash2, Save, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STAFF_PERMISSIONS, STAFF_ROLES } from '../../config/staffPermissions';

const API = import.meta.env.VITE_API_BASE_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const PermissionPicker = ({ value, onChange, disabled }) => {
  const groups = useMemo(() => {
    const byArea = {};
    STAFF_PERMISSIONS.forEach((p) => { (byArea[p.area] = byArea[p.area] || []).push(p); });
    return Object.entries(byArea);
  }, []);
  const toggle = (key) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  return (
    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
      {groups.map(([area, perms]) => (
        <div key={area}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 m-0 mb-1.5">{area}</p>
          {perms.map((p) => (
            <label key={p.key} className="flex items-start gap-2 text-sm text-slate-700 mb-1.5 cursor-pointer">
              <input type="checkbox" className="mt-1" checked={value.includes(p.key)} onChange={() => toggle(p.key)} disabled={disabled} />
              <span>{p.label}</span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
};

// Super Admin page: who the platform staff are and what each may do. Staff log in with their normal
// account; the server enforces the same permissions on every admin API they can reach.
const ManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [staffRole, setStaffRole] = useState('support');
  const [newPerms, setNewPerms] = useState(STAFF_ROLES.support.permissions);
  const [adding, setAdding] = useState(false);
  const [edits, setEdits] = useState({}); // id -> { staffRole, permissions }
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/admin/staff`, authHeader());
      setStaff(data.staff || []);
    } catch {
      toast.error('Could not load staff.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const pickRole = (role) => { setStaffRole(role); setNewPerms(STAFF_ROLES[role].permissions); };

  const add = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    try {
      const { data } = await axios.post(`${API}/admin/staff`, { email: email.trim(), staffRole, permissions: newPerms }, authHeader());
      toast.success(data.msg);
      setEmail('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not add staff.');
    } finally {
      setAdding(false);
    }
  };

  const draft = (m) => edits[m._id] || { staffRole: m.staffRole || 'support', permissions: m.permissions };
  const setDraft = (m, patch) => setEdits((prev) => ({ ...prev, [m._id]: { ...draft(m), ...patch } }));
  const changeRole = (m, role) => setDraft(m, { staffRole: role, permissions: STAFF_ROLES[role].permissions });

  const save = async (m) => {
    setSavingId(m._id);
    try {
      const { data } = await axios.put(`${API}/admin/staff/${m._id}`, draft(m), authHeader());
      toast.success(data.msg);
      setEdits((prev) => { const n = { ...prev }; delete n[m._id]; return n; });
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not save.');
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (m) => {
    if (!window.confirm(`Remove ${m.name || m.email} from staff? Their account becomes a normal job seeker account.`)) return;
    try {
      const { data } = await axios.delete(`${API}/admin/staff/${m._id}`, authHeader());
      toast.success(data.msg);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not remove.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight m-0">Staff</h1>
        <p className="text-slate-500 mt-1 m-0">Support, counsellors and college verifiers. Each person sees only the areas ticked here; the server enforces the same list.</p>
      </div>

      <form onSubmit={add} className="border border-slate-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-bold text-slate-900 m-0 flex items-center gap-2"><UserPlus size={16} className="text-emerald-600" /> Add a staff member</h2>
        <p className="text-xs text-slate-500 m-0">The person must already have a job seeker account with this email. Companies, colleges and recruiters cannot become staff; ask them to register a separate account.</p>
        <div className="grid sm:grid-cols-[1fr_200px] gap-4">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" className="h-11 px-3 border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
          <select value={staffRole} onChange={(e) => pickRole(e.target.value)} className="h-11 px-3 border border-slate-200 text-sm bg-white">
            {Object.entries(STAFF_ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
          </select>
        </div>
        <PermissionPicker value={newPerms} onChange={setNewPerms} />
        <Button type="submit" disabled={adding} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-none h-10 px-6 text-xs font-bold uppercase tracking-widest">
          {adding ? <Loader2 size={14} className="animate-spin mr-2" /> : <ShieldCheck size={14} className="mr-2" />} Add staff
        </Button>
      </form>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 m-0">Current staff ({staff.length})</h2>
        {loading ? (
          <p className="text-sm text-slate-400 m-0">Loading…</p>
        ) : staff.length === 0 ? (
          <p className="text-sm text-slate-500 border border-dashed border-slate-200 p-6 text-center m-0">No staff yet.</p>
        ) : staff.map((m) => {
          const d = draft(m);
          const dirty = !!edits[m._id];
          return (
            <div key={m._id} className="border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 m-0 break-words">{m.name || m.email} <span className="text-xs font-normal text-slate-400">{m.display_id}</span></p>
                  <p className="text-xs text-slate-500 m-0 break-all">{m.email}{m.grantedAt ? ` · staff since ${new Date(m.grantedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={d.staffRole} onChange={(e) => changeRole(m, e.target.value)} className="h-9 px-2 border border-slate-200 text-sm bg-white">
                    {Object.entries(STAFF_ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                  </select>
                  <Button size="sm" onClick={() => save(m)} disabled={!dirty || savingId === m._id} className="bg-slate-900 text-white rounded-none h-9 text-xs font-bold">
                    <Save size={13} className="mr-1" /> {savingId === m._id ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(m)} className="rounded-none h-9 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50">
                    <Trash2 size={13} className="mr-1" /> Remove
                  </Button>
                </div>
              </div>
              <PermissionPicker value={d.permissions} onChange={(permissions) => setDraft(m, { permissions })} />
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default ManageStaff;
