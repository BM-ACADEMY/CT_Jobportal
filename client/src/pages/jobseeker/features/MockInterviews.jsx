import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Mic, CheckCircle2, Send, Loader2, AlertCircle, RefreshCw, X, ClipboardList, CalendarCheck, MonitorPlay, TrendingUp } from 'lucide-react';
import { Card, Typography, Button, Tag, Table, Modal, Form, Input } from 'antd';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';

const { Title, Text } = Typography;
const { TextArea } = Input;
const API = import.meta.env.VITE_API_BASE_URL;

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'warning' },
  approved:  { label: 'Approved',  color: 'processing' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'default' },
};

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'approved',  label: 'Approved' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

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
      await axios.post(`${API}/requests/mock-interview`, values, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setDone(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Request AI Mock Interview"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Text className="text-slate-500 block mb-6 -mt-2">Tell us about your skills and goals</Text>
      
      {done ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <Title level={4} className="m-0 mb-2">Request Submitted!</Title>
          <Text className="text-slate-500">We'll prepare a personalised mock interview session for you.</Text>
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="skills" label="YOUR SKILLS" rules={[{ required: true, message: 'Please enter your skills' }]}>
            <Input placeholder="e.g. React, Node.js, System Design" size="large" />
          </Form.Item>
          
          <Form.Item name="careerGoal" label="CAREER GOAL">
            <TextArea placeholder="e.g. Senior Frontend Engineer at a fintech startup" rows={3} size="large" />
          </Form.Item>

          {error && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </p>
          )}

          <Button type="primary" htmlType="submit" loading={loading} className="w-full h-11 text-sm font-bold bg-teal-500 hover:bg-teal-600 border-none shadow-md shadow-teal-500/20 mt-2" icon={!loading && <Send size={15} />}>
            Submit Request
          </Button>
        </Form>
      )}
    </Modal>
  );
};

/* ─── Requests Table ─────────────────────────────────────────────────────────── */
const RequestsTable = ({ requests, loading, onCancel }) => {
  const [filter, setFilter] = useState('all');
  const [viewReq, setViewReq] = useState(null);
  const [confirmingSlot, setConfirmingSlot] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const handleCancel = (record) => {
    Modal.confirm({
      title: 'Cancel this request?',
      content: 'Your mock interview request will be cancelled. You can submit a new one at any time.',
      okText: 'Yes, Cancel',
      cancelText: 'Keep It',
      okButtonProps: { danger: true, className: 'bg-rose-500 hover:bg-rose-600 border-none shadow-none' },
      cancelButtonProps: { className: 'border-slate-200 text-slate-600 hover:text-slate-700' },
      onOk: async () => {
        try {
          await axios.patch(`${API}/requests/mock-interview/${record._id}/cancel`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          onCancel();
        } catch {
          // silent — user can retry
        }
      }
    });
  };

  const handleSelectSlot = async (slot) => {
    setConfirmingSlot(true);
    setErrorMsg('');
    try {
      await axios.patch(`${API}/requests/${viewReq._id}/select-slot`, { slot }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setViewReq(null);
      onCancel();
    } catch (err) {
      setErrorMsg(err.response?.data?.msg || 'Failed to select slot. Please try again.');
    } finally {
      setConfirmingSlot(false);
    }
  };

  const columns = [
    {
      title: 'SKILLS',
      dataIndex: 'skills',
      key: 'skills',
      render: (text) => <span className="font-medium text-slate-700">{text || '—'}</span>
    },
    {
      title: 'CAREER GOAL',
      dataIndex: 'careerGoal',
      key: 'careerGoal',
      render: (text) => <span className="text-slate-600">{text || '—'}</span>
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
        return <Tag color={cfg.color} className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md border-none">{cfg.label}</Tag>;
      }
    },
    {
      title: 'ADMIN NOTES',
      dataIndex: 'adminNotes',
      key: 'adminNotes',
      render: (text) => <span className="text-slate-500 max-w-[150px] truncate block">{text || '—'}</span>
    },
    {
      title: 'REQUESTED ON',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => <span className="text-slate-400 text-xs">{new Date(text).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    },
    {
      title: 'ACTION',
      key: 'action',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button type="link" size="small" onClick={() => setViewReq(record)} className="text-[11px] font-bold px-0 h-auto">
            View
          </Button>
          {(record.status === 'pending' || record.status === 'approved') && (
            <Button type="link" danger size="small" onClick={() => handleCancel(record)} className="text-[11px] font-bold px-0 h-auto">
              Cancel
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(f => (
          <Button
            key={f.key}
            type={filter === f.key ? 'primary' : 'default'}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 h-8 text-[11px] font-bold transition-colors ${filter === f.key ? 'bg-teal-500 hover:bg-teal-600 border-none shadow-sm' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
          >
            {f.label}
          </Button>
        ))}
      </div>
      
      <Table 
        columns={columns} 
        dataSource={filtered} 
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 5, className: 'px-4' }}
        className="[&_.ant-table-thead_th]:bg-slate-50/50 [&_.ant-table-thead_th]:text-[10px] [&_.ant-table-thead_th]:font-bold [&_.ant-table-thead_th]:uppercase [&_.ant-table-thead_th]:tracking-widest [&_.ant-table-thead_th]:text-slate-500 [&_.ant-table-tbody_td]:text-[13px]"
      />

      <Modal
        title="Request Details"
        open={!!viewReq}
        onCancel={() => setViewReq(null)}
        footer={null}
        width={500}
      >
        {viewReq && (
          <div className="space-y-4 mt-4">
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Your Request</p>
              <div className="space-y-2 text-sm text-slate-800">
                <p><span className="font-semibold text-slate-600">Skills:</span> {viewReq.skills}</p>
                {viewReq.careerGoal && <p><span className="font-semibold text-slate-600">Career Goal:</span> {viewReq.careerGoal}</p>}
                <p><span className="font-semibold text-slate-600">Status:</span> {STATUS_CONFIG[viewReq.status]?.label || viewReq.status}</p>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <AlertCircle size={13} className="shrink-0" /> {errorMsg}
              </p>
            )}

            {viewReq.status === 'approved' && !viewReq.selectedSlot && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">Please Confirm a Time Slot</p>
                <div className="space-y-3">
                  {viewReq.slot1Date && (
                    <div className="flex items-center justify-between p-3 bg-white border border-amber-100 rounded-lg">
                      <div className="text-sm text-slate-800">
                        <span className="font-bold">Slot 1:</span> {viewReq.slot1Date} at {viewReq.slot1StartTime} - {viewReq.slot1EndTime}
                      </div>
                      <Button loading={confirmingSlot} onClick={() => handleSelectSlot('1')} type="primary" size="small" className="bg-amber-500 hover:bg-amber-600 border-none shadow-none">
                        Confirm
                      </Button>
                    </div>
                  )}
                  {viewReq.slot2Date && (
                    <div className="flex items-center justify-between p-3 bg-white border border-amber-100 rounded-lg">
                      <div className="text-sm text-slate-800">
                        <span className="font-bold">Slot 2:</span> {viewReq.slot2Date} at {viewReq.slot2StartTime} - {viewReq.slot2EndTime}
                      </div>
                      <Button loading={confirmingSlot} onClick={() => handleSelectSlot('2')} type="primary" size="small" className="bg-amber-500 hover:bg-amber-600 border-none shadow-none">
                        Confirm
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {viewReq.status === 'approved' && viewReq.selectedSlot && viewReq.meetingDate && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-3">Scheduled Meeting Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm text-emerald-900">
                  <div>
                    <span className="font-semibold text-emerald-700 block text-xs">Date</span>
                    {viewReq.meetingDate}
                  </div>
                  <div>
                    <span className="font-semibold text-emerald-700 block text-xs">Time</span>
                    {viewReq.meetingStartTime} - {viewReq.meetingEndTime}
                  </div>
                  {viewReq.meetingLink && (
                    <div className="col-span-2">
                      <span className="font-semibold text-emerald-700 block text-xs">Meeting Link</span>
                      <a href={viewReq.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
                        {viewReq.meetingLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {viewReq.adminNotes && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2">Additional Instructions</p>
                <p className="text-sm text-blue-900 whitespace-pre-wrap m-0">{viewReq.adminNotes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const MockInterviews = () => {
  const { user, refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);

  const getRemainingCount = () => {
    let limit = 0;
    let used = user?.mockInterviewsUsed || 0;
    let hasPlanFeature = false;
    
    const plan = user?.subscription;
    if (plan && plan.hasMockInterviews) {
      hasPlanFeature = true;
      limit = 0;
    } else if (plan && Array.isArray(plan.features)) {
      const dynamicFeature = plan.features.find(f => f.isActive && (f.name?.toLowerCase() === 'mock interviews' || f.name?.toLowerCase() === 'mock interview'));
      if (dynamicFeature) {
        hasPlanFeature = true;
        limit = parseInt(dynamicFeature.value) || 0;
      }
    }
    
    let planRemaining = 0;
    if (hasPlanFeature) {
      planRemaining = limit > 0 ? Math.max(0, limit - used) : 'Unlimited';
    }

    let ppRemaining = 0;
    if (Array.isArray(user?.purchasedFeatures)) {
      user.purchasedFeatures.forEach(f => {
        if (f.isActive && f.featureKey === 'hasMockInterviews' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > new Date())) {
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
      const res = await axios.get(`${API}/requests/my-mock-interviews`, {
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
        content: 'You have no mock interview requests left. Please upgrade your subscription or purchase an add-on to get more mock interviews.',
        okText: 'Close',
        okButtonProps: { className: 'bg-teal-500 hover:bg-teal-600 border-none shadow-none' },
      });
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="space-y-8 pb-12">
        <PageSOPBanner pageKey="mockInterviews" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-50 flex items-center justify-center rounded-md border border-teal-100">
              <Briefcase size={20} className="text-teal-500" />
            </div>
            <div>
              <h1 className="text-2xl m-0 font-semibold tracking-tight text-slate-800">Mock Interviews</h1>
              <p className="text-slate-600 font-medium m-0 text-sm mt-0.5">AI-powered mock interviews and question banks.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Tag className="px-3 py-1.5 rounded-md font-bold m-0 border-teal-200 bg-teal-50 text-teal-600 text-xs">
              {remainingCount} Left
            </Tag>
            <Button
              type="primary"
              onClick={handleRequestClick}
              className="h-9 px-5 rounded-md bg-teal-500 hover:bg-teal-600 border-none font-medium tracking-wide shadow-sm"
              icon={<Mic size={14} />}
            >
              Request Mock Interview
            </Button>
          </div>
        </div>

        {/* SOP */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0 mb-4">HOW IT WORKS</p>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                step: 1,
                icon: ClipboardList,
                title: 'Request Mock Interview',
                desc: 'Submit your skills and career goal. Our team will review and schedule a session for you.',
                color: 'text-teal-600',
                bg: 'bg-teal-50',
                border: 'border-teal-100',
              },
              {
                step: 2,
                icon: CalendarCheck,
                title: 'Pick a Time Slot',
                desc: 'You\'ll receive 2 available time slots via email or admin notes. Choose the one that works best for you.',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
                border: 'border-blue-100',
              },
              {
                step: 3,
                icon: MonitorPlay,
                title: 'Attend the Interview',
                desc: 'At your scheduled time, join the session. Our expert will conduct the mock interview with you.',
                color: 'text-violet-600',
                bg: 'bg-violet-50',
                border: 'border-violet-100',
              },
              {
                step: 4,
                icon: TrendingUp,
                title: 'Get Your Feedback',
                desc: 'Receive a detailed report of your strengths, areas to improve, and actionable tips to crack your next interview.',
                color: 'text-amber-600',
                bg: 'bg-amber-50',
                border: 'border-amber-100',
              },
            ].map(({ step, icon: Icon, title, desc, color, bg, border }, i, arr) => (
              <div key={step} className="relative flex flex-col h-full">
                {i < arr.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(100%-8px)] w-full h-px bg-slate-200 z-0" style={{ width: 'calc(100% - 32px)', left: 'calc(50% + 20px)' }} />
                )}
                <Card bordered={false} className={`rounded-2xl border ${border} shadow-sm bg-white h-full relative z-10`} bodyStyle={{ padding: '20px' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                      <Icon size={17} className={color} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>STEP {step}</span>
                  </div>
                  <div>
                    <Title level={5} className="m-0 text-slate-800 font-semibold mb-2">{title}</Title>
                    <Text className="text-slate-500 text-sm leading-relaxed">{desc}</Text>
                  </div>
                </Card>
              </div>
            ))}
          </div>
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
          <div className="px-6 pb-2">
            <RequestsTable 
              requests={requests} 
              loading={tableLoading} 
              onCancel={fetchRequests} 
            />
          </div>
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

export default MockInterviews;
