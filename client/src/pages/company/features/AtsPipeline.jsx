import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Layers, Users, CheckCircle2, Circle, Plus, Loader2, ChevronRight, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FeatureGate from '@/components/subscription/FeatureGate';

const STAGES = [
  { key: 'pending',     label: 'Applied',    color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'reviewed',    label: 'Screening',  color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { key: 'shortlisted', label: 'Interview',  color: 'bg-violet-50 text-violet-700 border-violet-100' },
  { key: 'accepted',    label: 'Offer',      color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
];

const AtsPipeline = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs/company-jobs`, { headers });
        const jobList = Array.isArray(res.data) ? res.data : [];
        setJobs(jobList);
        if (jobList.length > 0) {
          setSelectedJob(jobList[0]);
        }
      } catch (err) {
        console.error('ATS fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    const fetchApplicants = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/applications/job/${selectedJob._id}`,
          { headers }
        );
        setApplications(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Applicants fetch error:', err);
        setApplications([]);
      }
    };
    fetchApplicants();
  }, [selectedJob]);

  const moveCandidate = async (applicationId, newStatus) => {
    setUpdating(applicationId);
    try {
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/applications/${applicationId}/status`,
        { status: newStatus },
        { headers }
      );
      setApplications(prev =>
        prev.map(app => app._id === applicationId ? { ...app, status: newStatus } : app)
      );
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setUpdating(null);
    }
  };

  const totalCount = applications.length;
  const inProgress = applications.filter(a => ['reviewed', 'shortlisted'].includes(a.status)).length;
  const offerCount = applications.filter(a => a.status === 'accepted').length;

  return (
    <FeatureGate
      featureKey="hasATSPipeline"
      featureName="ATS Pipeline"
      description="Manage your entire hiring pipeline visually — move candidates through stages, automate triggers, and collaborate with your team."
      subscriptionPath="/company/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <Layers size={16} className="text-violet-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">ATS Pipeline</h1>
            </div>
            <p className="text-sm text-slate-500">Visual hiring pipeline — drag candidates through stages.</p>
          </div>
          <Button
            onClick={() => navigate('/company/post-job')}
            className="h-10 px-5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-sm gap-2 shrink-0"
          >
            <Plus size={15} /> Add Job Pipeline
          </Button>
        </div>

        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-violet-500" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
            <Briefcase size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No jobs found</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Post jobs to start tracking candidates in the pipeline.</p>
            <Button onClick={() => navigate('/company/post-job')} className="rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-xs">
              Post a Job
            </Button>
          </div>
        ) : (
          <>
            {/* Job Selector */}
            <div className="flex gap-2 flex-wrap">
              {jobs.map(job => (
                <button
                  key={job._id}
                  onClick={() => setSelectedJob(job)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedJob?._id === job._id
                      ? 'bg-violet-500 text-white border-violet-500'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                  }`}
                >
                  {job.title}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total candidates', value: totalCount },
                { label: 'In progress', value: inProgress },
                { label: 'Shortlisted', value: applications.filter(a => a.status === 'shortlisted').length },
                { label: 'Offers sent', value: offerCount },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Kanban Board */}
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-max pb-4">
                {STAGES.map(stage => {
                  const stageCandidates = applications.filter(a => a.status === stage.key);
                  return (
                    <div key={stage.key} className="w-60 shrink-0">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={`text-[10px] font-bold px-2.5 py-0.5 border ${stage.color}`}>
                          {stage.label}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-bold">{stageCandidates.length}</span>
                      </div>
                      <div className="space-y-2">
                        {stageCandidates.map(app => {
                          const candidate = app.applicant || {};
                          const name = candidate.name || 'Unknown';
                          const title = candidate.profile?.headline || candidate.recruiterProfile?.jobTitle || 'Candidate';
                          return (
                            <div
                              key={app._id}
                              className="bg-white rounded-xl border border-slate-100 p-3 hover:shadow-sm hover:border-violet-100 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 bg-gradient-to-br from-violet-400 to-indigo-500 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                  {name[0]?.toUpperCase()}
                                </div>
                                <p className="text-xs font-bold text-slate-900 truncate flex-1">{name}</p>
                                {updating === app._id && <Loader2 size={11} className="text-violet-500 animate-spin shrink-0" />}
                              </div>
                              <p className="text-[10px] text-slate-500 truncate">{title}</p>
                              <p className="text-[9px] text-slate-400 mt-1">
                                {new Date(app.createdAt).toLocaleDateString()}
                              </p>
                              {/* Stage controls */}
                              <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {STAGES.filter(s => s.key !== stage.key).map(s => (
                                  <button
                                    key={s.key}
                                    onClick={() => moveCandidate(app._id, s.key)}
                                    className={`flex-1 py-0.5 rounded text-[8px] font-bold border transition-colors ${s.color} hover:opacity-80`}
                                    title={`Move to ${s.label}`}
                                  >
                                    → {s.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        <button
                          onClick={() => navigate(`/company/applicants/${selectedJob?._id}`)}
                          className="w-full h-8 rounded-xl border border-dashed border-slate-200 flex items-center justify-center gap-1 text-[10px] text-slate-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
                        >
                          <ChevronRight size={10} /> View All
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </FeatureGate>
  );
};

export default AtsPipeline;
