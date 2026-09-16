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
import { Card, Select, Input, Button, Modal, Drawer, Spin, Tag, Avatar, Tooltip, Progress, Space } from 'antd';
import { toast } from 'sonner';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';

const STAGES = [
  {
    key: 'pending',
    label: 'Applied',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    headerBg: 'bg-white border-slate-200',
    dot: 'bg-slate-600'
  },
  {
    key: 'reviewed',
    label: 'Screening',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    headerBg: 'bg-white border-slate-200',
    dot: 'bg-blue-500'
  },
  {
    key: 'shortlisted',
    label: 'Interview',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    headerBg: 'bg-white border-slate-200',
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
    headerBg: 'bg-white border-slate-200',
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
          fetchApplicants(); // Refresh board
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
              disabled={!selectedJob || totalCount === 0 || !hasExportFeature}
              title={!hasExportFeature ? "Candidate DB Export feature required" : ""}
              icon={<Download size={14} />}
            >
              Export CSV
            </Button>
            <Button
              type="primary"
              onClick={handleBulkAiMatch}
              loading={bulkAiLoading}
              disabled={!selectedJob || totalCount === 0}
              icon={<Sparkles size={15} />}
            >
              AI Matches
            </Button>
            <Button
              type="primary"
              onClick={() => setShowImportModal(true)}
              icon={<Plus size={15} />}
            >
              Add Job Pipeline
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white">
            <Briefcase size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700">No active job pipelines found</p>
            <p className="text-xs text-slate-400 mt-1 mb-5">Post a job to start receiving candidates and tracking them in the ATS Pipeline.</p>
            <Button 
              type="primary" 
              onClick={() => navigate('/company/jobs/new')} 
              style={{ fontWeight: 'bold', borderRadius: '8px' }}
            >
              Post a Job
            </Button>
          </div>
        ) : (
          <>
            {/* Job Selector Dropdown */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Select Pipeline</label>
              <Select
                value={selectedJob?._id || undefined}
                onChange={(value) => {
                  const job = jobs.find(j => j._id === value);
                  if (job) setSelectedJob(job);
                }}
                style={{ width: 320 }}
                size="large"
                options={jobs.map(job => ({
                  value: job._id,
                  label: `${job.title} (${job.applicantsCount || 0} candidates)`
                }))}
              />
            </div>

            {/* Pipeline Conversion KPI Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card
                bordered={false}
                style={{ backgroundColor: '#9061F9', color: 'white', borderRadius: 0, overflow: 'hidden' }}
                styles={{ body: { padding: '24px', position: 'relative' } }}
              >
                <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/10" />
                
                <Briefcase size={22} className="text-white mb-6" strokeWidth={1.5} />
                <p className="text-[12px] font-black text-white/90 uppercase tracking-widest mb-1">Total Applied</p>
                <p className="text-[40px] font-black text-white leading-none mt-2">{totalCount}</p>
              </Card>

              <Card
                bordered={false}
                style={{ backgroundColor: '#F97316', color: 'white', borderRadius: 0, overflow: 'hidden' }}
                styles={{ body: { padding: '24px', position: 'relative' } }}
              >
                <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/10" />

                <Clock size={22} className="text-white mb-6" strokeWidth={1.5} />
                <p className="text-[12px] font-black text-white/90 uppercase tracking-widest mb-1">Pending</p>
                <p className="text-[40px] font-black text-white leading-none mt-2">{applications.filter(a => a.status === 'pending').length}</p>
              </Card>

              <Card
                bordered={false}
                style={{ backgroundColor: '#10B981', color: 'white', borderRadius: 0, overflow: 'hidden' }}
                styles={{ body: { padding: '24px', position: 'relative' } }}
              >
                <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/10" />

                <CheckSquare size={22} className="text-white mb-6" strokeWidth={1.5} />
                <p className="text-[12px] font-black text-white/90 uppercase tracking-widest mb-1">Shortlisted</p>
                <p className="text-[40px] font-black text-white leading-none mt-2">{applications.filter(a => a.status === 'shortlisted').length}</p>
              </Card>

              <Card
                bordered={false}
                style={{ backgroundColor: '#F43F5E', color: 'white', borderRadius: 0, overflow: 'hidden' }}
                styles={{ body: { padding: '24px', position: 'relative' } }}
              >
                <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/10" />

                <div className="w-[22px] h-[22px] border-2 border-white rounded-[4px] flex items-center justify-center mb-6">
                  <X size={14} className="text-white" strokeWidth={2.5} />
                </div>
                <p className="text-[12px] font-black text-white/90 uppercase tracking-widest mb-1">Rejected</p>
                <p className="text-[40px] font-black text-white leading-none mt-2">{applications.filter(a => a.status === 'rejected').length}</p>
              </Card>
            </div>

            {/* Search, Filters & Bulk Action Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Input.Search
                    placeholder="Search candidates by name, email, skills..."
                    allowClear
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    size="large"
                    style={{ maxWidth: 400 }}
                  />
                </div>

                {/* Filters & Sorting */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Minimum AI Match Score */}
                  <Select
                    value={minMatchScore}
                    onChange={value => setMinMatchScore(value)}
                    size="large"
                    style={{ width: 180 }}
                    options={[
                      { value: 0, label: 'All AI Scores' },
                      { value: 80, label: '⚡ 80%+ Top Match' },
                      { value: 65, label: '⚡ 65%+ Good Match' },
                      { value: 50, label: '⚡ 50%+ Moderate' },
                    ]}
                  />

                  {/* Priority Toggle Button */}
                  <Button
                    size="large"
                    type={priorityOnly ? 'primary' : 'default'}
                    onClick={() => setPriorityOnly(v => !v)}
                    icon={<Star size={14} className={priorityOnly ? 'fill-white' : 'text-amber-500'} />}
                    style={priorityOnly ? { backgroundColor: '#F59E0B', borderColor: '#F59E0B' } : {}}
                  >
                    Starred Only
                  </Button>

                  {/* Sort By Dropdown */}
                  <Select
                    value={sortBy}
                    onChange={value => setSortBy(value)}
                    size="large"
                    style={{ width: 190 }}
                    options={[
                      { value: 'newest', label: 'Sort: Newest First' },
                      { value: 'oldest', label: 'Sort: Oldest First' },
                      { value: 'highestMatch', label: 'Sort: Highest AI Match' },
                    ]}
                  />
                </div>
              </div>

              {/* Bulk Actions Bar when candidates are selected */}
              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 border border-violet-200">
                  <div className="flex items-center gap-2">
                    <Tag color="purple" style={{ fontWeight: 'bold' }}>
                      {selectedIds.length} Selected
                    </Tag>
                    <span className="text-xs font-semibold text-violet-900">
                      Perform bulk action across pipeline:
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="small"
                      disabled={bulkProcessing}
                      onClick={() => handleBulkMove('reviewed')}
                    >
                      Move to Screening
                    </Button>
                    <Button
                      size="small"
                      disabled={bulkProcessing}
                      onClick={() => handleBulkMove('shortlisted')}
                    >
                      Move to Interview
                    </Button>
                    <Button
                      size="small"
                      disabled={bulkProcessing}
                      onClick={() => handleBulkMove('accepted')}
                    >
                      Mark Hired / Offer
                    </Button>
                    <Button
                      size="small"
                      danger
                      disabled={bulkProcessing}
                      onClick={() => handleBulkMove('rejected')}
                    >
                      Reject
                    </Button>
                    <Button type="text" size="small" onClick={() => setSelectedIds([])}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Kanban Board Layout */}
            <div className="overflow-x-auto pb-4 no-scrollbar">
              <div className="flex gap-4 min-w-max">
                {STAGES.map(stage => {
                  const stageCandidates = filteredApplications.filter(a => a.status === stage.key);
                  return (
                    <div
                      key={stage.key}
                      className="w-[280px] shrink-0 bg-[#f8fafc] rounded-xl border border-slate-200/80 flex flex-col max-h-[75vh]"
                    >
                      {/* Stage Column Header */}
                      <div className={`p-3.5 rounded-t-2xl border-b flex items-center justify-between ${stage.headerBg}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            {stage.label}
                          </span>
                        </div>
                        <Tag style={{ borderRadius: '12px', margin: 0 }}>
                          {stageCandidates.length}
                        </Tag>
                      </div>

                      {/* Stage Cards Container */}
                      <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 no-scrollbar">
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
                              <Card
                                key={app._id}
                                size="small"
                                onClick={() => setInspectApp(app)}
                                hoverable
                                className={`transition-all cursor-pointer relative group ${isSelected ? 'shadow-md' : ''}`}
                                style={{
                                  borderRadius: '12px',
                                  borderColor: isSelected ? '#8B5CF6' : '#E2E8F0',
                                  borderWidth: isSelected ? 2 : 1,
                                  marginBottom: '10px',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                                }}
                                styles={{ body: { padding: '14px', position: 'relative' } }}
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
                                      <Tag color="default" style={{ fontSize: '10px', margin: 0, padding: '0 4px', lineHeight: '18px', backgroundColor: '#f1f5f9', border: 'none' }}>
                                        {app.display_id}
                                      </Tag>
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
                                  <Avatar 
                                    size={36} 
                                    style={{ backgroundColor: '#8B5CF6', color: 'white', fontSize: '14px', borderRadius: '8px' }}
                                    shape="square"
                                  >
                                    {name[0]?.toUpperCase()}
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
                                      {updating === app._id && (
                                        <Spin size="small" />
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
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${matchScore >= 80 ? 'bg-emerald-50 text-emerald-600' : matchScore >= 60 ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-500'}`}>
                                      <Sparkles size={10} />
                                      <span>{matchScore}% AI Match</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                      <Sparkles size={11} /> Unscored
                                    </span>
                                  )}

                                  <span className="text-[9px] font-semibold text-slate-400">
                                    {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>

                                {/* Quick stage transitions on hover */}
                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Move:</span>
                                  <div className="flex items-center gap-1">
                                    {STAGES.filter(s => s.key !== stage.key).slice(0, 3).map(s => (
                                      <Button
                                        key={s.key}
                                        type="text"
                                        size="small"
                                        onClick={e => {
                                          e.stopPropagation();
                                          moveCandidate(app._id, s.key);
                                        }}
                                        style={{ fontSize: '9px', padding: '0 4px', height: '20px', color: '#64748B' }}
                                        title={`Move to ${s.label}`}
                                      >
                                        → {s.label.split(' ')[0]}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </Card>
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
      <Modal
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <UploadCloud size={16} />
            </div>
            <h3 className="text-base font-bold text-slate-900 m-0">Import CSV Pipeline</h3>
          </div>
        }
        open={showImportModal}
        onCancel={() => setShowImportModal(false)}
        footer={null}
        width={500}
      >
        <form onSubmit={handleImportPipeline} className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Pipeline</label>
            <Select
              value={importOption}
              onChange={(value) => setImportOption(value)}
              size="large"
              style={{ width: '100%' }}
              options={[
                { value: 'new', label: '+ Create New Pipeline' },
                {
                  label: 'Existing Pipelines',
                  options: jobs.map(job => ({ value: job._id, label: job.title }))
                }
              ]}
            />
          </div>
          
          {importOption === 'new' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Role Name</label>
              <Input
                required={importOption === 'new'}
                placeholder="e.g. Senior Frontend Developer"
                value={importRole}
                onChange={(e) => setImportRole(e.target.value)}
                size="large"
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
            type="primary"
            htmlType="submit"
            loading={importing}
            style={{ width: '100%', height: '44px', fontWeight: 'bold', backgroundColor: '#7C3AED' }}
            icon={<UploadCloud size={16} />}
          >
            Import Candidates
          </Button>
        </form>
      </Modal>

      {/* Full Application Inspector Drawer Modal */}
      <Drawer
        title={
          inspectApp && (
            <div className="flex items-center gap-3">
              <Avatar size={40} style={{ backgroundColor: '#7C3AED', color: 'white', fontWeight: 'bold', fontSize: '16px' }} shape="square">
                {inspectApp.applicant?.name?.[0]?.toUpperCase() || 'C'}
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-slate-900 m-0 leading-none">
                    {inspectApp.applicant?.name || 'Applicant Detail'}
                  </h3>
                  {inspectApp.display_id && (
                    <Tag color="default" style={{ margin: 0, fontWeight: 'bold' }}>
                      {inspectApp.display_id}
                    </Tag>
                  )}
                </div>
                <p className="text-xs text-slate-500 m-0 leading-none">
                  {inspectApp.applicant?.profile?.headline || inspectApp.applicant?.email}
                </p>
              </div>
            </div>
          )
        }
        placement="right"
        width={560}
        onClose={() => setInspectApp(null)}
        open={!!inspectApp}
        styles={{ body: { padding: '24px', backgroundColor: '#f8fafc' } }}
        footer={
          inspectApp && (
            <div className="flex items-center justify-between gap-3 w-full py-2">
              <Button onClick={() => setInspectApp(null)} style={{ fontWeight: 'bold' }}>
                Close
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  if (inspectApp.applicant?._id) {
                    navigate(`/candidate/profile/${inspectApp.applicant._id}`);
                  }
                }}
                style={{ backgroundColor: '#7C3AED', fontWeight: 'bold' }}
                icon={<Eye size={14} />}
              >
                Full Profile
              </Button>
            </div>
          )
        }
      >
        {inspectApp && (
          <div className="space-y-6">
            
            {/* Stage Selection & Priority Toolbar */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Stage</p>
                <Select
                  value={inspectApp.status}
                  onChange={value => moveCandidate(inspectApp._id, value)}
                  style={{ width: 160 }}
                  options={STAGES.map(s => ({ value: s.key, label: s.label }))}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type={inspectApp.isPriority ? 'primary' : 'default'}
                  onClick={e => togglePriority(e, inspectApp)}
                  icon={<Star size={14} className={inspectApp.isPriority ? 'fill-white' : 'text-amber-500'} />}
                  style={inspectApp.isPriority ? { backgroundColor: '#F59E0B', borderColor: '#F59E0B', fontWeight: 'bold' } : { fontWeight: 'bold' }}
                >
                  {inspectApp.isPriority ? 'Starred Priority' : 'Mark Priority'}
                </Button>
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
                    <p className="text-sm font-bold text-slate-900 m-0">AI Compatibility Analysis</p>
                    <p className="text-[11px] text-slate-500 font-medium m-0">Powered by Gemini AI Engine</p>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="small"
                  loading={calculatingAI}
                  onClick={() => computeAIMatch(inspectApp)}
                  style={{ backgroundColor: '#7C3AED', fontWeight: 'bold' }}
                  icon={!calculatingAI && <RefreshCw size={13} />}
                >
                  {inspectApp.matchAnalysis?.matchPercentage != null ? 'Re-Analyze' : 'Compute Match'}
                </Button>
              </div>

              {calculatingAI ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-slate-400">
                  <Spin />
                  <p className="text-xs font-semibold mt-2 m-0">Running fresh AI analysis…</p>
                </div>
              ) : inspectApp.matchAnalysis?.insufficientData ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <Tag color="warning" style={{ fontWeight: 'bold', padding: '2px 10px', borderRadius: '12px', margin: 0 }}>
                    NOT ENOUGH DATA
                  </Tag>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm m-0 mt-2">
                    {inspectApp.matchAnalysis.verdict}
                  </p>
                </div>
              ) : inspectApp.matchAnalysis?.matchPercentage != null ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">Overall Job Match</span>
                      <span className="text-lg font-black text-violet-700">
                        {inspectApp.matchAnalysis.matchPercentage}%
                      </span>
                    </div>
                    <Progress 
                      percent={inspectApp.matchAnalysis.matchPercentage} 
                      showInfo={false} 
                      strokeColor={{ '0%': '#8B5CF6', '100%': '#4F46E5' }} 
                    />
                  </div>

                  {inspectApp.matchAnalysis.verdict && (
                    <p className="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-violet-100 leading-relaxed m-0">
                      {inspectApp.matchAnalysis.verdict}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">
                        Matched Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(inspectApp.matchAnalysis.matchedSkills || []).map((sk, i) => (
                          <Tag key={i} color="green" style={{ borderRadius: '6px', margin: 0 }}>✓ {sk}</Tag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1.5">
                        Missing Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(inspectApp.matchAnalysis.missingSkills || []).map((sk, i) => (
                          <Tag key={i} color="red" style={{ borderRadius: '6px', margin: 0 }}>✕ {sk}</Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center m-0">
                  Click "Compute Match" to run AI resume vs job description screening analysis.
                </p>
              )}
            </div>

            {/* Applicant Profile Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest m-0">Candidate Information</h4>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2.5 shadow-sm">
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
                  <div className="pt-1">
                    <p className="text-[10px] font-bold text-slate-400 mb-1.5">Skills Overview</p>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectApp.applicant.profile.skills.map((sk, i) => (
                        <Tag key={i} color="default" style={{ borderRadius: '6px', margin: 0 }}>{sk}</Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Screening Questions & Answers */}
            {inspectApp.answers?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest m-0">Screening Questionnaire</h4>
                <div className="space-y-2.5">
                  {inspectApp.answers.map((item, index) => (
                    <div key={index} className="rounded-xl border border-slate-100 bg-white p-3.5 space-y-2 shadow-sm">
                      <p className="text-xs font-bold text-slate-800 m-0">Q: {item.questionText}</p>
                      <p className="text-xs text-violet-700 font-semibold bg-violet-50/50 p-2 rounded-lg m-0">
                        {String(item.answer)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </FeatureGate>
  );
};

export default AtsPipeline;
