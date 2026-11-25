import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { UserPlus, Trash2, Send, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API = import.meta.env.VITE_API_BASE_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const LOGIN_URL = `${window.location.origin}/admin/login`;
const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Never');

// Super Admin page: add another full admin by email. The new admin gets a one-time link to choose their own password.
const ManageAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [me, setMe] = useState('');
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [blocked, setBlocked] = useState('');

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/admin/admins`, authHeader());
      setAdmins(data.admins || []);
      setMe(data.me || '');
    } catch (err) {
      // A Limited admin is not allowed on this page: say so plainly instead of an empty list.
      if (err.response?.status === 403) setBlocked(err.response.data?.msg || 'Only the Owner can see and change admins.');
      else toast.error('Could not load admins.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setAdding(true);
    try {
      const { data } = await axios.post(`${API}/admin/admins`, { name: name.trim(), email: email.trim() }, authHeader());
      data.mailed ? toast.success(data.msg) : toast.warning(data.msg);
      setName(''); setEmail('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not add the admin.');
    } finally {
      setAdding(false);
    }
  };

  const resend = async (a) => {
    setBusyId(a._id);
    try {
      const { data } = await axios.post(`${API}/admin/admins/${a._id}/resend-invite`, {}, authHeader());
      data.mailed ? toast.success(data.msg) : toast.warning(data.msg);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not resend.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Remove ${a.name} (${a.email}) as an admin? They will no longer be able to sign in to Admin.`)) return;
    setBusyId(a._id);
    try {
      const { data } = await axios.delete(`${API}/admin/admins/${a._id}`, authHeader());
      toast.success(data.msg);
      load();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not remove.');
    } finally {
      setBusyId(null);
    }
  };

  const copyLogin = () => { navigator.clipboard?.writeText(LOGIN_URL).then(() => toast.success('Login link copied.')).catch(() => toast.error('Could not copy. Select the link and copy it.')); };

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-testid="manage-admins">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight m-0">Admins</h1>
        <p className="text-slate-500 mt-1 m-0">New admins get Limited access: they can review companies and jobs, answer WhatsApp and read users, but cannot delete anything, change money, plans or users, export data, change security or add other admins. Only Owners can do those.</p>
        <p className="text-sm text-slate-600 mt-2 m-0">Admin sign-in page: <span className="font-mono select-all" data-testid="admin-login-url">{LOGIN_URL}</span> <button type="button" onClick={copyLogin} className="inline-flex items-center gap-1 ml-2 h-10 sm:h-auto text-emerald-700 font-bold"><Copy size={14} /> Copy</button></p>
      </div>

      {blocked ? <p className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 font-semibold m-0" data-testid="admins-blocked">{blocked}</p> : <>
      <form onSubmit={add} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
        <label className="text-sm font-bold text-slate-700">Name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3 font-normal text-base sm:text-sm" placeholder="Full name" required />
        </label>
        <label className="text-sm font-bold text-slate-700">Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full h-11 rounded-xl border border-slate-200 px-3 font-normal text-base sm:text-sm" placeholder="name@example.com" required />
        </label>
        <Button type="submit" disabled={adding} className="h-11 gap-2">{adding ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />} Send invite</Button>
        <p className="sm:col-span-3 text-xs text-slate-500 m-0">They get a one-time link by email, valid for 24 hours, to choose their own password. Each sign-in also needs a code mailed to this address.</p>
      </form>

      {loading ? <Loader2 className="animate-spin text-emerald-600" /> : (
        <>
        {/* Phones: one card per admin, so Remove is visible without swiping sideways. */}
        <div className="sm:hidden space-y-3">
          {admins.map((a) => (
            <div key={a._id} data-testid="admin-card" className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-2">
              <div><p className="font-bold text-slate-900 m-0 break-words">{a.name}{String(a._id) === me ? ' (you)' : ''}</p><p className="text-sm text-slate-500 m-0 break-all">{a.email}</p></div>
              <p className="text-sm m-0"><span className={a.level === 'limited' ? 'text-sky-700 font-bold' : 'text-slate-900 font-bold'}>{a.level === 'limited' ? 'Limited' : 'Owner'}</span> · {a.status === 'Active' ? <span className="text-emerald-700 font-bold">Active</span> : <span className="text-amber-700 font-bold">Invite pending</span>}</p>
              <p className="text-xs text-slate-500 m-0">Added {when(a.createdAt)}{a.createdBy ? ` by ${a.createdBy}` : ''}<br />Last sign-in: {when(a.lastLogin)}</p>
              {(a.status !== 'Active' || String(a._id) !== me) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {a.status !== 'Active' && <Button type="button" variant="outline" disabled={busyId === a._id} onClick={() => resend(a)} className="h-10 gap-1"><Send size={14} /> Resend invite</Button>}
                  {String(a._id) !== me && <Button type="button" variant="outline" disabled={busyId === a._id} onClick={() => remove(a)} className="h-10 gap-1 text-red-600"><Trash2 size={14} /> Remove</Button>}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="hidden sm:block bg-white border border-slate-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 text-xs uppercase tracking-wider"><th className="p-3">Admin</th><th className="p-3">Access</th><th className="p-3">Status</th><th className="p-3">Added</th><th className="p-3">Last sign-in</th><th className="p-3" /></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {admins.map((a) => (
                <tr key={a._id} data-testid="admin-row">
                  <td className="p-3"><p className="font-bold text-slate-900 m-0">{a.name}{String(a._id) === me ? ' (you)' : ''}</p><p className="text-slate-500 m-0 break-all">{a.email}</p></td>
                  <td className="p-3"><span data-testid="admin-level" className={a.level === 'limited' ? 'text-sky-700 font-bold' : 'text-slate-900 font-bold'}>{a.level === 'limited' ? 'Limited' : 'Owner'}</span></td>
                  <td className="p-3">{a.status === 'Active' ? <span className="text-emerald-700 font-bold">Active</span> : <span className="text-amber-700 font-bold">Invite pending</span>}</td>
                  <td className="p-3 text-slate-600">{when(a.createdAt)}{a.createdBy ? <span className="block text-xs text-slate-400">by {a.createdBy}</span> : null}</td>
                  <td className="p-3 text-slate-600">{when(a.lastLogin)}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {a.status !== 'Active' && <Button type="button" variant="outline" size="sm" disabled={busyId === a._id} onClick={() => resend(a)} className="gap-1 mr-2"><Send size={14} /> Resend invite</Button>}
                    {String(a._id) !== me && <Button type="button" variant="outline" size="sm" disabled={busyId === a._id} onClick={() => remove(a)} className="gap-1 text-red-600"><Trash2 size={14} /> Remove</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      </>}
    </div>
  );
};

export default ManageAdmins;
