import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, MapPin, Briefcase, DollarSign, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Button, Tag, Typography, Card, Spin } from 'antd';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';

const { Title, Text } = Typography;

const FREQ_LABELS = { instant: 'Instant', daily: 'Daily Digest', weekly: 'Weekly Digest', monthly: 'Monthly Digest', none: 'Off' };

const AlertRow = ({ job }) => (
  <Card 
    bordered 
    className="mb-3 hover:border-emerald-200 hover:shadow-sm transition-all rounded-xl"
    bodyStyle={{ padding: '16px' }}
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
        <Bell size={18} className="text-[#1677ff]" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-800 truncate m-0">{job.title}</h3>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-[12px] text-slate-500 flex items-center gap-1.5 font-medium"><MapPin size={12} /> {job.location || 'Remote'}</span>
          <span className="text-[12px] text-slate-500 flex items-center gap-1.5 font-medium"><Briefcase size={12} /> {job.jobType}</span>
          <span className="text-[12px] text-slate-500 flex items-center gap-1.5 font-medium">
            <DollarSign size={12} /> 
            {job.salary?.isRangeHidden ? 'Not disclosed' : `${job.salary?.min || 0} - ${job.salary?.max || 0} ${job.salary?.currency || 'INR'}`}
          </span>
        </div>
      </div>
      <Tag color="success" className="border-none font-medium px-2.5 py-0.5 tracking-wide rounded-md">
        Matching
      </Tag>
      <div className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">
        {new Date(job.createdAt).toLocaleDateString()}
      </div>
    </div>
  </Card>
);

const JobAlerts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAlertInfo = () => {
    if (Array.isArray(user?.purchasedFeatures)) {
      const ppFeature = user.purchasedFeatures.find(f => 
        f.isActive && 
        (f.featureKey === 'hasJobAlerts' || f.featureKey === 'jobAlerts') && 
        (!f.expiresAt || new Date(f.expiresAt) > new Date())
      );
      if (ppFeature) {
        return { freq: 'daily', source: 'pay_per', expiresAt: ppFeature.expiresAt };
      }
    }
    const subFreq = user?.subscription?.jobAlerts;
    if (subFreq) return { freq: subFreq.toLowerCase(), source: 'plan' };
    return { freq: 'monthly', source: 'default' };
  };

  const alertInfo = getAlertInfo();
  const freq = alertInfo.freq;

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
      subscriptionPath="/candidate/subscription"
    >
      <div className="space-y-8 pb-12">
        <PageSOPBanner pageKey="jobAlerts" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-50 flex items-center justify-center rounded-md border border-orange-100">
              <Bell size={20} className="text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl m-0 font-semibold tracking-tight text-slate-800">Job Alerts</h1>
              <p className="text-slate-600 font-medium m-0 text-sm mt-0.5">Dynamic alerts based on your profile requirements.</p>
            </div>
          </div>
          <Button 
            type="primary" 
            onClick={() => navigate('/candidate/settings?tab=preferences')}
            icon={<Plus size={16} />}
            className="h-10 px-5 rounded-md shadow-sm font-medium tracking-wide border-none bg-emerald-500 hover:bg-emerald-600"
          >
            Update Preferences
          </Button>
        </div>

        {/* Frequency Banner */}
        <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-5 flex items-center gap-5">
          <div className="w-10 h-10 bg-orange-100/70 rounded-full flex items-center justify-center shrink-0">
            <Clock size={18} className="text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800 m-0">Delivery Frequency</p>
            <p className="text-xs text-orange-700/80 mt-1 mb-0 font-medium">
              {alertInfo.source === 'pay_per' ? (
                <>Your plan includes <span className="font-semibold text-orange-800">Daily Digest</span> alerts {alertInfo.expiresAt ? `until ${new Date(alertInfo.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''} — showing jobs posted today.</>
              ) : (
                <>
                  Your plan includes <span className="font-semibold text-orange-800">{FREQ_LABELS[freq]}</span> alerts
                  {freq === 'daily' && ' — showing jobs posted today.'}
                  {freq === 'weekly' && ' — showing jobs from the last 7 days.'}
                  {freq === 'monthly' && ' — showing jobs posted this month.'}
                </>
              )}
            </p>
          </div>
          <Tag color="orange" className="border-none font-semibold px-3 py-1 text-xs rounded-md m-0 bg-orange-100 text-orange-700">
            {FREQ_LABELS[freq]}
          </Tag>
        </div>

        {/* Alerts List */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0">MATCHED JOBS ({matchingJobs.length})</p>
             {loading && <Spin indicator={<Loader2 size={16} className="text-emerald-500 animate-spin" />} />}
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : matchingJobs.length === 0 ? (
            <Card bordered={false} className="text-center py-16 rounded-xl border border-dashed border-slate-200 shadow-none bg-slate-50/50">
              <Bell size={28} className="text-slate-300 mx-auto mb-3" />
              <Title level={5} className="m-0 text-slate-600 font-semibold">No matches found</Title>
              <Text className="text-slate-400 mt-1 block">Try updating your profile skills or preferences</Text>
            </Card>
          ) : (
            <div className="space-y-3 mt-4">
              {Array.isArray(matchingJobs) && matchingJobs.map(job => (
                <AlertRow key={job._id} job={job} />
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="grid sm:grid-cols-3 gap-4">
          {['Matches are based on your skills and location', 'Job titles in your preferences improve accuracy', 'Ensure your profile is 100% complete'].map(t => (
            <div key={t} className="flex items-start gap-2.5 p-4 rounded-xl bg-white border border-slate-100">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-slate-600 font-medium m-0 leading-tight">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </FeatureGate>
  );
};

export default JobAlerts;
