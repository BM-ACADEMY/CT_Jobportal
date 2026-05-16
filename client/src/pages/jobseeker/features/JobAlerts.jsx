import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, MapPin, Briefcase, DollarSign, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';

const FREQ_LABELS = { instant: 'Instant', daily: 'Daily Digest', weekly: 'Weekly Digest', none: 'Off' };

const AlertRow = ({ job }) => (
  <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:border-emerald-100 hover:shadow-sm transition-all">
    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
      <Bell size={15} className="text-blue-600" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-900 truncate">{job.title}</p>
      <div className="flex items-center gap-3 mt-0.5">
        <span className="text-[11px] text-slate-500 flex items-center gap-1"><MapPin size={9} /> {job.location || 'Remote'}</span>
        <span className="text-[11px] text-slate-500 flex items-center gap-1"><Briefcase size={9} /> {job.jobType}</span>
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <DollarSign size={9} /> 
          {job.salary?.isRangeHidden ? 'Not disclosed' : `${job.salary?.min || 0} - ${job.salary?.max || 0} ${job.salary?.currency || 'INR'}`}
        </span>
      </div>
    </div>
    <Badge className="text-[10px] font-bold px-2 py-0 border-none bg-emerald-50 text-emerald-700">
      Matching
    </Badge>
    <div className="text-[10px] text-slate-400 font-medium">
      {new Date(job.createdAt).toLocaleDateString()}
    </div>
  </div>
);

const JobAlerts = () => {
  const { user } = useAuth();
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const freq = user?.subscription?.jobAlerts || 'daily';

  const filterByFrequency = (jobs, frequency) => {
    const now = new Date();
    if (frequency === 'instant') return jobs;
    if (frequency === 'daily') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return jobs.filter(j => new Date(j.createdAt) >= start);
    }
    if (frequency === 'weekly') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return jobs.filter(j => new Date(j.createdAt) >= start);
    }
    if (frequency === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return jobs.filter(j => new Date(j.createdAt) >= start);
    }
    return jobs;
  };

  useEffect(() => {
    const fetchMatchingJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/jobs/matching`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const all = Array.isArray(res.data) ? res.data : [];
        setMatchingJobs(filterByFrequency(all, freq));
      } catch (err) {
        console.error('Error fetching matching jobs:', err);
        setMatchingJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchingJobs();
  }, [freq]);

  return (
    <FeatureGate
      featureKey="jobAlerts"
      featureName="Job Alerts"
      description="Get notified instantly when jobs matching your criteria are posted — never miss the right opportunity."
      subscriptionPath="/jobseeker/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Bell size={16} className="text-amber-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Job Alerts</h1>
            </div>
            <p className="text-sm text-slate-500">Dynamic alerts based on your profile requirements.</p>
          </div>
          <Button className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm gap-2 shrink-0">
            <Plus size={15} /> Update Preferences
          </Button>
        </div>

        {/* Frequency Banner */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex items-center gap-4">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-900">Delivery Frequency</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Your plan includes <strong>{FREQ_LABELS[freq]}</strong> alerts
              {freq === 'daily' && ' — showing jobs posted today'}
              {freq === 'weekly' && ' — showing jobs from the last 7 days'}
              {freq === 'monthly' && ' — showing jobs posted this month'}
            </p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold">{FREQ_LABELS[freq]}</Badge>
        </div>

        {/* Alerts List */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Matched Jobs ({matchingJobs.length})</p>
             {loading && <Loader2 size={14} className="text-emerald-500 animate-spin" />}
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : matchingJobs.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200">
              <Bell size={28} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No matches found</p>
              <p className="text-xs text-slate-400 mt-1">Try updating your profile skills or preferences</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(matchingJobs) && matchingJobs.map(job => (
                <AlertRow key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="grid sm:grid-cols-3 gap-3">
          {['Matches are based on your skills and location', 'Job titles in your preferences improve accuracy', 'Ensure your profile is 100% complete'].map(t => (
            <div key={t} className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 font-medium">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </FeatureGate>
  );
};

export default JobAlerts;
