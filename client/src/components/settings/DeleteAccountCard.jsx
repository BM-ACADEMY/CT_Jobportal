import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_USER_URL = `${import.meta.env.VITE_API_BASE_URL}/user`;

// "Delete my account" for students, recruiters and team members. Required by Google Play and good practice under DPDP.
const DeleteAccountCard = () => {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await axios.delete(`${API_USER_URL}/me`, { data: { confirm, password } });
      toast.success('Your account has been deleted.');
      logout();
      window.location.href = '/';
    } catch (err) {
      toast.error(err?.response?.data?.msg || 'Could not delete the account. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-6 space-y-3">
      <div className="flex items-center gap-2 text-rose-700 font-bold text-sm"><Trash2 className="w-4 h-4" /> Delete my account</div>
      <p className="text-xs text-slate-600 leading-relaxed">
        This removes your profile, resume, documents, notifications and skill test history, and signs you out everywhere. It cannot be undone.
        Payment records are kept without your name, as the law requires. Company and college owners: write to hello@velaivaaipu.in.
      </p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="h-9 px-4 rounded-lg border border-rose-300 text-rose-700 font-bold text-xs bg-white hover:bg-rose-50">
          I want to delete my account
        </button>
      ) : (
        <div className="space-y-2 max-w-sm">
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type DELETE to confirm" className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password (if you have one)" autoComplete="current-password" className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm" />
          <div className="flex gap-2">
            <button type="button" disabled={busy || confirm.trim() !== 'DELETE'} onClick={submit} className="h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs">
              {busy ? 'Deleting…' : 'Delete permanently'}
            </button>
            <button type="button" onClick={() => { setOpen(false); setConfirm(''); setPassword(''); }} className="h-9 px-4 rounded-lg border border-slate-200 font-bold text-xs bg-white">Keep my account</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteAccountCard;
