import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const API = import.meta.env.VITE_API_BASE_URL;

const Verification = () => {
  const auth = useAuth();
  const token = auth?.token || localStorage.getItem('token');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null); // student being rejected

  useEffect(() => { fetchQueue(); }, []);

  const fetchQueue = async () => {
    try {
      const res = await axios.get(`${API}/college/verification`, { headers: { Authorization: `Bearer ${token}` } });
      setStudents(res.data);
    } catch { toast.error('Failed to load verification queue'); }
    finally { setLoading(false); }
  };

  const runAction = async (studentId, action, reason) => {
    setActing(studentId);
    try {
      await axios.post(`${API}/college/students/${studentId}/verify`, { action, reason }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(action === 'approve' ? 'Student approved and moved to Students list' : 'Student rejected');
      setRejectTarget(null);
      setStudents(p => p.filter(s => s._id !== studentId));
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed to update'); }
    finally { setActing(null); }
  };

  const act = (studentId, action, student) => {
    if (action === 'reject') { setRejectTarget(student); return; }
    runAction(studentId, 'approve');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#39c884]" /> ID Verification Queue
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Students who self-registered from their job-seeker settings and are awaiting your approval, plus anyone with a pending ID document.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin w-7 h-7 border-3 border-[#39c884] border-t-transparent rounded-full" /></div>
      ) : students.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#e8e8e8] rounded-none">
          <Clock size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nothing pending</p>
          <p className="text-xs text-slate-400 mt-1">Self-registered students will show up here for approval.</p>
        </div>
      ) : (
        <div className="bg-white rounded-none border border-[#e8e8e8] shadow-sm divide-y divide-[#f0f0f0]">
          {students.map(s => (
            <div key={s._id} className="flex items-center gap-4 p-4">
              <div className="w-9 h-9 rounded-none bg-emerald-50 flex items-center justify-center text-[#39c884] font-bold text-xs shrink-0">
                {s.user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 text-sm truncate">{s.user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{s.user?.email} · {s.department || 'No department'} · Batch {s.batchYear || '—'}</p>
                <span className="inline-block mt-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-none">
                  Source: {s.registrationSource}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" disabled={acting === s._id} onClick={() => act(s._id, 'approve', s)} className="rounded bg-[#39c884] hover:bg-[#2ea86e] text-white text-xs font-medium gap-1 h-8 px-4 border-none cursor-pointer">
                  <CheckCircle2 size={13} /> Approve
                </Button>
                <Button size="sm" variant="outline" disabled={acting === s._id} onClick={() => act(s._id, 'reject', s)} className="rounded text-xs font-medium gap-1 h-8 px-4 border-red-200 text-red-600 hover:bg-red-50 cursor-pointer">
                  <XCircle size={13} /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title={`Reject ${rejectTarget?.user?.name || 'this student'}'s join request?`}
        confirmLabel="Reject"
        destructive
        loading={acting === rejectTarget?._id}
        reason={{ label: 'Reason (optional)', placeholder: 'Let the student know what needs fixing...' }}
        onConfirm={(reason) => runAction(rejectTarget._id, 'reject', reason)}
      />
    </div>
  );
};

export default Verification;
