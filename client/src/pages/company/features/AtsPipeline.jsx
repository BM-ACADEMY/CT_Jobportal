import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';
import {
  Layers, Users, CheckCircle2, Circle, Plus, Loader2, ChevronRight,
  Briefcase, Search, Filter, Star, Sparkles, Download, ArrowRight,
  X, Check, Eye, Clock, Award, AlertCircle, RefreshCw, Mail, MapPin,
  SlidersHorizontal, CheckSquare, Square, Trash2, UserCheck, UploadCloud
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';

const STAGES = [
  {
    key: 'pending',
    label: 'Applied',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    headerBg: 'bg-slate-50 border-slate-200',
    dot: 'bg-slate-500'
  },
  {
    key: 'reviewed',
    label: 'Screening',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    headerBg: 'bg-blue-50/60 border-blue-200',
    dot: 'bg-blue-500'
  },
  {
    key: 'shortlisted',
    label: 'Interview',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    headerBg: 'bg-violet-50/60 border-violet-200',
    dot: 'bg-violet-500'
  },
  {
    key: 'accepted',
    label: 'Offer / Hired',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    headerBg: 'bg-emerald-50/60 border-emerald-200',
    dot: 'bg-emerald-500'
  },
  {
    key: 'rejected',
    label: 'Archived',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    headerBg: 'bg-rose-50/60 border-rose-200',
    dot: 'bg-rose-500'
  },
];

const AtsPipeline = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [bulkAiLoading, setBulkAiLoading] = useState(false);
  const { user } = useAuth();

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highestMatch

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const [inspectApp, setInspectApp] = useState(null);
  const [calculatingAI, setCalculatingAI] = useState(false);

  // Import CSV state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importOption, setImportOption] = useState('new'); // 'new' or jobId
  const [importRole, setImportRole] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/jobs/company-jobs-stats`, { headers });
        const jobList = Array.isArray(res.data) ? res.data : [];
        setJobs(jobList);
        if (jobList.length > 0) {
          setSelectedJob(jobList[0]);
        }
      } catch (err) {
        console.error('ATS fetch jobs error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    fetchApplicants();
  }, [selectedJob]);

  const fetchApplicants = async () => {
    if (!selectedJob) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/applications/job/${selectedJob._id}`,
        { headers }
      );
      setApplications(Array.isArray(res.data) ? res.data : []);
      setSelectedIds([]);
    } catch (err) {
      console.error('Applicants fetch error:', err);
      setApplications([]);
    }
  };

  const moveCandidate = async (applicationId, newStatus) => {
    setUpdating(applicationId);
    try {
      await axios.put(
        `${API_BASE_URL}/applications/${applicationId}/status`,
        { status: newStatus },
        { headers }
      );
      setApplications(prev =>
        prev.map(app => (app._id === applicationId ? { ...app, status: newStatus } : app))
      );
      if (inspectApp && inspectApp._id === applicationId) {
        setInspectApp(prev => ({ ...prev, status: newStatus }));
      }
      toast.success(`Candidate moved to ${STAGES.find(s => s.key === newStatus)?.label || newStatus}`);
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Failed to update stage');
    } finally {
      setUpdating(null);
    }
  };

  const togglePriority = async (e, app) => {
    e.stopPropagation();
    const newPriority = !app.isPriority;
    try {
      await axios.put(
        `${API_BASE_URL}/applications/${app._id}/status`,
        { isPriority: newPriority },
        { headers }
      );
      setApplications(prev =>
        prev.map(a => (a._id === app._id ? { ...a, isPriority: newPriority } : a))
      );
      if (inspectApp && inspectApp._id === app._id) {
        setInspectApp(prev => ({ ...prev, isPriority: newPriority }));
      }
      toast.success(newPriority ? 'Candidate marked as priority ★' : 'Priority removed');
    } catch (err) {
      toast.error('Failed to update priority');
    }
  };

  const computeAIMatch = async (app) => {
    setCalculatingAI(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/applications/${app._id}/calculate-match`,
        {},
        { headers }
      );
      if (res.data?.matchAnalysis) {
        setApplications(prev =>
          prev.map(a => (a._id === app._id ? { ...a, matchAnalysis: res.data.matchAnalysis } : a))
        );
        if (inspectApp && inspectApp._id === app._id) {
          setInspectApp(prev => ({ ...prev, matchAnalysis: res.data.matchAnalysis }));
        }
        toast.success('AI Match calculated successfully!');
      }
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to calculate AI match';
      toast.error(msg);
    } finally {
      setCalculatingAI(false);
    }
  };

  const handleBulkMove = async (newStatus) => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    try {
      await Promise.all(
        selectedIds.map(id =>
          axios.put(`${API_BASE_URL}/applications/${id}/status`, { status: newStatus }, { headers })
        )
      );
      setApplications(prev =>
        prev.map(a => (selectedIds.includes(a._id) ? { ...a, status: newStatus } : a))
      );
      toast.success(`Moved ${selectedIds.length} candidates to ${STAGES.find(s => s.key === newStatus)?.label}`);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Error updating some candidates');
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedJob) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/applications/export/${selectedJob._id}`, {
        headers,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pipeline-${selectedJob.title.replace(/\s+/g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Pipeline exported to CSV');
    } catch (err) {
      const msg = err.response?.data?.msg || 'CSV export limit reached or error exporting data';
      toast.error(msg);
    }
  };

  const handleImportPipeline = async (e) => {
    e.preventDefault();
    if (!importFile) return toast.error('CSV file is required');
    if (importOption === 'new' && !importRole.trim()) return toast.error('Role name is required for a new pipeline');
    
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('jobId', importOption);
    if (importOption === 'new') {
      formData.append('role', importRole.trim());
    }

    setImporting(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/jobs/import-pipeline`, formData, { headers });
      toast.success('Pipeline imported successfully!');
      setShowImportModal(false);
      setImportFile(null);
      setImportRole('');
      setImportOption('new');
      
      // If we imported into an existing job, we should probably fetch applications again
      if (importOption !== 'new') {
        const updatedJob = res.data.job;
        setJobs(jobs.map(j => j._id === updatedJob._id ? updatedJob : j));
        if (selectedJob?._id === updatedJob._id) {
          fetchApplications(updatedJob._id); // Refresh board
        }
      } else {
        setJobs([res.data.job, ...jobs]);
        setSelectedJob(res.data.job);
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to import pipeline');
    } finally {
      setImporting(false);
    }
  };

  const handleBulkAiMatch = async () => {
    if (!selectedJob) return toast.error('Please select a pipeline first');
    setBulkAiLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/jobs/${selectedJob._id}/bulk-ai-match`, {}, { headers });
      toast.success(res.data.msg);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to start bulk AI match');
    } finally {
      setBulkAiLoading(false);
    }
  };

  const toggleSelectCard = (e, appId) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  // Filtered & Sorted applications
  const filteredApplications = useMemo(() => {
    let list = [...applications];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(app => {
        const c = app.applicant || {};
        const name = (c.name || '').toLowerCase();
        const email = (c.email || '').toLowerCase();
        const headline = (c.profile?.headline || '').toLowerCase();
        const dispId = (app.display_id || '').toLowerCase();
        const skills = (c.profile?.skills || []).join(' ').toLowerCase();
        return name.includes(q) || email.includes(q) || headline.includes(q) || dispId.includes(q) || skills.includes(q);
      });
    }

    if (minMatchScore > 0) {
      list = list.filter(app => (app.matchAnalysis?.matchPercentage || 0) >= minMatchScore);
    }

    if (priorityOnly) {
      list = list.filter(app => app.isPriority);
    }

    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'highestMatch') {
      list.sort((a, b) => (b.matchAnalysis?.matchPercentage || 0) - (a.matchAnalysis?.matchPercentage || 0));
    }

    return list;
  }, [applications, searchQuery, minMatchScore, priorityOnly, sortBy]);

  // Analytics counts
  const totalCount = applications.length;
  const screeningCount = applications.filter(a => a.status === 'reviewed').length;
  const interviewCount = applications.filter(a => a.status === 'shortlisted').length;
  const offerCount = applications.filter(a => a.status === 'accepted').length;
  const priorityCount = applications.filter(a => a.isPriority).length;

  // Check for export feature
  const hasExportFeature = 
    user?.purchasedFeatures?.some(f => f.featureKey === 'hasCandidateDBExport' && f.isActive) || 
    user?.subscription?.features?.hasCandidateDBExport || 
    user?.subscription?.hasCandidateDBExport;

  return (
    <FeatureGate
      featureKey="hasATSPipeline"
      featureName="ATS Pipeline"
      description="Manage your entire hiring pipeline visually — move candidates through stages, automate triggers, analyze AI Match scores, and collaborate with your team."
      subscriptionPath="/company/subscription"
    >
      <div className="space-y-6 pb-12">
        <PageSOPBanner pageKey="atsPipeline" />
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20">
                <Layers size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">ATS Pipeline Management</h1>
                <p className="text-xs text-slate-500 font-medium">Drag-and-drop workflow, AI screening & multi-stage candidate analytics</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              disabled={!selectedJob || totalCount === 0 || !hasExportFeature}
              title={!hasExportFeature ? "Candidate DB Export feature required" : ""}
              className="h-9 px-4 rounded-xl text-xs font-bold gap-1.5 border-slate-200 hover:bg-slate-50"
            >
              <Download size={14} /> Export CSV
            </Button>
            <Button
              onClick={handleBulkAiMatch}
              disabled={!selectedJob || bulkAiLoading || totalCount === 0}
              className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-blue-500/20"
            >
              {bulkAiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              AI Matches
            </Button>
            <Button
              onClick={() => setShowImportModal(true)}
              className="h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-violet-500/20"
            >
              <Plus size={15} /> Add Job Pipeline
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-violet-600" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
            <Briefcase size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">No active job pipelines found</p>
            <p className="text-xs text-slate-400 mt-1 mb-5">Post a job to start receiving candidates and tracking them in the ATS Pipeline.</p>
            <Button onClick={() => navigate('/company/post-job')} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs">
              Post a Job
            </Button>
          </div>
        ) : (
          <>
            {/* Job Selector Dropdown */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Select Pipeline</label>
              <select
                value={selectedJob?._id || ''}
                onChange={(e) => {
                  const job = jobs.find(j => j._id === e.target.value);
                  if (job) setSelectedJob(job);
                }}
                className="h-10 px-4 rounded-xl border border-violet-200 bg-violet-50 text-sm font-bold text-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-400 min-w-[280px] cursor-pointer"
              >
                {jobs.map(job => (
                  <option key={job._id} value={job._id}>
                    {job.title} ({job.applicantsCount || 0} candidates)
                  </option>
                ))}
              </select>
            </div>

            {/* Pipeline Conversion KPI Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-slate-900">{totalCount}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Applications</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-blue-600">
                  {totalCount > 0 ? `${Math.round((screeningCount / totalCount) * 100)}%` : '0%'}
                </p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Screening Rate ({screeningCount})</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-violet-600">
                  {totalCount > 0 ? `${Math.round((interviewCount / totalCount) * 100)}%` : '0%'}
                </p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Interview Rate ({interviewCount})</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-emerald-600">
                  {totalCount > 0 ? `${Math.round((offerCount / totalCount) * 100)}%` : '0%'}
                </p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Offer Rate ({offerCount})</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-amber-500">{priorityCount}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Priority Candidates ★</p>
              </div>
            </div>

            {/* Search, Filters & Bulk Action Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search candidates by name, email, skills, or display ID..."
                    className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filters & Sorting */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Minimum AI Match Score */}
                  <select
                    value={minMatchScore}
                    onChange={e => setMinMatchScore(Number(e.target.value))}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
                  >
                    <option value={0}>All AI Scores</option>
                    <option value={80}>⚡ 80%+ Top Match</option>
                    <option value={65}>⚡ 65%+ Good Match</option>
                    <option value={50}>⚡ 50%+ Moderate</option>
                  </select>

                  {/* Priority Toggle Button */}
                  <button
                    onClick={() => setPriorityOnly(v => !v)}
                    className={`h-10 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      priorityOnly
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <Star size={13} className={priorityOnly ? 'fill-white' : 'text-amber-500'} />
                    <span>Starred Only</span>
                  </button>

                  {/* Sort By Dropdown */}
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                    <option value="highestMatch">Sort: Highest AI Match</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions Bar when candidates are selected */}
              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 border border-violet-200">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-violet-600 text-white text-xs font-bold px-2.5 py-0.5">
                      {selectedIds.length} Selected
                    </Badge>
                    <span className="text-xs font-semibold text-violet-900">
                      Perform bulk action across pipeline:
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      disabled={bulkProcessing}
                      onClick={() => handleBulkMove('reviewed')}
                      className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                    >
                      Move to Screening
                    </Button>
                    <Button
                      size="sm"
                      disabled={bulkProcessing}
                      onClick={() => handleBulkMove('shortlisted')}
                      className="h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold"
                    >
                      Move to Interview
                    </Button>
                    <Button
                      size="sm"
                      disabled={bulkProcessing}
                      onClick={() => handleBulkMove('accepted')}
                      className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Mark Hired / Offer
                    </Button>
                    <Button
                      size="sm"
                      disabled={bulkProcessing}
                      onClick={() => handleBulkMove('rejected')}
                      className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                    >
                      Reject
                    </Button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Kanban Board Layout */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {STAGES.map(stage => {
                  const stageCandidates = filteredApplications.filter(a => a.status === stage.key);
                  return (
                    <div
                      key={stage.key}
                      className="w-[280px] shrink-0 bg-slate-50/70 rounded-2xl border border-slate-200/80 flex flex-col max-h-[75vh]"
                    >
                      {/* Stage Column Header */}
                      <div className={`p-3.5 rounded-t-2xl border-b flex items-center justify-between ${stage.headerBg}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            {stage.label}
                          </span>
                        </div>
                        <Badge className={`text-[11px] font-extrabold px-2 py-0.5 border ${stage.color}`}>
                          {stageCandidates.length}
                        </Badge>
                      </div>

                      {/* Stage Cards Container */}
                      <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                        {stageCandidates.length === 0 ? (
                          <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
                            <p className="text-[11px] font-bold text-slate-400">No candidates in {stage.label}</p>
                          </div>
                        ) : (
                          stageCandidates.map(app => {
                            const candidate = app.applicant || {};
                            const name = candidate.name || 'Candidate';
                            const title = candidate.profile?.headline || candidate.recruiterProfile?.jobTitle || 'Applicant';
                            const matchScore = app.matchAnalysis?.matchPercentage;
                            const isSelected = selectedIds.includes(app._id);

                            return (
                              <div
                                key={app._id}
                                onClick={() => setInspectApp(app)}
                                className={`bg-white rounded-xl border p-3.5 transition-all cursor-pointer relative group ${
                                  isSelected
                                    ? 'border-violet-500 ring-2 ring-violet-500/20 shadow-sm'
                                    : 'border-slate-200 hover:border-violet-300 hover:shadow-md'
                                }`}
                              >
                                {/* Top Row: Select checkbox, Display ID & Priority Star */}
                                <div className="flex items-center justify-between gap-1 mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={e => toggleSelectCard(e, app._id)}
                                      className="text-slate-300 hover:text-violet-600 transition-colors"
                                    >
                                      {isSelected ? (
                                        <CheckSquare size={15} className="text-violet-600" />
                                      ) : (
                                        <Square size={15} />
                                      )}
                                    </button>
                                    {app.display_id && (
                                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {app.display_id}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={e => togglePriority(e, app)}
                                    className="p-1 rounded hover:bg-slate-100 transition-colors"
                                    title={app.isPriority ? 'Starred Priority' : 'Mark Priority'}
                                  >
                                    <Star
                                      size={15}
                                      className={app.isPriority ? 'fill-amber-400 text-amber-500' : 'text-slate-300 hover:text-amber-400'}
                                    />
                                  </button>
                                </div>

                                {/* Avatar & Candidate Details */}
                                <div className="flex items-start gap-2.5">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
                                    {name[0]?.toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
                                      {updating === app._id && (
                                        <Loader2 size={12} className="animate-spin text-violet-600 shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                      {title}
                                    </p>
                                  </div>
                                </div>

                                {/* AI Match Score Pill */}
                                <div className="mt-3 flex items-center justify-between gap-2">
                                  {app.matchAnalysis?.insufficientData ? (
                                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1" title="Not enough profile/job data for a reliable AI match">
                                      <Sparkles size={11} /> Not enough data
                                    </span>
                                  ) : matchScore !== undefined && matchScore !== null ? (
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                      matchScore >= 80
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : matchScore >= 60
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      <Sparkles size={11} />
                                      <span>{matchScore}% AI Match</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                      <Sparkles size={11} /> Unscored
                                    </span>
                                  )}

                                  <span className="text-[9px] font-semibold text-slate-400">
                                    {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>

                                {/* Quick stage transitions on hover */}
                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Move:</span>
                                  <div className="flex items-center gap-1">
                                    {STAGES.filter(s => s.key !== stage.key).slice(0, 3).map(s => (
                                      <button
                                        key={s.key}
                                        type="button"
                                        onClick={e => {
                                          e.stopPropagation();
                                          moveCandidate(app._id, s.key);
                                        }}
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-600 transition-colors"
                                        title={`Move to ${s.label}`}
                                      >
                                        → {s.label.split(' ')[0]}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Import Pipeline CSV Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                  <UploadCloud size={16} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Import CSV Pipeline</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleImportPipeline} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Pipeline</label>
                <select
                  value={importOption}
                  onChange={(e) => setImportOption(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-violet-400 focus:outline-none"
                >
                  <option value="new">+ Create New Pipeline</option>
                  <optgroup label="Existing Pipelines">
                    {jobs.map(job => (
                      <option key={job._id} value={job._id}>{job.title}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              
              {importOption === 'new' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Role Name</label>
                  <input
                    required={importOption === 'new'}
                    type="text"
                    placeholder="e.g. Senior Frontend Developer"
                    value={importRole}
                    onChange={(e) => setImportRole(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-violet-400 focus:outline-none"
                  />
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">CSV File</label>
                <div className="relative">
                  <input
                    required
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 border border-slate-200 rounded-xl p-1 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-slate-400">
                    Columns: Name, Email, Headline, Status
                  </p>
                  <a href="/sample_pipeline.csv" download className="text-[10px] font-bold text-violet-600 hover:text-violet-700 underline underline-offset-2 decoration-violet-300">
                    Download Sample CSV
                  </a>
                </div>
              </div>
              <Button
                type="submit"
                disabled={importing}
                className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
              >
                {importing ? <Loader2 size={16} className="animate-spin mr-2" /> : <UploadCloud size={16} className="mr-2" />}
                Import Candidates
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Full Application Inspector Drawer Modal */}
      {inspectApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-sm">
                  {inspectApp.applicant?.name?.[0]?.toUpperCase() || 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {inspectApp.applicant?.name || 'Applicant Detail'}
                    </h3>
                    {inspectApp.display_id && (
                      <span className="text-xs font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                        {inspectApp.display_id}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {inspectApp.applicant?.profile?.headline || inspectApp.applicant?.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectApp(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Stage Selection & Priority Toolbar */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Stage</p>
                  <div className="flex items-center gap-2 mt-1">
                    <select
                      value={inspectApp.status}
                      onChange={e => moveCandidate(inspectApp._id, e.target.value)}
                      className="h-9 px-3 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
                    >
                      {STAGES.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={e => togglePriority(e, inspectApp)}
                    className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      inspectApp.isPriority
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    <Star size={14} className={inspectApp.isPriority ? 'fill-white' : 'text-amber-500'} />
                    <span>{inspectApp.isPriority ? 'Starred Priority' : 'Mark Priority'}</span>
                  </button>
                </div>
              </div>

              {/* AI Match Compatibility Box */}
              <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/40 p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">AI Compatibility Analysis</p>
                      <p className="text-[11px] text-slate-500 font-medium">Powered by Gemini AI Engine</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    disabled={calculatingAI}
                    onClick={() => computeAIMatch(inspectApp)}
                    className="h-8 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold gap-1.5"
                  >
                    {calculatingAI ? (
                      <><Loader2 size={13} className="animate-spin" /> Analyzing...</>
                    ) : (
                      <><RefreshCw size={13} /> {inspectApp.matchAnalysis?.matchPercentage != null ? 'Re-Analyze' : 'Compute Match'}</>
                    )}
                  </Button>
                </div>

                {calculatingAI ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-6 text-slate-400">
                    <Loader2 size={20} className="animate-spin text-violet-500" />
                    <p className="text-xs font-semibold">Running fresh AI analysis…</p>
                  </div>
                ) : inspectApp.matchAnalysis?.insufficientData ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-widest">
                      Not enough data
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                      {inspectApp.matchAnalysis.verdict}
                    </p>
                  </div>
                ) : inspectApp.matchAnalysis?.matchPercentage != null ? (
                  <div className="space-y-4 pt-2">
                    {/* Score Bar */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Overall Job Match</span>
                      <span className="text-lg font-black text-violet-700">
                        {inspectApp.matchAnalysis.matchPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 transition-all duration-500"
                        style={{ width: `${inspectApp.matchAnalysis.matchPercentage}%` }}
                      />
                    </div>

                    {/* Verdict */}
                    {inspectApp.matchAnalysis.verdict && (
                      <p className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-violet-100 leading-relaxed">
                        {inspectApp.matchAnalysis.verdict}
                      </p>
                    )}

                    {/* Matched vs Missing Skills */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">
                          Matched Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(inspectApp.matchAnalysis.matchedSkills || []).map((sk, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                              ✓ {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1.5">
                          Missing Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(inspectApp.matchAnalysis.missingSkills || []).map((sk, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200">
                              ✕ {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Click "Compute Match" to run AI resume vs job description screening analysis.
                  </p>
                )}
              </div>

              {/* Applicant Profile Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Candidate Information</h4>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="font-semibold">{inspectApp.applicant?.email || 'N/A'}</span>
                  </div>
                  {inspectApp.applicant?.profile?.location && (
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span>{inspectApp.applicant.profile.location}</span>
                    </div>
                  )}
                  {inspectApp.applicant?.profile?.skills?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-1.5">Skills Overview</p>
                      <div className="flex flex-wrap gap-1.5">
                        {inspectApp.applicant.profile.skills.map((sk, i) => (
                          <Badge key={i} variant="secondary" className="text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {sk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Screening Questions & Answers */}
              {inspectApp.answers?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Screening Questionnaire</h4>
                  <div className="space-y-2.5">
                    {inspectApp.answers.map((item, index) => (
                      <div key={index} className="rounded-xl border border-slate-100 bg-white p-3.5 space-y-1">
                        <p className="text-xs font-bold text-slate-800">Q: {item.questionText}</p>
                        <p className="text-xs text-violet-700 font-semibold bg-violet-50/50 p-2 rounded-lg">
                          {String(item.answer)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 shrink-0">
              <Button
                variant="outline"
                onClick={() => setInspectApp(null)}
                className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200"
              >
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    if (inspectApp.applicant?._id) {
                      navigate(`/jobseeker/profile/${inspectApp.applicant._id}`);
                    }
                  }}
                  className="h-10 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold gap-1.5 shadow-md shadow-violet-500/20"
                >
                  <Eye size={14} /> Full Profile
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
    </FeatureGate>
  );
};

export default AtsPipeline;
