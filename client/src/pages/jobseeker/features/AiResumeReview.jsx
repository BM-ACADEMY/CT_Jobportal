import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Send, CheckCircle2, Loader2, FileText, RefreshCw, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Typography, Button, Tag, Modal, Form, Input, Collapse } from 'antd';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';

const { Title, Text } = Typography;
const { TextArea } = Input;
const API = import.meta.env.VITE_API_BASE_URL;
const PAGE_SIZE = 5;

/* ─── Request Modal ─────────────────────────────────────────────────────────── */
const RequestModal = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visible) {
      setDone(false);
      setError('');
      form.resetFields();
    }
  }, [visible, form]);

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      await axios.post(
        `${API}/requests/ai-resume-review`,
        values,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setDone(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Request AI Review"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Text className="text-slate-500 block mb-6 -mt-2">Our AI will review your profile resume.</Text>
      
      {done ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <Title level={4} className="m-0 mb-2">Review Requested!</Title>
          <Text className="text-slate-500">Your AI Resume Review request has been submitted. Our AI system will analyse your resume shortly.</Text>
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="jobRole" label="TARGET ROLE" rules={[{ required: true, message: 'Please enter your target role' }]}>
            <Input placeholder="e.g. Senior Software Engineer" size="large" />
          </Form.Item>
          
          <Form.Item name="notes" label={<>FOCUS AREAS <span className="font-normal normal-case text-slate-400 ml-1">(optional)</span></>}>
            <TextArea placeholder="e.g. I'm targeting senior product manager roles at fintech companies. Please focus on my work experience section." rows={4} size="large" />
          </Form.Item>

          {error && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </p>
          )}

          <Button type="primary" htmlType="submit" loading={loading} className="w-full h-11 text-sm font-bold bg-violet-600 hover:bg-violet-700 border-none shadow-md shadow-violet-500/20 mt-2" icon={!loading && <Send size={15} />}>
            Request AI Review
          </Button>
        </Form>
      )}
    </Modal>
  );
};

/* ─── Requests Table ─────────────────────────────────────────────────────────── */
const RequestsTable = ({ requests, loading }) => {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageItems  = requests.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (page === 1 && pageItems.length > 0 && !expandedId) {
      setExpandedId(pageItems[0]._id);
    }
  }, [pageItems, page, expandedId]);

  return (
    <div>
      <div className="divide-y divide-slate-100 min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
            <Loader2 size={24} className="animate-spin mb-3" />
            <p className="text-xs font-medium">Loading history...</p>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center px-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3">
              <FileText size={20} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-700">No AI Reviews yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              Request a review to see your AI analysis here.
            </p>
          </div>
        ) : (
          pageItems.map(req => {
            let data = null;
            try { data = JSON.parse(req.adminNotes); } catch(e) {}
            const isExpanded = expandedId === req._id;
            
            return (
              <div key={req._id} className="border-b border-slate-100 last:border-0 bg-white">
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : req._id)}
                  className="w-full text-left p-5 hover:bg-slate-50/80 transition-colors flex items-center justify-between group"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                      {req.jobRole || 'General Profile Review'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(req.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {data && data.score && (
                      <span className="px-3 py-1 bg-violet-50 text-violet-700 font-bold text-xs rounded-full border border-violet-100">
                        Score: {data.score}/100
                      </span>
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-6 pt-2 bg-slate-50/20">
                    {!data ? (
                      <p className="text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-100">Review request received. Details not available yet.</p>
                    ) : (
                      <div className="space-y-6">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{data.summary}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
                            <h4 className="text-xs font-bold text-emerald-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                              <CheckCircle2 size={14} /> Strengths
                            </h4>
                            <ul className="space-y-3 m-0">
                              {(data.strengths || []).map((item, i) => (
                                <li key={i} className="text-sm text-emerald-700 leading-relaxed pl-3 border-l-2 border-emerald-300">{item}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-5">
                            <h4 className="text-xs font-bold text-rose-800 mb-3 uppercase tracking-widest flex items-center gap-2">
                              <AlertCircle size={14} /> Areas to Improve
                            </h4>
                            <ul className="space-y-3 m-0">
                              {(data.weaknesses || []).map((item, i) => (
                                <li key={i} className="text-sm text-rose-700 leading-relaxed pl-3 border-l-2 border-rose-300">{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                          <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-widest">Missing Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {(data.missingKeywords || []).map((kw, i) => (
                              <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm">{kw}</span>
                            ))}
                            {(!data.missingKeywords || data.missingKeywords.length === 0) && (
                              <span className="text-sm text-slate-500">None detected.</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <h4 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-widest">Actionable Steps</h4>
                          <ul className="space-y-4 m-0">
                            {(data.actionableSteps || []).map((step, i) => (
                              <li key={i} className="flex gap-4 text-sm text-slate-600">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs">{i + 1}</span>
                                <span className="mt-0.5 leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs text-slate-500 font-medium m-0">
            Showing <span className="text-slate-900 font-bold">{(safePage - 1) * PAGE_SIZE + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(safePage * PAGE_SIZE, requests.length)}</span> of <span className="text-slate-900 font-bold">{requests.length}</span>
          </p>
          <div className="flex gap-1">
            <Button
              size="small"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="text-xs font-bold text-slate-600"
            >
              Prev
            </Button>
            <Button
              size="small"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="text-xs font-bold text-slate-600"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const AiResumeReview = () => {
  const { user, refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);

  // Dynamic limit calculation
  const getRemainingCount = () => {
    if (!user) return 0;
    const plan = user.subscription;
    
    let planRemaining = 0;
    if (plan && plan.hasAiResumeReview) {
      if (plan.aiResumeReviewCount === 0) return 'Unlimited';
      planRemaining = Math.max(0, plan.aiResumeReviewCount - (user.aiResumeReviewUsed || 0));
    } else if (plan && Array.isArray(plan.features)) {
      const dynamic = plan.features.find(f => f.isActive && (f.name?.toLowerCase() === 'ai resume review' || f.name?.toLowerCase() === 'ai resume'));
      if (dynamic) {
        const limit = parseInt(dynamic.value) || 0;
        if (limit === 0) return 'Unlimited';
        planRemaining = Math.max(0, limit - (user.aiResumeReviewUsed || 0));
      }
    }

    let ppRemaining = 0;
    if (Array.isArray(user.purchasedFeatures)) {
      user.purchasedFeatures.forEach(f => {
        if (f.isActive && f.featureKey === 'hasAiResumeReview' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > new Date())) {
          ppRemaining += f.usageLeft;
        }
      });
    }

    if (planRemaining === 'Unlimited') return 'Unlimited';
    return planRemaining + ppRemaining;
  };

  const remainingCount = getRemainingCount();

  const fetchRequests = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await axios.get(`${API}/requests/my-ai-resume-reviews`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRequests(res.data || []);
    } catch {
      // silently fail
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleRequestClick = () => {
    if (remainingCount === 0 || remainingCount === '0') {
      Modal.warning({
        title: 'Limit Reached',
        content: 'You have no AI resume reviews left. Please upgrade your subscription or purchase an add-on to get more reviews.',
        okText: 'Close',
        okButtonProps: { className: 'bg-violet-600 hover:bg-violet-700 border-none shadow-none' },
      });
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="space-y-8 pb-12">
        <PageSOPBanner pageKey="aiResumeReview" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-50 flex items-center justify-center rounded-md border border-violet-100">
              <Sparkles size={20} className="text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl m-0 font-semibold tracking-tight text-slate-800">AI Resume Review</h1>
              <p className="text-slate-600 font-medium m-0 text-sm mt-0.5">Get expert AI feedback on your resume</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Tag className="px-3 py-1.5 rounded-md font-bold m-0 border-violet-200 bg-violet-50 text-violet-700 text-xs">
              {remainingCount} Left
            </Tag>
            <Button
              type="primary"
              onClick={handleRequestClick}
              className="h-9 px-5 rounded-md bg-violet-600 hover:bg-violet-700 border-none font-medium tracking-wide shadow-sm"
              icon={<Send size={14} />}
            >
              Request Review
            </Button>
          </div>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { step: '1', icon: FileText, title: 'SUBMIT REQUEST', desc: 'Tell us what you need reviewed' },
            { step: '2', icon: Sparkles, title: 'AI ANALYSIS', desc: 'Our AI reviews your resume' },
            { step: '3', icon: CheckCircle2, title: 'GET FEEDBACK', desc: 'Detailed report via email' },
          ].map(({ step, icon: Icon, title, desc }) => (
            <Card key={step} bordered={false} className="rounded-2xl border border-slate-100 shadow-sm text-center bg-white" bodyStyle={{ padding: '24px' }}>
              <div className="w-8 h-8 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xs font-bold">
                {step}
              </div>
              <Icon size={16} className="text-slate-400 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest m-0">{title}</p>
              <p className="text-[11px] text-slate-400 mt-1 m-0">{desc}</p>
            </Card>
          ))}
        </div>

        {/* Requests Table */}
        <Card bordered={false} className="rounded-xl shadow-sm bg-white overflow-hidden" bodyStyle={{ padding: '24px 0 0 0' }}>
          <div className="flex items-center justify-between px-6 pb-6">
            <Title level={5} className="m-0 font-bold text-slate-800">My Requests</Title>
            <Button
              type="text"
              icon={<RefreshCw size={16} />}
              onClick={fetchRequests}
              className="text-slate-400 hover:text-slate-600"
            />
          </div>
          <RequestsTable requests={requests} loading={tableLoading} />
        </Card>
      </div>

      <RequestModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={async () => {
          if (refreshUser) await refreshUser();
          fetchRequests();
          setShowModal(false);
        }}
      />
    </>
  );
};

export default AiResumeReview;
