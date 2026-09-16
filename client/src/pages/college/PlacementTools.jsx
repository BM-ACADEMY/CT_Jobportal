import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Activity, UserPlus, Users, UserCheck, Shield, BookOpen, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API = import.meta.env.VITE_API_BASE_URL;
const permissions = ['dashboard', 'students', 'verification', 'drives', 'reports', 'settings', 'team'];

const antInputClass = "w-full h-9 px-3 text-xs bg-white border border-[#d9d9d9] rounded-none outline-none hover:border-[#39c884] focus:border-[#39c884] focus:shadow-[0_0_0_2px_rgba(57,200,132,0.2)] transition-all placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";
const antSelectClass = "w-full h-9 px-3 text-xs bg-white border border-[#d9d9d9] rounded-none outline-none hover:border-[#39c884] focus:border-[#39c884] focus:shadow-[0_0_0_2px_rgba(57,200,132,0.2)] transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

export default function PlacementTools() {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState('readiness');
  const [readiness, setReadiness] = useState(null);
  const [team, setTeam] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', role: 'department_coordinator', departments: '', permissions: ['dashboard', 'students', 'drives'] });
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    setVisibleCount(15);
  }, [tab]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 150) {
        setVisibleCount(prev => prev + 15);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tab]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <BookOpen size={18} className="text-[#39c884]" /> Placement Operations
        </h1>
        <p className="text-xs text-slate-500 mt-1">Student readiness, TPO access and accountable activity in one place.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[['readiness','Profile Readiness'],['team','TPO Team'],['audit','Audit History']].map(([key,label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors bg-transparent border-none ${
              tab === key ? 'border-[#39c884] text-[#39c884]' : 'border-transparent text-slate-500 hover:text-slate-950'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'readiness' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: 'Average Completion', value: `${readiness?.average || 0}%`, icon: TrendingUp, bgGradient: 'from-[#1b496d] to-[#2a73ab]' },
              { label: 'Placement Ready', value: readiness?.distribution?.ready || 0, icon: CheckCircle2, bgGradient: 'from-[#0d7c7f] to-[#12adac]' },
              { label: 'Nearly Ready', value: readiness?.distribution?.nearlyReady || 0, icon: Clock, bgGradient: 'from-[#b45309] to-[#d97706]' },
              { label: 'Incomplete Profile', value: readiness?.distribution?.incomplete || 0, icon: AlertCircle, bgGradient: 'from-red-700 to-rose-600' }
            ].map((metric, i) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className={`relative overflow-hidden p-5 text-white shadow-sm hover:shadow-md transition-all duration-300 rounded-none bg-gradient-to-br ${metric.bgGradient}`}>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />
                  <div className="flex flex-col h-full justify-between relative z-10">
                    <div className="mb-4 flex items-center justify-between">
                      <Icon size={18} className="text-white opacity-90" strokeWidth={2.5} />
                      <span className="text-[10px] text-white/30 font-black">0{i+1}</span>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/90">{metric.label}</p>
                      <p className="text-2xl font-black text-white tracking-tight mt-1">{metric.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Student Profile Readiness Grid Cards */}
          <div>
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-slate-900">Student Profiles Readiness</h3>
              <p className="text-xs text-slate-400">Detailed overview of completion metrics per student.</p>
            </div>

            {(!readiness?.students || readiness.students.length === 0) ? (
              <div className="p-10 text-center bg-white border border-[#e8e8e8] text-slate-400 rounded-none">
                <Users className="mx-auto mb-2 text-slate-300" />
                No students enrolled in this course batch.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {readiness.students.slice(0, visibleCount).map(s => (
                  <div key={s._id} className="bg-white border border-[#e8e8e8] rounded-none p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-xs truncate">{s.user?.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{s.rollNumber || s.user?.email}</p>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-none shrink-0 uppercase">{s.department || '—'}</span>
                      </div>

                      {/* Progress */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>Profile Score</span>
                          <span className="text-[#39c884]">{s.score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-none overflow-hidden">
                          <div className="h-full bg-[#39c884] transition-all" style={{ width: `${s.score}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Missing Information</span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed truncate-2-lines">
                        {s.missingFields.length ? s.missingFields.join(', ') : <span className="text-emerald-600 font-medium">No missing fields</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div className="grid lg:grid-cols-[1.2fr_1.8fr] gap-6 items-start">
          {/* Add Member Card Form */}
          <form onSubmit={addMember} className="bg-white rounded-none border border-[#e8e8e8] p-5 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900">
              <UserPlus size={16} className="text-[#39c884]" /> Add TPO Team Member
            </h2>
            <div className="space-y-3">
              <input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={antInputClass} />
              <input type="email" placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={antInputClass} />
              <select className={antSelectClass} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                <option value="placement_head">Placement Head</option>
                <option value="department_coordinator">Department Coordinator</option>
                <option value="faculty_coordinator">Faculty Coordinator</option>
                <option value="data_entry">Data Entry Staff</option>
              </select>
              <input placeholder="Departments (e.g. CS, IT)" value={form.departments} onChange={e=>setForm({...form,departments:e.target.value})} className={antInputClass} />

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Access Permissions</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {permissions.map(p=>(
                    <label key={p} className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-none flex items-center gap-1 cursor-pointer hover:bg-slate-100 transition-colors">
                      <input type="checkbox" checked={form.permissions.includes(p)} onChange={()=>togglePermission(p)} className="rounded-none text-[#39c884] focus:ring-[#39c884] h-3 w-3" />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              <Button className="w-full bg-[#39c884] hover:bg-[#2ea86e] text-white text-xs font-medium border-none h-9 rounded cursor-pointer mt-2">Add member</Button>
            </div>
          </form>

          {/* Members List Grid */}
          <div className="space-y-3">
            {team.length === 0 ? (
              <div className="p-10 text-center bg-white border border-[#e8e8e8] rounded-none text-slate-400 shadow-sm">
                <Users className="mx-auto mb-2 text-slate-300"/>
                No additional team members
              </div>
            ) : (
              <div className="grid gap-3">
                {team.map(m => (
                  <div key={m._id} className="bg-white rounded-none border border-[#e8e8e8] p-4 flex justify-between items-center gap-3 shadow-sm hover:shadow-md transition-all">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-xs truncate">{m.user?.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{m.user?.email} · <span className="uppercase text-[10px] font-bold text-slate-400">{m.role.replaceAll('_',' ')}</span></p>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">Depts: {m.departments?.join(', ') || 'All'} · Permissions: {m.permissions?.join(', ')}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={()=>toggleMember(m)}
                      className={`rounded text-[11px] font-medium h-7 px-3 cursor-pointer ${
                        m.isActive
                          ? 'border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700'
                          : 'border-emerald-200 text-[#39c884] hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {m.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-white rounded-none border border-[#e8e8e8] divide-y divide-[#f0f0f0] shadow-sm">
          {logs.length === 0 ? (
            <p className="p-10 text-center text-slate-400 text-xs font-medium">No tracked activity yet.</p>
          ) : (
            logs.map(l => (
              <div key={l._id} className="p-4 flex gap-3 hover:bg-slate-50/50 transition-colors">
                <div className="h-7 w-7 rounded-none bg-emerald-50 flex items-center justify-center text-[#39c884] shrink-0">
                  <Activity size={14} />
                </div>
                <div className="min-w-0">
                  <b className="text-xs text-slate-900">{l.actorName}</b>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{l.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(l.createdAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
