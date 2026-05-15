import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Mic, CheckCircle2, Send, Loader2, AlertCircle, X, RefreshCw, ChevronLeft, ChevronRight, ClipboardList, CalendarCheck, MonitorPlay, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import FeatureGate from '@/components/subscription/FeatureGate';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 5;

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Approved',  color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'approved',  label: 'Approved' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

/* ─── Request Modal ─────────────────────────────────────────────────────────── */
const RequestModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ skills: '', careerGoal: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.skills.trim()) { setError('Please enter your skills.'); return; }
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/requests/interview-prep`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setDone(true);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Request AI Mock Interview</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tell us about your skills and goals</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-all">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={22} className="text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 mb-1">Request Submitted!</p>
            <p className="text-xs text-slate-500 mb-5">We'll prepare a personalised mock interview session for you.</p>
            <Button onClick={onClose} variant="outline" className="rounded-xl h-9 px-5 text-xs font-bold">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="skills" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Your Skills *</Label>
              <Input id="skills" placeholder="e.g. React, Node.js, System Design"
                value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                className="rounded-xl border-slate-200 focus:border-teal-400 text-sm" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Career Goal</Label>
              <Textarea id="goal" placeholder="e.g. Senior Frontend Engineer at a fintech startup"
                value={form.careerGoal} onChange={e => setForm(f => ({ ...f, careerGoal: e.target.value }))}
                className="rounded-xl border-slate-200 focus:border-teal-400 text-sm resize-none" rows={3} />
            </div>
            {error && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2 flex items-center gap-2">
                <AlertCircle size={12} className="shrink-0" /> {error}
              </p>
            )}
            <Button type="submit" disabled={loading}
              className="w-full h-10 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <><Send size={14} /> Submit Request</>}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ─── Requests Table ─────────────────────────────────────────────────────────── */
const RequestsTable = ({ requests, loading, onCancel }) => {
  const [filter, setFilter]         = useState('all');
  const [page, setPage]             = useState(1);
  const [confirmId, setConfirmId]   = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { setPage(1); }, [filter]);

  const filtered   = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const cancellable = (status) => status === 'pending' || status === 'approved';

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await axios.patch(`${API}/requests/interview-prep/${confirmId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setConfirmId(null);
      onCancel();
    } catch {
      // silent — user can retry
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      {/* Cancel confirmation modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-11 h-11 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={20} className="text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">Cancel this request?</h3>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              Your mock interview request will be cancelled. You can submit a new one at any time.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                disabled={cancelling}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Keep It
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {cancelling ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 px-4 pt-4 pb-3 border-b border-slate-100">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              filter === f.key
                ? 'bg-teal-500 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-slate-400" />
        </div>
      ) : pageItems.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-slate-400 font-medium">
            {filter === 'all' ? 'No requests submitted yet.' : 'No requests match this filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">#</th>
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">Skills</th>
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">Career Goal</th>
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">Admin Notes</th>
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">Requested On</th>
                <th className="py-2.5 px-3" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r, i) => {
                const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                const globalIndex = (safePage - 1) * PAGE_SIZE + i + 1;
                return (
                  <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-semibold">{globalIndex}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium max-w-[160px] truncate">{r.skills || '—'}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-[180px] truncate">{r.careerGoal || '—'}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-[180px] truncate">{r.adminNotes || '—'}</td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-3">
                      {cancellable(r.status) && (
                        <button
                          onClick={() => setConfirmId(r._id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                        >
                          <X size={11} /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-colors ${
                  n === safePage
                    ? 'bg-teal-500 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const InterviewPrep = () => {
  const [showModal, setShowModal]   = useState(false);
  const [requests, setRequests]     = useState([]);
  const [tableLoading, setTableLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await axios.get(`${API}/requests/my-interview-prep`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRequests(res.data || []);
    } catch {
      // silently fail
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  return (
    <FeatureGate
      featureKey="hasInterviewPrep"
      featureName="Interview Prep"
      description="Practice with AI-powered mock interviews, role-specific question banks, and instant feedback to ace your next interview."
      subscriptionPath="/jobseeker/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <Briefcase size={16} className="text-teal-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Interview Prep</h1>
            </div>
            <p className="text-sm text-slate-500">AI-powered mock interviews and question banks.</p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="h-10 px-5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm gap-2 shrink-0"
          >
            <Mic size={15} /> Request Mock Interview
          </Button>
        </div>

        {/* SOP */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">How It Works</p>
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              {
                step: 1,
                icon: ClipboardList,
                title: 'Request Mock Interview',
                desc: 'Submit your skills and career goal. Our team will review and schedule a session for you.',
                color: 'text-teal-600',
                bg: 'bg-teal-50',
                border: 'border-teal-100',
              },
              {
                step: 2,
                icon: CalendarCheck,
                title: 'Pick a Time Slot',
                desc: 'You\'ll receive 2 available time slots via email or admin notes. Choose the one that works best for you.',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
              },
              {
                step: 3,
                icon: MonitorPlay,
                title: 'Attend the Interview',
                desc: 'At your scheduled time, join the session. Our expert will conduct the mock interview with you.',
                color: 'text-violet-600',
                bg: 'bg-violet-50',
                border: 'border-violet-100',
              },
              {
                step: 4,
                icon: TrendingUp,
                title: 'Get Your Feedback',
                desc: 'Receive a detailed report of your strengths, areas to improve, and actionable tips to crack your next interview.',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                border: 'border-amber-100',
              },
            ].map(({ step, icon: Icon, title, desc, color, bg, border }, i, arr) => (
              <div key={step} className="relative flex flex-col">
                {/* Connector line (hidden on last item and on small screens) */}
                {i < arr.length - 1 && (
                  <div className="hidden sm:block absolute top-5 left-[calc(100%-8px)] w-full h-px bg-slate-200 z-0" style={{ width: 'calc(100% - 32px)', left: 'calc(50% + 20px)' }} />
                )}
                <div className={`relative z-10 rounded-2xl border ${border} bg-white p-4 flex flex-col gap-3 h-full`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                      <Icon size={17} className={color} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>Step {step}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 mb-1">{title}</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">My Requests</h3>
            <button
              onClick={fetchRequests}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <RequestsTable requests={requests} loading={tableLoading} onCancel={fetchRequests} />
        </div>
      </div>

      {showModal && (
        <RequestModal
          onClose={() => setShowModal(false)}
          onSuccess={fetchRequests}
        />
      )}
    </FeatureGate>
  );
};

export default InterviewPrep;
