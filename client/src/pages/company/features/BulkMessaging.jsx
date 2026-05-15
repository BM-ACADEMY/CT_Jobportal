import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Mail, Send, Users, Loader2, Briefcase, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';

const API = import.meta.env.VITE_API_BASE_URL;

const BulkMessaging = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [sending, setSending] = useState(false);
  const [showJobPicker, setShowJobPicker] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API}/jobs/company-jobs`, { headers });
        const list = Array.isArray(res.data) ? res.data.filter(j => j.status === 'active') : [];
        setJobs(list);
      } catch {
        toast.error('Failed to load jobs');
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    setApplicants([]);
    setSelectedIds(new Set());
    setLoadingApplicants(true);
    const fetchApplicants = async () => {
      try {
        const res = await axios.get(`${API}/applications/job/${selectedJob._id}`, { headers });
        const list = Array.isArray(res.data) ? res.data : [];
        setApplicants(list.filter(a => a.status !== 'rejected' && a.status !== 'withdrawn'));
      } catch {
        toast.error('Failed to load applicants');
      } finally {
        setLoadingApplicants(false);
      }
    };
    fetchApplicants();
  }, [selectedJob]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === applicants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(applicants.map(a => a.applicant?._id).filter(Boolean)));
    }
  };

  const handleSend = async () => {
    if (!selectedJob) { toast.error('Please select a job first'); return; }
    if (selectedIds.size === 0) { toast.error('Please select at least one candidate'); return; }
    if (!body.trim()) { toast.error('Message body is required'); return; }

    setSending(true);
    try {
      const res = await axios.post(`${API}/messages/bulk`, {
        recipientIds: Array.from(selectedIds),
        subject: subject.trim(),
        content: body.trim()
      }, { headers });
      toast.success(res.data.msg || 'Messages sent!');
      setSelectedIds(new Set());
      setSubject('');
      setBody('');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  const statusColors = {
    pending: 'bg-slate-100 text-slate-700',
    reviewed: 'bg-blue-50 text-blue-700',
    shortlisted: 'bg-violet-50 text-violet-700',
    accepted: 'bg-emerald-50 text-emerald-700'
  };

  return (
    <FeatureGate
      featureKey="hasBulkMessaging"
      featureName="Bulk Messaging"
      description="Select a job, choose candidates, and send personalized messages to multiple applicants at once."
      subscriptionPath="/company/subscription"
    >
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                <Mail size={16} className="text-sky-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Bulk Messaging</h1>
            </div>
            <p className="text-sm text-slate-500">Select a job and candidates to message them all at once.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Job + Candidate selection */}
          <div className="space-y-4">
            {/* Job Picker */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">1. Select Job</p>
              {loadingJobs ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" /> Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <p className="text-sm text-slate-400">No active jobs found.</p>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowJobPicker(p => !p)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 hover:border-sky-300 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase size={14} className="text-sky-500" />
                      {selectedJob ? selectedJob.title : 'Choose a job...'}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${showJobPicker ? 'rotate-180' : ''}`} />
                  </button>
                  {showJobPicker && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                      {jobs.map(job => (
                        <button
                          key={job._id}
                          onClick={() => { setSelectedJob(job); setShowJobPicker(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-sky-50 transition-colors ${selectedJob?._id === job._id ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700'}`}
                        >
                          {job.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Candidate List */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">2. Select Candidates</p>
                {applicants.length > 0 && (
                  <button onClick={toggleAll} className="text-[11px] font-bold text-sky-600 hover:text-sky-700">
                    {selectedIds.size === applicants.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {!selectedJob ? (
                <p className="text-sm text-slate-400 text-center py-6">Select a job to see applicants</p>
              ) : loadingApplicants ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 size={16} className="animate-spin" /> Loading applicants...
                </div>
              ) : applicants.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No active applicants for this job</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {applicants.map(app => {
                    const c = app.applicant;
                    if (!c) return null;
                    const isSelected = selectedIds.has(c._id);
                    return (
                      <button
                        key={app._id}
                        onClick={() => toggleSelect(c._id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          isSelected ? 'border-sky-300 bg-sky-50' : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare size={16} className="text-sky-500 shrink-0" />
                        ) : (
                          <Square size={16} className="text-slate-300 shrink-0" />
                        )}
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{c.profile?.headline || c.email}</p>
                        </div>
                        <Badge className={`text-[9px] font-bold border-none shrink-0 ${statusColors[app.status] || 'bg-slate-100 text-slate-700'}`}>
                          {app.status}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedIds.size > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-sky-600 flex items-center gap-1.5">
                    <Users size={12} /> {selectedIds.size} candidate{selectedIds.size > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Compose */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">3. Compose Message</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">Subject <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 transition-colors"
                  placeholder="e.g., Next steps for your application"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">Message</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-sky-400 resize-none transition-colors"
                  placeholder="Hi, we're pleased to inform you that..."
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-600">Message Preview</p>
                <p>To: <span className="font-semibold text-slate-700">{selectedIds.size} candidate{selectedIds.size !== 1 ? 's' : ''}</span> from <span className="font-semibold text-slate-700">{selectedJob?.title || '–'}</span></p>
              </div>

              <Button
                onClick={handleSend}
                disabled={sending || selectedIds.size === 0 || !body.trim()}
                className="w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm gap-2 disabled:opacity-50"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Sending...' : `Send to ${selectedIds.size || 0} Candidate${selectedIds.size !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

export default BulkMessaging;
