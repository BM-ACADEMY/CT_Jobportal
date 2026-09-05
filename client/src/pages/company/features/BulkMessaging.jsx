import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Mail, Send, Users, Loader2, Briefcase, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { Card, Select, Input, Button, Row, Col, Checkbox, Spin, Badge } from 'antd';
import PageSOPBanner from '@/components/common/PageSOPBanner';
const { TextArea } = Input;
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
    pending: { bg: '#f1f5f9', text: '#334155' },
    reviewed: { bg: '#eff6ff', text: '#1d4ed8' },
    shortlisted: { bg: '#f5f3ff', text: '#6d28d9' },
    accepted: { bg: '#ecfdf5', text: '#047857' }
  };

  return (
    <FeatureGate
      featureKey="hasBulkMessaging"
      featureName="Bulk Messaging"
      description="Select a job, choose candidates, and send personalized messages to multiple applicants at once."
      subscriptionPath="/company/subscription"
    >
      <div className="space-y-6 pb-12">
        <PageSOPBanner pageKey="bulkMessaging" />
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

        <Row gutter={[24, 24]}>
          {/* Left: Job + Candidate selection */}
          <Col xs={24} lg={12}>
            {/* Job Picker */}
            <Card title={<span className="font-semibold text-slate-500 uppercase tracking-widest text-xs">1. Select Job</span>} bordered={false} className="shadow-sm rounded-xl mb-6">
              {loadingJobs ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm"><Spin size="small" /> Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <p className="text-sm text-slate-400">No active jobs found.</p>
              ) : (
                <Select
                  style={{ width: '100%' }}
                  size="large"
                  placeholder={<span className="flex items-center gap-2"><Briefcase size={14} className="text-sky-500" /> Choose a job...</span>}
                  value={selectedJob?._id}
                  onChange={(val) => {
                    const job = jobs.find(j => j._id === val);
                    setSelectedJob(job);
                  }}
                  options={jobs.map(j => ({ value: j._id, label: j.title }))}
                />
              )}
            </Card>

            {/* Candidate List */}
            <Card title={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 uppercase tracking-widest text-xs">2. Select Candidates</span>
                {applicants.length > 0 && (
                  <Button type="link" size="small" onClick={toggleAll} style={{ padding: 0 }}>
                    {selectedIds.size === applicants.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </div>
            } bordered={false} className="shadow-sm rounded-xl">
              {!selectedJob ? (
                <p className="text-sm text-slate-400 text-center py-6">Select a job to see applicants</p>
              ) : loadingApplicants ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <Spin size="small" /> Loading applicants...
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
                      <div
                        key={app._id}
                        onClick={() => toggleSelect(c._id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected ? 'border-sky-300 bg-sky-50' : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <Checkbox checked={isSelected} className="shrink-0" />
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{c.profile?.headline || c.email}</p>
                        </div>
                        <Badge 
                          count={app.status} 
                          style={{ backgroundColor: statusColors[app.status]?.bg || '#f1f5f9', color: statusColors[app.status]?.text || '#475569', fontSize: '10px', boxShadow: 'none' }} 
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedIds.size > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-sky-600 flex items-center gap-1.5">
                    <Users size={12} /> {selectedIds.size} candidate{selectedIds.size > 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </Card>
          </Col>

          {/* Right: Compose */}
          <Col xs={24} lg={12}>
            <Card title={<span className="font-semibold text-slate-500 uppercase tracking-widest text-xs">3. Compose Message</span>} bordered={false} className="shadow-sm rounded-xl h-full">
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">Subject <span className="text-slate-400 font-normal">(optional)</span></label>
                  <Input
                    size="large"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g., Next steps for your application"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">Message</label>
                  <TextArea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={8}
                    placeholder="Hi, we're pleased to inform you that..."
                  />
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500 space-y-1 border border-slate-100">
                  <p className="font-bold text-slate-600">Message Preview</p>
                  <p>To: <span className="font-semibold text-slate-700">{selectedIds.size} candidate{selectedIds.size !== 1 ? 's' : ''}</span> from <span className="font-semibold text-slate-700">{selectedJob?.title || '–'}</span></p>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleSend}
                  disabled={sending || selectedIds.size === 0 || !body.trim()}
                  loading={sending}
                  icon={!sending && <Send size={15} />}
                  style={{ backgroundColor: (sending || selectedIds.size === 0 || !body.trim()) ? undefined : '#0ea5e9' }}
                >
                  {sending ? 'Sending...' : `Send to ${selectedIds.size || 0} Candidate${selectedIds.size !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </FeatureGate>
  );
};

export default BulkMessaging;
