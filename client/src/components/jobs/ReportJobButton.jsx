import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '../../context/AuthContext';

const API = import.meta.env.VITE_API_BASE_URL;

const REASONS = [
  ['asks_for_money', 'Asks for money, a fee or a deposit'],
  ['fake_company', 'The company or job looks fake'],
  ['wrong_details', 'Wrong or misleading details'],
  ['other', 'Something else'],
];

// A quiet "Report this job" link. A report never hides the job; our team checks it.
const ReportJobButton = ({ jobId, posterId }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  if (user && posterId && String(user._id || user.id) === String(posterId)) return null; // your own job

  if (!user) {
    return (
      <p className="text-xs text-slate-400 text-center">
        <Link to="/login" className="inline-flex items-center gap-1 font-semibold hover:text-slate-600"><Flag size={12} /> Log in to report this job</Link>
      </p>
    );
  }

  const close = () => { setOpen(false); setReason(''); setNote(''); };

  const send = async () => {
    if (!reason) { toast.error('Please choose a reason'); return; }
    setSending(true);
    try {
      const res = await axios.post(`${API}/jobs/${jobId}/report`, { reason, note }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success(res.data?.msg || 'Thank you. Our team will check this job.');
      close();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not send the report. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <p className="text-center">
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600">
          <Flag size={12} /> Report this job
        </button>
      </p>
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <DialogTitle className="text-lg font-bold text-slate-900">Report this job</DialogTitle>
          <DialogDescription className="text-sm text-slate-600 mt-1">
            Tell us what looks wrong. The job stays visible while our team checks it.
          </DialogDescription>
          <div className="mt-4 space-y-2" role="radiogroup" aria-label="Reason">
            {REASONS.map(([key, label]) => (
              <label key={key} className={`flex items-center gap-3 rounded-xl border p-3 text-sm cursor-pointer ${reason === key ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
                <input type="radio" name="report-reason" value={key} checked={reason === key} onChange={() => setReason(key)} className="accent-emerald-600" />
                {label}
              </label>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Anything else we should know (optional)"
            className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"
          />
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={close}>Cancel</Button>
            <Button className="flex-1" disabled={sending} onClick={send}>{sending ? 'Sending...' : 'Send report'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportJobButton;
