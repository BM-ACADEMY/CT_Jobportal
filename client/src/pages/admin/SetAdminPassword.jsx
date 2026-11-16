import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, ShieldCheck } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

// Opened from the invite mail: a new admin chooses their own password once. The link is single-use and expires in 24 hours.
const SetAdminPassword = () => {
  const [params] = useSearchParams();
  const id = params.get('id') || '';
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== again) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      await axios.post(`${API}/admin/set-password`, { id, token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm p-8" data-testid="set-admin-password">
        <div className="flex items-center gap-2 mb-4 text-emerald-700"><ShieldCheck size={22} /><span className="font-black">Velaivaaipu Admin</span></div>
        {done ? (
          <>
            <h1 className="text-xl font-bold text-slate-900 m-0">Password set</h1>
            <p className="text-slate-600 mt-2">You can sign in now. A code will be mailed to you each time.</p>
            <Link to="/admin/login" className="inline-block mt-4 px-5 h-11 leading-[44px] rounded-xl bg-emerald-600 text-white font-bold">Go to sign in</Link>
          </>
        ) : !id || !token ? (
          <p className="text-slate-600 m-0">This link is not complete. Open it again from the invite email, or ask the Super Admin to send a new invite.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-xl font-bold text-slate-900 m-0">Choose your password</h1>
            <p className="text-sm text-slate-500 m-0">At least 10 characters, with letters and numbers.</p>
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3" placeholder="New password" required minLength={10} />
            <input type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} className="w-full h-11 rounded-xl border border-slate-200 px-3" placeholder="Type it again" required minLength={10} />
            {error && <p className="text-sm text-red-600 m-0" role="alert">{error}</p>}
            <button type="submit" disabled={busy} className="w-full h-11 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2">{busy && <Loader2 className="animate-spin" size={16} />} Set password</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetAdminPassword;
