import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Activity, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API = import.meta.env.VITE_API_BASE_URL;
const permissions = ['dashboard', 'students', 'verification', 'drives', 'reports', 'settings', 'team'];

export default function PlacementTools() {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState('readiness');
  const [readiness, setReadiness] = useState(null);
  const [team, setTeam] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', role: 'department_coordinator', departments: '', permissions: ['dashboard', 'students', 'drives'] });

  const load = async () => {
    try {
      const [r, t, a] = await Promise.all([
        axios.get(`${API}/college/students-profile-completion`, { headers }),
        axios.get(`${API}/college/team`, { headers }),
        axios.get(`${API}/college/audit-log`, { headers })
      ]);
      setReadiness(r.data); setTeam(t.data.members || []); setLogs(a.data || []);
    } catch (e) { toast.error(e.response?.data?.msg || 'Failed to load placement tools'); }
  };
  useEffect(() => { load(); }, []);

  const addMember = async e => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API}/college/team`, { ...form, departments: form.departments.split(',').map(x => x.trim()).filter(Boolean) }, { headers });
      toast.success(data.temporaryPassword ? `Member added. Temporary password: ${data.temporaryPassword}` : 'Member added');
      setForm({ name: '', email: '', role: 'department_coordinator', departments: '', permissions: ['dashboard', 'students', 'drives'] }); load();
    } catch (e) { toast.error(e.response?.data?.msg || 'Could not add member'); }
  };
  const toggleMember = async member => {
    try { await axios.put(`${API}/college/team/${member._id}`, { isActive: !member.isActive }, { headers }); load(); }
    catch (e) { toast.error(e.response?.data?.msg || 'Could not update member'); }
  };
  const togglePermission = key => setForm(p => ({ ...p, permissions: p.permissions.includes(key) ? p.permissions.filter(x => x !== key) : [...p.permissions, key] }));

  return <div className="space-y-6">
    <div><h1 className="text-xl font-black text-slate-900">Placement Operations</h1><p className="text-sm text-slate-500">Student readiness, TPO access and accountable activity in one place.</p></div>
    <div className="flex gap-2 border-b border-slate-200">
      {[['readiness','Profile readiness'],['team','TPO team'],['audit','Audit history']].map(([key,label]) => <button key={key} onClick={() => setTab(key)} className={`px-4 py-3 text-xs font-bold border-b-2 ${tab === key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500'}`}>{label}</button>)}
    </div>
    {tab === 'readiness' && <>
      <div className="grid sm:grid-cols-4 gap-3">
        {[['Average completion', `${readiness?.average || 0}%`],['Placement ready', readiness?.distribution?.ready || 0],['Nearly ready', readiness?.distribution?.nearlyReady || 0],['Incomplete', readiness?.distribution?.incomplete || 0]].map(([label,value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5"><p className="text-[10px] uppercase font-bold text-slate-400">{label}</p><p className="text-2xl font-black text-slate-900 mt-1">{value}</p></div>)}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-[10px] uppercase text-slate-500"><tr><th className="p-3">Student</th><th>Department</th><th>Completion</th><th>Missing information</th></tr></thead><tbody>{(readiness?.students || []).map(s => <tr key={s._id} className="border-t border-slate-50"><td className="p-3"><b>{s.user?.name}</b><div className="text-xs text-slate-400">{s.rollNumber || s.user?.email}</div></td><td>{s.department || '—'}</td><td className="pr-4"><div className="flex items-center gap-2"><div className="h-2 w-24 bg-slate-100 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{width:`${s.score}%`}} /></div><b>{s.score}%</b></div></td><td className="text-xs text-slate-500">{s.missingFields.length ? s.missingFields.join(', ') : <span className="text-emerald-600 font-bold">Ready</span>}</td></tr>)}</tbody></table></div>
    </>}
    {tab === 'team' && <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">
      <form onSubmit={addMember} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3"><h2 className="font-black flex gap-2"><UserPlus size={18}/> Add TPO team member</h2><Input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><Input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><select className="w-full h-10 border rounded-md px-3 text-sm" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="placement_head">Placement Head</option><option value="department_coordinator">Department Coordinator</option><option value="faculty_coordinator">Faculty Coordinator</option><option value="data_entry">Data Entry Staff</option></select><Input placeholder="Departments: CS, IT" value={form.departments} onChange={e=>setForm({...form,departments:e.target.value})}/><div className="flex flex-wrap gap-2">{permissions.map(p=><label key={p} className="text-xs bg-slate-50 rounded-lg px-2 py-1"><input type="checkbox" checked={form.permissions.includes(p)} onChange={()=>togglePermission(p)} className="mr-1"/>{p}</label>)}</div><Button className="w-full bg-emerald-600">Add member</Button></form>
      <div className="space-y-3">{team.length === 0 ? <div className="p-10 text-center bg-white rounded-2xl text-slate-400"><Users className="mx-auto mb-2"/>No additional team members</div> : team.map(m=><div key={m._id} className="bg-white rounded-2xl border border-slate-100 p-4 flex justify-between gap-3"><div><b>{m.user?.name}</b><p className="text-xs text-slate-500">{m.user?.email} · {m.role.replaceAll('_',' ')}</p><p className="text-[10px] text-slate-400 mt-1">{m.departments?.join(', ') || 'All departments'} · {m.permissions?.join(', ')}</p></div><Button variant="outline" size="sm" onClick={()=>toggleMember(m)}>{m.isActive ? 'Deactivate' : 'Activate'}</Button></div>)}</div>
    </div>}
    {tab === 'audit' && <div className="bg-white rounded-2xl border border-slate-100 divide-y">{logs.length === 0 ? <p className="p-8 text-center text-slate-400">No tracked activity yet.</p> : logs.map(l=><div key={l._id} className="p-4 flex gap-3"><Activity size={16} className="text-emerald-600 mt-1"/><div><b className="text-sm">{l.actorName}</b><p className="text-sm text-slate-600">{l.description}</p><p className="text-[10px] text-slate-400">{new Date(l.createdAt).toLocaleString()}</p></div></div>)}</div>}
  </div>;
}
