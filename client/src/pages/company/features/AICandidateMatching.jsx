import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Sparkles, Briefcase, Users, ChevronDown, Loader2, CheckCircle2, XCircle, MapPin, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import FeatureGate from '@/components/subscription/FeatureGate';

const API = import.meta.env.VITE_API_BASE_URL;

const ScoreBar = ({ value, color = 'bg-emerald-500' }) => (
  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-24">
    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
  </div>
);

const scoreColor = (score) => {
  if (score >= 75) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (score >= 50) return { bar: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { bar: 'bg-rose-400', text: 'text-rose-600', bg: 'bg-rose-50' };
};

const AICandidateMatching = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [matches, setMatches] = useState([]);
  const [jobInfo, setJobInfo] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [showJobPicker, setShowJobPicker] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API}/jobs/company-jobs`, { headers });
        const list = Array.isArray(res.data) ? res.data : [];
        setJobs(list);
        if (list.length > 0) setSelectedJob(list[0]);
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
    setMatches([]);
    setJobInfo(null);
    setLoadingMatches(true);
    const fetchMatches = async () => {
      try {
        const res = await axios.get(`${API}/jobs/${selectedJob._id}/matched-candidates`, { headers });
        setMatches(res.data.matches || []);
        setJobInfo(res.data.job || null);
      } catch (err) {
        if (err.response?.status === 403) {
          toast.error(err.response.data.msg);
        } else {
          toast.error('Failed to fetch matches');
        }
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchMatches();
  }, [selectedJob]);

  return (
    <FeatureGate
      featureKey="hasAICandidateMatching"
      featureName="AI Candidate Matching"
      description="Rank applicants by how well their skills, experience, and preferences match your job requirements."
      subscriptionPath="/company/subscription"
    >
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-violet-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">AI Candidate Matching</h1>
          </div>
          <p className="text-sm text-slate-500">Applicants ranked by AI match score based on skills, location, job type, and preferences.</p>
        </div>

        {/* Job Selector */}
        <div className="flex items-center gap-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest shrink-0">Job:</p>
          {loadingJobs ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" /> Loading...</div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowJobPicker(p => !p)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:border-violet-300 transition-colors"
              >
                <Briefcase size={14} className="text-violet-500" />
                {selectedJob ? selectedJob.title : 'Select a job'}
                <ChevronDown size={13} className={`transition-transform ${showJobPicker ? 'rotate-180' : ''}`} />
              </button>
              {showJobPicker && (
                <div className="absolute z-20 mt-1 min-w-[220px] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {jobs.map(job => (
                    <button
                      key={job._id}
                      onClick={() => { setSelectedJob(job); setShowJobPicker(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-violet-50 transition-colors ${selectedJob?._id === job._id ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-700'}`}
                    >
                      {job.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Job required skills */}
        {jobInfo?.skillsRequired?.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-slate-500">Required skills:</span>
            {jobInfo.skillsRequired.map(s => (
              <Badge key={s} className="text-[10px] bg-violet-50 text-violet-700 border-violet-100 font-bold">{s}</Badge>
            ))}
          </div>
        )}

        {/* Matches */}
        {loadingMatches ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <Loader2 size={28} className="animate-spin text-violet-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">Analyzing candidates...</p>
            </div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
            <Users size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No applicants yet</p>
            <p className="text-xs text-slate-400 mt-1">Applicants will appear here once they apply for this job.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{matches.length} Applicant{matches.length !== 1 ? 's' : ''} — ranked by match</p>
            </div>
            {matches.map((m, idx) => {
              const colors = scoreColor(m.matchScore);
              return (
                <div key={m.applicationId} className="rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${idx === 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                      #{idx + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {m.candidate?.name?.[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-900">{m.candidate?.name}</p>
                        <Badge className={`text-[9px] font-bold border-none ${statusBadge(m.applicationStatus)}`}>
                          {m.applicationStatus}
                        </Badge>
                      </div>
                      {m.candidate?.headline && (
                        <p className="text-xs text-slate-500 mb-2">{m.candidate.headline}</p>
                      )}

                      {/* Skills */}
                      {m.candidate?.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {m.candidate.skills.slice(0, 6).map(s => {
                            const matched = m.breakdown?.skills?.matched?.includes(s.toLowerCase());
                            return (
                              <span
                                key={s}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${matched ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                              >
                                {matched && '✓ '}{s}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Breakdown */}
                      <div className="flex flex-wrap gap-3 text-[10px]">
                        {m.candidate?.location && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <MapPin size={9} /> {m.candidate.location}
                            {m.breakdown?.location !== undefined && (
                              m.breakdown.location
                                ? <CheckCircle2 size={9} className="text-emerald-500 ml-0.5" />
                                : <XCircle size={9} className="text-slate-300 ml-0.5" />
                            )}
                          </span>
                        )}
                        {m.breakdown?.workMode !== undefined && (
                          <span className={`flex items-center gap-1 ${m.breakdown.workMode ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {m.breakdown.workMode ? <CheckCircle2 size={9} /> : <XCircle size={9} />} Work mode
                          </span>
                        )}
                        {m.breakdown?.jobType !== undefined && (
                          <span className={`flex items-center gap-1 ${m.breakdown.jobType ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {m.breakdown.jobType ? <CheckCircle2 size={9} /> : <XCircle size={9} />} Job type
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="shrink-0 text-right">
                      <div className={`text-lg font-bold ${colors.text}`}>{m.matchScore}%</div>
                      <ScoreBar value={m.matchScore} color={colors.bar} />
                      <p className="text-[9px] text-slate-400 mt-1">match score</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How it works */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award size={14} className="text-violet-500" />
            <p className="text-xs font-bold text-slate-700">How AI Matching Works</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-600">
            {[
              ['Skills match', '50 pts', 'Matched skills from job requirements'],
              ['Location match', '20 pts', 'Candidate location vs job location'],
              ['Work mode', '15 pts', 'Remote/Hybrid/On-site preference'],
              ['Job type', '15 pts', 'Full-time/Part-time preference match']
            ].map(([label, pts, desc]) => (
              <div key={label} className="flex items-start gap-2">
                <span className="text-[10px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded mt-0.5 shrink-0">{pts}</span>
                <div>
                  <p className="font-bold text-slate-700">{label}</p>
                  <p className="text-[10px] text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

const statusBadge = (status) => {
  const map = {
    pending: 'bg-slate-100 text-slate-600',
    reviewed: 'bg-blue-50 text-blue-600',
    shortlisted: 'bg-violet-50 text-violet-600',
    accepted: 'bg-emerald-50 text-emerald-600',
    rejected: 'bg-red-50 text-red-500',
    withdrawn: 'bg-slate-100 text-slate-400'
  };
  return map[status] || 'bg-slate-100 text-slate-600';
};

export default AICandidateMatching;
