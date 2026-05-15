import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Video, Calendar, Link2, Loader2, Briefcase, Clock, X, CheckCircle2, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';

const API = import.meta.env.VITE_API_BASE_URL;

const statusStyles = {
  scheduled: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-600'
};

const ScheduleModal = ({ jobs, onClose, onScheduled }) => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(30);
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showJobPicker, setShowJobPicker] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const handleJobSelect = async (job) => {
    setSelectedJob(job);
    setSelectedApp(null);
    setShowJobPicker(false);
    setLoadingApplicants(true);
    try {
      const res = await axios.get(`${API}/interviews/schedulable/${job._id}`, { headers });
      setApplicants(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load applicants');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedApp) { toast.error('Please select a candidate'); return; }
    if (!scheduledAt) { toast.error('Please set a date and time'); return; }
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/interviews`, {
        applicationId: selectedApp._id,
        scheduledAt,
        duration,
        meetingLink,
        notes
      }, { headers });
      toast.success('Interview scheduled!');
      onScheduled(res.data.interview);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Schedule Video Interview</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>

        {/* Job picker */}
        <div>
          <label className="text-xs font-bold text-slate-600 block mb-1.5">Job</label>
          <div className="relative">
            <button
              onClick={() => setShowJobPicker(p => !p)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-slate-50 hover:border-rose-300"
            >
              <span className="flex items-center gap-2"><Briefcase size={14} className="text-rose-500" />{selectedJob ? selectedJob.title : 'Choose a job...'}</span>
              <ChevronDown size={14} />
            </button>
            {showJobPicker && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                {jobs.map(job => (
                  <button key={job._id} onClick={() => handleJobSelect(job)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 text-slate-700">
                    {job.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Applicant picker */}
        <div>
          <label className="text-xs font-bold text-slate-600 block mb-1.5">Candidate</label>
          {loadingApplicants ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" /> Loading...</div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {applicants.length === 0 ? (
                <p className="text-sm text-slate-400">{selectedJob ? 'No shortlisted/reviewed candidates' : 'Select a job first'}</p>
              ) : applicants.map(app => (
                <button
                  key={app._id}
                  onClick={() => !app.hasScheduledInterview && setSelectedApp(app)}
                  disabled={app.hasScheduledInterview}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedApp?._id === app._id ? 'border-rose-400 bg-rose-50' :
                    app.hasScheduledInterview ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed' :
                    'border-slate-100 hover:border-rose-200'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {app.applicant?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{app.applicant?.name}</p>
                    <p className="text-[10px] text-slate-500">{app.applicant?.profile?.headline || app.status}</p>
                  </div>
                  {app.hasScheduledInterview && <Badge className="text-[9px] bg-blue-50 text-blue-700 border-none">Scheduled</Badge>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-rose-400"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1.5">Duration (mins)</label>
            <select
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-rose-400 bg-white"
            >
              {[15, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 block mb-1.5">Meeting Link <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            value={meetingLink}
            onChange={e => setMeetingLink(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-rose-400"
            placeholder="https://meet.google.com/..."
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 block mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-rose-400 resize-none"
            placeholder="Interview notes or instructions..."
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 h-10 rounded-xl border-slate-200 text-sm font-bold">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedApp || !scheduledAt}
            className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
            Schedule
          </Button>
        </div>
      </div>
    </div>
  );
};

const VideoInterview = () => {
  const [interviews, setInterviews] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [updating, setUpdating] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [interviewsRes, jobsRes] = await Promise.all([
        axios.get(`${API}/interviews/recruiter`, { headers }),
        axios.get(`${API}/jobs/company-jobs`, { headers })
      ]);
      setInterviews(Array.isArray(interviewsRes.data) ? interviewsRes.data : []);
      setJobs(Array.isArray(jobsRes.data) ? jobsRes.data.filter(j => j.status === 'active') : []);
    } catch {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id, action) => {
    setUpdating(id);
    try {
      await axios.patch(`${API}/interviews/${id}/${action}`, {}, { headers });
      toast.success(action === 'cancel' ? 'Interview cancelled' : 'Interview marked complete');
      setInterviews(prev => prev.map(i => i._id === id ? { ...i, status: action === 'cancel' ? 'cancelled' : 'completed' } : i));
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Action failed');
    } finally {
      setUpdating(null);
    }
  };

  const upcoming = interviews.filter(i => i.status === 'scheduled' && new Date(i.scheduledAt) >= new Date());
  const past = interviews.filter(i => i.status !== 'scheduled' || new Date(i.scheduledAt) < new Date());

  const stats = [
    { label: 'Scheduled', value: upcoming.length },
    { label: 'Completed', value: interviews.filter(i => i.status === 'completed').length },
    { label: 'Cancelled', value: interviews.filter(i => i.status === 'cancelled').length }
  ];

  return (
    <FeatureGate
      featureKey="hasVideoInterview"
      featureName="Video Interview"
      description="Schedule and manage video interviews with candidates directly from the portal."
      subscriptionPath="/company/subscription"
    >
      {showScheduleModal && (
        <ScheduleModal
          jobs={jobs}
          onClose={() => setShowScheduleModal(false)}
          onScheduled={(interview) => setInterviews(prev => [interview, ...prev])}
        />
      )}

      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                <Video size={16} className="text-rose-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Video Interviews</h1>
            </div>
            <p className="text-sm text-slate-500">Schedule and manage interviews with your shortlisted candidates.</p>
          </div>
          <Button
            onClick={() => setShowScheduleModal(true)}
            className="h-10 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm gap-2 shrink-0"
          >
            <Plus size={15} /> Schedule Interview
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-5 text-center">
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-rose-500" /></div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
            <Video size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No interviews scheduled yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Schedule interviews with shortlisted candidates.</p>
            <Button onClick={() => setShowScheduleModal(true)} className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs gap-2">
              <Plus size={12} /> Schedule Interview
            </Button>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Upcoming</p>
                <div className="space-y-3">
                  {upcoming.map(iv => (
                    <InterviewCard key={iv._id} interview={iv} onAction={handleAction} updating={updating} />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Past & Cancelled</p>
                <div className="space-y-3">
                  {past.map(iv => (
                    <InterviewCard key={iv._id} interview={iv} onAction={handleAction} updating={updating} readonly />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Features */}
        <div className="grid sm:grid-cols-2 gap-3">
          {['Schedule interviews with shortlisted candidates', 'Set date, time, and duration', 'Add meeting link (Google Meet, Zoom, etc.)', 'Track scheduled, completed, and cancelled', 'Add notes and instructions per interview', 'Cancel interviews with one click'].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> {f}
            </div>
          ))}
        </div>
      </div>
    </FeatureGate>
  );
};

const InterviewCard = ({ interview, onAction, updating, readonly }) => {
  const iv = interview;
  const isUpcoming = iv.status === 'scheduled' && new Date(iv.scheduledAt) >= new Date();
  const dt = new Date(iv.scheduledAt);

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-rose-100 hover:shadow-sm transition-all">
      <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
        <Video size={15} className="text-rose-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">{iv.candidate?.name || 'Candidate'}</p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <span className="text-[11px] text-slate-500">{iv.job?.title}</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock size={9} /> {dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-slate-400">{iv.duration} min</span>
        </div>
        {iv.meetingLink && (
          <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sky-600 hover:underline flex items-center gap-1 mt-0.5">
            <Link2 size={9} /> Join Meeting
          </a>
        )}
      </div>
      <Badge className={`text-[10px] font-bold border-none shrink-0 ${statusStyles[iv.status]}`}>
        {iv.status}
      </Badge>
      {!readonly && isUpcoming && (
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => onAction(iv._id, 'complete')}
            disabled={updating === iv._id}
            className="h-8 px-3 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {updating === iv._id ? <Loader2 size={11} className="animate-spin" /> : 'Done'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction(iv._id, 'cancel')}
            disabled={updating === iv._id}
            className="h-8 px-3 text-xs font-bold rounded-lg border-slate-200 text-slate-600"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoInterview;
