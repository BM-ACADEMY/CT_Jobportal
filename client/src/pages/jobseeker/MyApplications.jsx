import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Briefcase, MapPin, Clock, CheckCircle2, XCircle, Eye, Loader2,
  Search, Filter, Building2, AlertCircle, FileText, Undo2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-amber-50 text-amber-700 border-amber-100' },
  reviewed:    { label: 'Reviewed',    color: 'bg-blue-50 text-blue-700 border-blue-100' },
  shortlisted: { label: 'Shortlisted', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected:    { label: 'Rejected',    color: 'bg-rose-50 text-rose-700 border-rose-100' },
  accepted:    { label: 'Accepted',    color: 'bg-violet-50 text-violet-700 border-violet-100' },
  withdrawn:   { label: 'Withdrawn',   color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

const REVOCABLE = ['pending', 'reviewed'];

const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [revokeTarget, setRevokeTarget] = useState(null); // { id, title }
  const [revoking, setRevoking] = useState(false);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/applications/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/applications/${revokeTarget.id}/revoke`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRevokeTarget(null);
      fetchApplications();
    } catch (err) {
      console.error('Revoke error:', err);
    } finally {
      setRevoking(false);
    }
  };

  const filtered = applications.filter(app => {
    const title = app.job?.title?.toLowerCase() || '';
    const company = app.job?.company?.name?.toLowerCase() || '';
    const matchesSearch = title.includes(search.toLowerCase()) || company.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Revoke confirmation modal */}
      {revokeTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-11 h-11 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={20} className="text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">Revoke Application?</h3>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              Your application for <span className="font-bold text-slate-700">{revokeTarget.title}</span> will be withdrawn. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRevokeTarget(null)}
                disabled={revoking}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Keep It
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {revoking ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />}
                {revoking ? 'Revoking…' : 'Yes, Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track all your job applications in one place.</p>
        </div>
        <Button
          onClick={() => navigate('/jobs')}
          className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest gap-2"
        >
          <Briefcase size={14} /> Browse Jobs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Applied', value: stats.total, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Rejected', value: stats.rejected, color: 'text-rose-700', bg: 'bg-rose-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border border-slate-100 ${s.bg} p-5 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by job title or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 text-sm focus:border-emerald-300"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-xl border-slate-200 gap-2 font-bold text-xs uppercase tracking-widest h-10 px-4">
              <Filter size={13} />
              {statusFilter === 'all' ? 'All Status' : STATUS_CONFIG[statusFilter]?.label || statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl p-1 border-slate-200 shadow-xl">
            {['all', 'pending', 'reviewed', 'shortlisted', 'rejected', 'accepted', 'withdrawn'].map(s => (
              <DropdownMenuItem
                key={s}
                onClick={() => setStatusFilter(s)}
                className="rounded-lg font-bold text-xs uppercase tracking-widest py-2.5 capitalize"
              >
                {s === 'all' ? 'All Applications' : STATUS_CONFIG[s]?.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
          <FileText size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">
            {applications.length === 0 ? "You haven't applied to any jobs yet" : "No applications match your filters"}
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {applications.length === 0 ? "Start exploring jobs and apply to get started." : "Try adjusting your search or filter."}
          </p>
          {applications.length === 0 && (
            <Button onClick={() => navigate('/jobs')} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
              Browse Jobs
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            const job = app.job;
            const salary = job?.salary?.isRangeHidden
              ? 'Not disclosed'
              : job?.salary?.min
                ? `${job.salary.min}–${job.salary.max} ${job.salary.currency || 'INR'}`
                : 'Not specified';

            return (
              <div
                key={app._id}
                className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-2xl border border-slate-100 bg-white hover:border-emerald-100 hover:shadow-sm transition-all group"
              >
                {/* Company logo / initials */}
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden group-hover:border-emerald-100 transition-all">
                  {job?.company?.logo ? (
                    <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 size={20} className="text-slate-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {job?.title || 'Job Unavailable'}
                    </p>
                    <Badge className={`text-[9px] font-bold border px-2 py-0 rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Building2 size={11} /> {job?.company?.name || 'Unknown Company'}
                    </span>
                    {job?.location && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin size={11} /> {job.location}
                      </span>
                    )}
                    {job?.jobType && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Briefcase size={11} /> {job.jobType}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={11} /> Applied {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Status icon + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {app.status === 'shortlisted' && <CheckCircle2 size={18} className="text-emerald-500" />}
                  {app.status === 'rejected'    && <XCircle size={18} className="text-rose-400" />}
                  {app.status === 'pending'     && <AlertCircle size={18} className="text-amber-400" />}
                  {job?._id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/job/${job._id}`)}
                      className="h-8 px-3 rounded-xl border-slate-200 text-xs font-bold gap-1"
                    >
                      <Eye size={12} /> View Job
                    </Button>
                  )}
                  {REVOCABLE.includes(app.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRevokeTarget({ id: app._id, title: job?.title || 'this job' })}
                      className="h-8 px-3 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold gap-1"
                    >
                      <Undo2 size={12} /> Revoke
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
