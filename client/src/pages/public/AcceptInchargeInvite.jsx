import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { UserCheck, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_BASE_URL;

const AcceptInchargeInvite = () => {
  const { driveId, token } = useParams();
  const navigate = useNavigate();
  const { completeSocialLogin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', phone: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`${API}/college/drives/incharge/verify/${driveId}/${token}`);
        setInvite(res.data);
        setForm(f => ({ ...f, email: res.data.email, phone: res.data.phone }));
      } catch (err) {
        setError(err.response?.data?.msg || 'This invite link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [driveId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.phone || !form.password) return toast.error('All fields are required');
    setSubmitting(true);
    try {
      const endpoint = invite?.alreadyRegistered 
        ? `${API}/college/drives/incharge/accept-existing/${driveId}/${token}`
        : `${API}/college/drives/incharge/accept-new/${driveId}/${token}`;
        
      const res = await axios.post(endpoint, form);
      localStorage.setItem('inchargeDriveId', res.data.driveId || driveId);
      const result = completeSocialLogin(res.data.token, res.data.user);
      toast.success('Access granted!');
      navigate(result.redirect);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to accept invite');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-3">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="text-center">
          <UserCheck size={32} className="text-emerald-600 mx-auto mb-2" />
          <h1 className="text-lg font-black text-slate-900">Drive In-Charge Invite</h1>
          <p className="text-xs text-slate-500 mt-1">
            {invite?.collegeName} invited you to manage <span className="font-bold">{invite?.driveTitle}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confirm Email</Label>
            <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confirm Phone</Label>
            <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Set a Password</Label>
            <Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="h-11 rounded-xl" />
          </div>
          <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            {submitting ? 'Accepting...' : 'Accept & Get Access'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AcceptInchargeInvite;
