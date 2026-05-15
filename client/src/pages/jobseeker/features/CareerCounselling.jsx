import React, { useState, useEffect, useCallback } from 'react';
import { Star, Calendar, Clock, Video, CheckCircle2, Send, Loader2, AlertCircle, ArrowRight, Sparkles, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 5;

const STATUS_CONFIG = {
  pending:   { label: 'Booked',    color: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Accepted',  color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Rejected',  color: 'bg-red-100 text-red-700' },
};

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Booked' },
  { key: 'approved',  label: 'Accepted' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Rejected' },
];

const STAT_CARDS = [
  { key: 'booked',    label: 'Booked',    color: 'bg-amber-50 border-amber-100',     text: 'text-amber-700' },
  { key: 'accepted',  label: 'Accepted',  color: 'bg-blue-50 border-blue-100',       text: 'text-blue-700' },
  { key: 'upcoming',  label: 'Upcoming',  color: 'bg-violet-50 border-violet-100',   text: 'text-violet-700' },
  { key: 'completed', label: 'Completed', color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
  { key: 'rejected',  label: 'Rejected',  color: 'bg-red-50 border-red-100',         text: 'text-red-700' },
];

/* ─── Booking Form ─────────────────────────────────────────────────────────── */
const BookingForm = ({ onSuccess, sessionsLeft, unlimited }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    bookingName: user?.name || '',
    bookingEmail: user?.email || '',
    bookingPhone: '',
    bookingDate: '',
    bookingTime: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { bookingName, bookingEmail, bookingDate, bookingTime } = form;
    if (!bookingName || !bookingEmail || !bookingDate || !bookingTime) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API}/requests/counselling`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bName" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Full Name *</Label>
          <Input id="bName" value={form.bookingName} onChange={e => set('bookingName', e.target.value)}
            placeholder="Your name" className="rounded-xl border-slate-200 focus:border-rose-400 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bEmail" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Email *</Label>
          <Input id="bEmail" type="email" value={form.bookingEmail} onChange={e => set('bookingEmail', e.target.value)}
            placeholder="your@email.com" className="rounded-xl border-slate-200 focus:border-rose-400 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bPhone" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Phone</Label>
          <Input id="bPhone" value={form.bookingPhone} onChange={e => set('bookingPhone', e.target.value)}
            placeholder="+91 98765 43210" className="rounded-xl border-slate-200 focus:border-rose-400 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bDate" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Preferred Date *</Label>
          <Input id="bDate" type="date" value={form.bookingDate} onChange={e => set('bookingDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="rounded-xl border-slate-200 focus:border-rose-400 text-sm" required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="bTime" className="text-xs font-bold text-slate-700 uppercase tracking-widest">Preferred Time *</Label>
          <Input id="bTime" type="time" value={form.bookingTime} onChange={e => set('bookingTime', e.target.value)}
            className="rounded-xl border-slate-200 focus:border-rose-400 text-sm" required />
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <AlertCircle size={13} className="shrink-0" /> {error}
        </p>
      )}

      <Button type="submit" disabled={loading}
        className="w-full h-11 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm gap-2 shadow-md shadow-rose-500/20">
        {loading ? <><Loader2 size={15} className="animate-spin" /> Booking…</> : <><Send size={15} /> Book Session</>}
      </Button>

      {!unlimited && (
        <p className="text-[11px] text-center text-slate-400 font-medium">
          {sessionsLeft} session{sessionsLeft !== 1 ? 's' : ''} remaining on your plan
        </p>
      )}
    </form>
  );
};

/* ─── Limit / Success views ────────────────────────────────────────────────── */
const LimitReached = () => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <AlertCircle size={24} className="text-amber-600" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">Session Limit Reached</h3>
    <p className="text-sm text-slate-500 mb-6 max-w-sm leading-relaxed">
      You've used all your career counselling sessions on this plan. Upgrade to book more.
    </p>
    <Link to="/jobseeker/subscription">
      <Button className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm gap-2 shadow-md shadow-emerald-500/20">
        <Sparkles size={14} /> Upgrade Plan <ArrowRight size={13} />
      </Button>
    </Link>
  </div>
);

const SuccessView = ({ onBook }) => (
  <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4">
    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <CheckCircle2 size={24} className="text-emerald-600" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">Session Booked!</h3>
    <p className="text-sm text-slate-500 mb-6 max-w-sm leading-relaxed">
      Your session request has been received. Our team will confirm via email shortly.
    </p>
    <Button variant="outline" onClick={onBook} className="rounded-xl h-10 px-6 text-sm font-bold">
      Book Another Session
    </Button>
  </div>
);

/* ─── Sessions Table (filter + pagination + cancel) ────────────────────────── */
const SessionsTable = ({ sessions, loading, onCancel }) => {
  const [filter, setFilter]       = useState('all');
  const [page, setPage]           = useState(1);
  const [confirmId, setConfirmId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [filter]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = sessions.filter(s => {
    if (filter === 'all')       return true;
    if (filter === 'upcoming')  return s.status === 'approved' && new Date(s.bookingDate) >= today;
    return s.status === filter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await axios.patch(`${API}/requests/counselling/${confirmId}/cancel`, {}, {
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

  const cancellable = (status) => status === 'pending' || status === 'approved';

  return (
    <>
      {/* Cancel confirmation modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-11 h-11 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={20} className="text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">Cancel this session?</h3>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              The session will be marked as cancelled and your session count will be refunded.
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
                ? 'bg-rose-500 text-white'
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
            {filter === 'all' ? 'No sessions booked yet.' : 'No sessions match this filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">#</th>
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">Time</th>
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">Name</th>
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">Notes</th>
                <th className="text-left py-2.5 px-3 font-bold text-slate-500 uppercase tracking-widest">Booked On</th>
                <th className="py-2.5 px-3" />
              </tr>
            </thead>
            <tbody>
              {pageItems.map((s, i) => {
                const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.pending;
                const globalIndex = (safePage - 1) * PAGE_SIZE + i + 1;
                return (
                  <tr key={s._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 text-slate-400 font-semibold">{globalIndex}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                      {s.bookingDate
                        ? new Date(s.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{s.bookingTime || '—'}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{s.bookingName || '—'}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-[160px] truncate">{s.adminNotes || '—'}</td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-3">
                      {cancellable(s.status) && (
                        <button
                          onClick={() => setConfirmId(s._id)}
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
                    ? 'bg-rose-500 text-white'
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
const CareerCounselling = () => {
  const { user, refreshUser } = useAuth();
  const [submitted, setSubmitted]       = useState(false);
  const [sessions, setSessions]         = useState([]);
  const [counts, setCounts]             = useState({ booked: 0, accepted: 0, upcoming: 0, completed: 0, rejected: 0 });
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const limit       = user?.subscription?.careerCounsellingCount ?? 0;
  const unlimited   = limit === 0;
  const sessionsUsed = user?.counsellingSessionsUsed ?? 0;
  const sessionsLeft = unlimited ? Infinity : limit - sessionsUsed;
  const atLimit     = !unlimited && sessionsUsed >= limit;

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await axios.get(`${API}/requests/my-sessions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSessions(res.data.sessions || []);
      setCounts(res.data.counts || { booked: 0, accepted: 0, upcoming: 0, completed: 0, rejected: 0 });
    } catch {
      // silently fail
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleBookSuccess = () => {
    setSubmitted(true);
    fetchSessions();
    refreshUser();
  };

  const handleCancelDone = () => {
    fetchSessions();
    refreshUser();
  };

  return (
    <FeatureGate
      featureKey="hasCareerCounselling"
      featureName="Career Counselling"
      description="Book 1-on-1 sessions with industry experts for career guidance, salary negotiation, and growth roadmapping."
      subscriptionPath="/jobseeker/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <Star size={16} className="text-rose-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Career Counselling</h1>
            </div>
            <p className="text-sm text-slate-500">Expert 1-on-1 sessions to accelerate your career.</p>
          </div>
          <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-center shrink-0">
            <p className="text-lg font-bold text-rose-700">{unlimited ? '∞' : sessionsLeft > 0 ? sessionsLeft : 0}</p>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Sessions Left</p>
          </div>
        </div>

        {/* Perks */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Video,    label: 'Video Sessions',  desc: 'HD video + screen share' },
            { icon: Clock,    label: '45 Min / Session', desc: 'Deep-dive career talks' },
            { icon: Calendar, label: 'Flexible Booking', desc: 'Pick your time slot' },
          ].map(p => (
            <div key={p.label} className="rounded-xl border border-slate-100 bg-white p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center shrink-0">
                <p.icon size={15} className="text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{p.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Booking form / limit / success */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          {submitted ? (
            <SuccessView onBook={() => setSubmitted(false)} />
          ) : atLimit ? (
            <LimitReached />
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-900 mb-5">Book a Session</h3>
              <BookingForm onSuccess={handleBookSuccess} sessionsLeft={sessionsLeft} unlimited={unlimited} />
            </>
          )}
        </div>

        {/* Session Stats */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Session Overview</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {STAT_CARDS.map(({ key, label, color, text }) => (
              <div key={key} className={`rounded-xl border ${color} px-4 py-3 text-center`}>
                <p className={`text-xl font-bold ${text}`}>{counts[key]}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">My Sessions</h3>
            <button
              onClick={() => { fetchSessions(); refreshUser(); }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <SessionsTable sessions={sessions} loading={sessionsLoading} onCancel={handleCancelDone} />
        </div>
      </div>
    </FeatureGate>
  );
};

export default CareerCounselling;
