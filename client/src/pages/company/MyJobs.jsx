import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Briefcase, Plus, Edit2, Trash2, Users, Eye, Search,
  MapPin, Clock, Loader2, MoreVertical, ToggleLeft, ToggleRight, AlertTriangle, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const STATUS_COLOR = {
  active:   'bg-emerald-50 text-emerald-700 border-emerald-100',
  closed:   'bg-rose-50 text-rose-700 border-rose-100',
  draft:    'bg-slate-100 text-slate-600 border-slate-200',
  inactive: 'bg-amber-50 text-amber-700 border-amber-100',
};

const MyJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quota, setQuota] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchJobs();
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs/quota`, { headers });
      setQuota(res.data);
    } catch { /* non-critical */ }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/jobs/company-jobs-stats`,
        { headers }
      );
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      toast.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/jobs/${jobId}`, { headers });
      toast.success('Job deleted successfully');
      setJobs(prev => prev.filter(j => j._id !== jobId));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to delete job');
    }
  };

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/jobs/${job._id}`, { status: newStatus }, { headers });
      toast.success(`Job marked as ${newStatus}`);
      setJobs(prev => prev.map(j => j._id === job._id ? { ...j, status: newStatus } : j));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update job status');
    }
  };

  const filtered = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(search.toLowerCase()) ||
                          job.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.status === 'active').length,
    applicants: jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0),
    shortlisted: jobs.reduce((sum, j) => sum + (j.shortlistedCount || 0), 0),
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Job Listings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage all your posted positions and applicants.</p>
          {quota && !quota.unlimited && (
            <div className={`mt-2 inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full ${
              quota.used >= quota.limit ? 'bg-rose-50 text-rose-600' :
              quota.used >= quota.limit * 0.8 ? 'bg-amber-50 text-amber-700' :
              'bg-emerald-50 text-emerald-700'
            }`}>
              <Briefcase size={11} />
              {quota.used}/{quota.limit} job postings used
              {quota.used >= quota.limit && ' — Limit reached'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {quota && !quota.unlimited && quota.used >= quota.limit && (
            <Link to="/company/subscription">
              <Button variant="outline" className="h-10 px-4 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs gap-1.5">
                <Sparkles size={13} /> Upgrade
              </Button>
            </Link>
          )}
          <Button
            onClick={() => navigate('/company/post-job')}
            disabled={quota && !quota.unlimited && quota.used >= quota.limit}
            className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest gap-2 disabled:opacity-50"
          >
            <Plus size={14} /> Post New Job
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Jobs', value: stats.total, color: 'text-slate-900' },
          { label: 'Active', value: stats.active, color: 'text-emerald-700' },
          { label: 'Total Applicants', value: stats.applicants, color: 'text-blue-700' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'text-violet-700' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-5 text-center">
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
            placeholder="Search by title or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 text-sm focus:border-emerald-300"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="rounded-xl border-slate-200 gap-2 font-bold text-xs uppercase tracking-widest h-10 px-4">
              {statusFilter === 'all' ? 'All Status' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 border-slate-200 shadow-xl">
            {['all', 'active', 'draft', 'closed', 'inactive'].map(s => (
              <DropdownMenuItem
                key={s}
                onClick={() => setStatusFilter(s)}
                className="rounded-lg font-bold text-xs uppercase tracking-widest py-2.5 capitalize"
              >
                {s === 'all' ? 'All Jobs' : s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Job List */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
          <Briefcase size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">
            {jobs.length === 0 ? "No jobs posted yet" : "No jobs match your filters"}
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {jobs.length === 0 ? "Post your first job to start attracting candidates." : "Try adjusting your search or filter."}
          </p>
          {jobs.length === 0 && (
            <Button onClick={() => navigate('/company/post-job')} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
              Post a Job
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(job => (
            <div
              key={job._id}
              className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-2xl border border-slate-100 bg-white hover:border-emerald-100 hover:shadow-sm transition-all group"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-all">
                <Briefcase size={18} className="text-emerald-600 group-hover:text-white transition-colors" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {job.title}
                  </p>
                  <Badge className={`text-[9px] font-bold border px-2 py-0 rounded-full ${STATUS_COLOR[job.status] || STATUS_COLOR.draft}`}>
                    {job.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {job.location && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin size={11} /> {job.location}
                    </span>
                  )}
                  {job.jobType && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Briefcase size={11} /> {job.jobType}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={11} /> Posted {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Applicant counts */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => navigate(`/company/applicants/${job._id}`)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 transition-all"
                >
                  <Users size={13} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">{job.applicantsCount || 0}</span>
                  <span className="text-[10px] text-slate-400">applicants</span>
                </button>
                {(job.shortlistedCount || 0) > 0 && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    {job.shortlistedCount} shortlisted
                  </span>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl text-slate-300 hover:bg-slate-50 hover:text-slate-900 shrink-0">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl p-1 border-slate-200 shadow-xl">
                  <DropdownMenuItem
                    onClick={() => navigate(`/company/applicants/${job._id}`)}
                    className="rounded-lg font-bold text-xs uppercase tracking-widest gap-2 py-2.5"
                  >
                    <Users size={13} /> View Applicants
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate(`/company/post-job?edit=${job._id}`)}
                    className="rounded-lg font-bold text-xs uppercase tracking-widest gap-2 py-2.5"
                  >
                    <Edit2 size={13} /> Edit Job
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleToggleStatus(job)}
                    className="rounded-lg font-bold text-xs uppercase tracking-widest gap-2 py-2.5 text-amber-600"
                  >
                    {job.status === 'active'
                      ? <><ToggleLeft size={13} /> Close Job</>
                      : <><ToggleRight size={13} /> Reopen Job</>
                    }
                  </DropdownMenuItem>
                  <div className="h-px bg-slate-100 my-1" />
                  <DropdownMenuItem
                    onClick={() => handleDelete(job._id, job.title)}
                    className="rounded-lg font-bold text-xs uppercase tracking-widest gap-2 py-2.5 text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                  >
                    <Trash2 size={13} /> Delete Job
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyJobs;
