import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ClipboardList, Star, Mic, RefreshCw, Loader2, X,
  CheckCircle2, Clock, ChevronLeft, ChevronRight, AlertCircle, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const API = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 10;

const TYPE_CONFIG = {
  counselling: {
    label: 'Career Counselling',
    icon: Star,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    accent: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  interview_prep: {
    label: 'Interview Prep',
    icon: Mic,
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    accent: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  salary_benchmark: {
    label: 'Salary Benchmark',
    icon: ClipboardList,
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    accent: 'text-violet-600',
    bg: 'bg-violet-50',
  },
};

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-amber-100 text-amber-700' },
  approved:  { label: 'Accepted',  color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'approved',  label: 'New' },
  { key: 'pending',   label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const TYPE_FILTERS = [
  { key: 'all',             label: 'All Types' },
  { key: 'counselling',     label: 'Counselling' },
  { key: 'interview_prep',  label: 'Interview Prep' },
];

const token = () => localStorage.getItem('token');
const authHeader = () => ({ Authorization: `Bearer ${token()}` });

/* ─── Action Modal ──────────────────────────────────────────────────────────── */
const ActionModal = ({ request, onClose, onUpdated }) => {
  const [status, setStatus]         = useState(request.status === 'approved' ? 'completed' : request.status);
  const [notes, setNotes]           = useState(request.adminNotes || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await axios.patch(
        `${API}/requests/assigned/${request._id}`,
        { status, adminNotes: notes },
        { headers: authHeader() }
      );
      toast.success('Request updated successfully');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Update Request</h3>
            <p className="text-xs text-slate-500 mt-0.5">{request.user?.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <X size={16} />
          </button>
        </div>

        {/* Seeker details */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1 text-xs text-slate-600">
          <p><span className="font-bold text-slate-700">Email:</span> {request.user?.email}</p>
          {request.type === 'counselling' && (
            <>
              <p><span className="font-bold text-slate-700">Preferred Date:</span> {request.bookingDate}</p>
              <p><span className="font-bold text-slate-700">Preferred Time:</span> {request.bookingTime}</p>
              {request.bookingPhone && <p><span className="font-bold text-slate-700">Phone:</span> {request.bookingPhone}</p>}
            </>
          )}
          {request.type === 'interview_prep' && (
            <>
              <p><span className="font-bold text-slate-700">Skills:</span> {request.skills}</p>
              {request.careerGoal && <p><span className="font-bold text-slate-700">Goal:</span> {request.careerGoal}</p>}
            </>
          )}
          {request.type === 'salary_benchmark' && (
            <>
              <p><span className="font-bold text-slate-700">Role:</span> {request.jobRole}</p>
              <p><span className="font-bold text-slate-700">Company:</span> {request.companyName}</p>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Mark As</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'completed', label: 'Completed', icon: CheckCircle2, active: 'bg-emerald-500 text-white', inactive: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
                { value: 'cancelled', label: 'Cancel',    icon: X,            active: 'bg-red-500 text-white',     inactive: 'bg-red-50 text-red-700 border border-red-200' },
              ].map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      status === opt.value ? opt.active : opt.inactive
                    }`}
                  >
                    <Icon size={12} /> {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
              Notes / Feedback for Seeker
            </label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Session scheduled for 3pm on Friday via Zoom…"
              className="rounded-xl border-slate-200 text-sm resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl text-xs font-bold">Close</Button>
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="flex-1 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Request Card ──────────────────────────────────────────────────────────── */
const RequestCard = ({ request, onAction }) => {
  const typeCfg   = TYPE_CONFIG[request.type]   || TYPE_CONFIG.counselling;
  const statusCfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending;
  const TypeIcon  = typeCfg.icon;
  const isNew     = request.status === 'approved';
  const isDone    = request.status === 'completed' || request.status === 'cancelled';

  return (
    <div className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow ${isNew ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${typeCfg.bg} flex items-center justify-center shrink-0`}>
            <TypeIcon size={16} className={typeCfg.accent} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900">{request.user?.name}</p>
              {isNew && (
                <Badge className="text-[9px] font-bold bg-emerald-100 text-emerald-700 border-none px-1.5 py-0">
                  New
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{request.user?.email}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${statusCfg.color}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Type badge */}
      <div className="mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeCfg.color}`}>
          <TypeIcon size={9} /> {typeCfg.label}
        </span>
      </div>

      {/* Details */}
      <div className="bg-slate-50 rounded-xl p-3 mb-3 space-y-1 text-xs text-slate-600">
        {request.type === 'counselling' && (
          <>
            <div className="flex items-center gap-1.5">
              <Calendar size={11} className="text-slate-400 shrink-0" />
              <span>{request.bookingDate} at {request.bookingTime}</span>
            </div>
            {request.bookingPhone && (
              <p><span className="font-semibold text-slate-700">Phone:</span> {request.bookingPhone}</p>
            )}
          </>
        )}
        {request.type === 'interview_prep' && (
          <>
            <p><span className="font-semibold text-slate-700">Skills:</span> {request.skills}</p>
            {request.careerGoal && (
              <p className="truncate"><span className="font-semibold text-slate-700">Goal:</span> {request.careerGoal}</p>
            )}
          </>
        )}
        {request.type === 'salary_benchmark' && (
          <>
            <p><span className="font-semibold text-slate-700">Role:</span> {request.jobRole}</p>
            <p><span className="font-semibold text-slate-700">Company:</span> {request.companyName}</p>
          </>
        )}
      </div>

      {/* Admin notes */}
      {request.adminNotes && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">Notes from Admin</p>
          <p className="text-xs text-amber-800">{request.adminNotes}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock size={11} />
          <span>
            Assigned {request.assignedAt
              ? new Date(request.assignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        {!isDone && (
          <button
            onClick={() => onAction(request)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
          >
            <CheckCircle2 size={12} /> Take Action
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const AssignedRequests = () => {
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [page, setPage]               = useState(1);
  const [actionTarget, setActionTarget] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await axios.get(`${API}/requests/assigned`, { headers: authHeader(), params });
      setRequests(res.data);
      setPage(1);
    } catch {
      toast.error('Failed to load assigned requests');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filtered = requests.filter(r => statusFilter === 'all' || r.status === statusFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const newCount = requests.filter(r => r.status === 'approved').length;

  return (
    <div className="space-y-6 pb-12">
      {actionTarget && (
        <ActionModal
          request={actionTarget}
          onClose={() => setActionTarget(null)}
          onUpdated={fetchRequests}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <ClipboardList size={16} className="text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Assigned Requests</h1>
            {newCount > 0 && (
              <Badge className="text-[10px] font-bold bg-emerald-500 text-white border-none px-2">
                {newCount} New
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">Career counselling and interview prep sessions assigned to you by admin.</p>
        </div>
        <button
          onClick={fetchRequests}
          className="self-start sm:self-auto text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-100"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'approved',  label: 'New',       color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
          { key: 'pending',   label: 'Pending',   color: 'bg-amber-50 border-amber-100',     text: 'text-amber-700',   icon: Clock },
          { key: 'completed', label: 'Completed', color: 'bg-blue-50 border-blue-100',       text: 'text-blue-700',    icon: CheckCircle2 },
          { key: 'cancelled', label: 'Cancelled', color: 'bg-red-50 border-red-100',         text: 'text-red-700',     icon: AlertCircle },
        ].map(({ key, label, color, text, icon: Icon }) => (
          <div key={key} className={`rounded-xl border ${color} px-4 py-3 flex items-center gap-3`}>
            <Icon size={16} className={text} />
            <div>
              <p className={`text-lg font-bold ${text}`}>{requests.filter(r => r.status === key).length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setTypeFilter(f.key); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                typeFilter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(1); }}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                statusFilter === f.key ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      ) : pageItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={24} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-semibold text-sm">No requests assigned to you yet.</p>
          <p className="text-slate-400 text-xs mt-1">The admin will send career counselling or interview prep requests here.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.map(r => (
              <RequestCard key={r._id} request={r} onAction={setActionTarget} />
            ))}
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400 font-medium">
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-colors ${
                      n === safePage ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AssignedRequests;
