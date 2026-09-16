import React, { useState, useEffect, useCallback } from 'react';
import { Star, Calendar, Clock, Video, CheckCircle2, Send, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Card, Typography, Button, Tag, Table, Modal, Form, Input } from 'antd';
import { Link } from 'react-router-dom';
import FeatureGate from '@/components/subscription/FeatureGate';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';

const { Title, Text } = Typography;
const { TextArea } = Input;
const API = import.meta.env.VITE_API_BASE_URL;

const STATUS_CONFIG = {
  pending:   { label: 'Booked',    color: 'warning' },
  approved:  { label: 'Accepted',  color: 'processing' },
  completed: { label: 'Completed', color: 'success' },
  rejected:  { label: 'Rejected',  color: 'error' },
  cancelled: { label: 'Cancelled', color: 'default' },
};

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Booked' },
  { key: 'approved',  label: 'Accepted' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected',  label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STAT_CARDS = [
  { key: 'booked',    label: 'Booked',    color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'accepted',  label: 'Accepted',  color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'completed', label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'rejected',  label: 'Rejected',  color: 'text-rose-600', bg: 'bg-rose-50' },
  { key: 'cancelled', label: 'Cancelled', color: 'text-slate-600', bg: 'bg-slate-50' },
];

/* ─── Request Modal ─────────────────────────────────────────────────────────── */
const RequestModal = ({ visible, onClose, onSuccess, sessionsLeft, unlimited, initialData }) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const isReadOnly = initialData && initialData.status !== 'pending';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [confirmingSlot, setConfirmingSlot] = useState(false);

  useEffect(() => {
    if (visible) {
      setDone(false);
      setError('');
      form.setFieldsValue({
        bookingName: initialData?.bookingName || user?.name || '',
        bookingEmail: initialData?.bookingEmail || user?.email || '',
        bookingPhone: initialData?.bookingPhone || '',
        bookingDate: initialData?.bookingDate || '',
        bookingTime: initialData?.bookingTime || '',
        qualification: initialData?.qualification || '',
        major: initialData?.major || '',
        workExperience: initialData?.workExperience || '',
        notes: initialData?.notes || '',
      });
    }
  }, [visible, initialData, user, form]);

  const handleSelectSlot = async (slot) => {
    setConfirmingSlot(true);
    try {
      await axios.patch(`${API}/requests/${initialData._id}/select-slot`, { slot }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to select slot. Please try again.');
    } finally {
      setConfirmingSlot(false);
    }
  };

  const handleSubmit = async (values) => {
    setError('');
    setLoading(true);
    try {
      if (initialData) {
        await axios.patch(`${API}/requests/counselling/${initialData._id}`, values, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
      } else {
        await axios.post(`${API}/requests/counselling`, values, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
      }
      setDone(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isReadOnly ? 'Session Details' : initialData ? 'Edit Booking' : 'Book Career Counselling'}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      {done ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <Title level={4} className="m-0 mb-2">{initialData ? 'Session Updated!' : 'Session Booked!'}</Title>
          <Text className="text-slate-500">{initialData ? 'Your session details have been successfully updated.' : 'Your session request has been received. Our team will confirm via email shortly.'}</Text>
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4" disabled={isReadOnly}>
          <div className="grid sm:grid-cols-2 gap-x-4">
            <Form.Item name="bookingName" label="Full Name" rules={[{ required: true, message: 'Please enter your name' }]} className="sm:col-span-2">
              <Input placeholder="Your name" size="large" />
            </Form.Item>
            <Form.Item name="bookingEmail" label="Email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
              <Input placeholder="your@email.com" size="large" />
            </Form.Item>
            <Form.Item name="bookingPhone" label="Phone">
              <Input placeholder="+91 99445 09441" size="large" />
            </Form.Item>
            <Form.Item name="bookingDate" label="Preferred Date" rules={[{ required: true, message: 'Please select a date' }]}>
              <Input type="date" min={new Date().toISOString().split('T')[0]} size="large" />
            </Form.Item>
            <Form.Item name="bookingTime" label="Preferred Time" rules={[{ required: true, message: 'Please select a time' }]}>
              <Input type="time" size="large" />
            </Form.Item>
            <Form.Item name="qualification" label="Highest Qualification" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="e.g. B.Tech, MBA" size="large" />
            </Form.Item>
            <Form.Item name="major" label="Major / Specialization" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="e.g. Computer Science" size="large" />
            </Form.Item>
            <Form.Item name="workExperience" label="Work Experience (Years/Months)" rules={[{ required: true, message: 'Required' }]} className="sm:col-span-2">
              <Input placeholder="e.g. 2 Years / None" size="large" />
            </Form.Item>
            <Form.Item name="notes" label="Specific questions / Goals" className="sm:col-span-2">
              <TextArea placeholder="What would you like to discuss during the session?" rows={3} size="large" />
            </Form.Item>
          </div>

          {isReadOnly && initialData?.status === 'approved' && !initialData?.selectedSlot && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-2 mb-4">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-3">Please Confirm a Time Slot</p>
              <div className="space-y-3">
                {initialData.slot1Date && (
                  <div className="flex items-center justify-between p-3 bg-white border border-amber-100 rounded-lg">
                    <div className="text-sm text-slate-800">
                      <span className="font-bold">Slot 1:</span> {initialData.slot1Date} at {initialData.slot1StartTime} - {initialData.slot1EndTime}
                    </div>
                    <Button loading={confirmingSlot} onClick={() => handleSelectSlot('1')} type="primary" size="small" className="bg-amber-500 hover:bg-amber-600 border-none shadow-none">
                      Confirm
                    </Button>
                  </div>
                )}
                {initialData.slot2Date && (
                  <div className="flex items-center justify-between p-3 bg-white border border-amber-100 rounded-lg">
                    <div className="text-sm text-slate-800">
                      <span className="font-bold">Slot 2:</span> {initialData.slot2Date} at {initialData.slot2StartTime} - {initialData.slot2EndTime}
                    </div>
                    <Button loading={confirmingSlot} onClick={() => handleSelectSlot('2')} type="primary" size="small" className="bg-amber-500 hover:bg-amber-600 border-none shadow-none">
                      Confirm
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isReadOnly && initialData?.status === 'approved' && initialData?.selectedSlot && initialData?.meetingDate && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mt-2 mb-4">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-3">Scheduled Meeting Details</p>
              <div className="grid grid-cols-2 gap-3 text-sm text-emerald-900">
                <div>
                  <span className="font-semibold text-emerald-700 block text-xs">Date</span>
                  {initialData.meetingDate}
                </div>
                <div>
                  <span className="font-semibold text-emerald-700 block text-xs">Time</span>
                  {initialData.meetingStartTime} - {initialData.meetingEndTime}
                </div>
                {initialData.meetingLink && (
                  <div className="col-span-2">
                    <span className="font-semibold text-emerald-700 block text-xs">Meeting Link</span>
                    <a href={initialData.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
                      {initialData.meetingLink}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {isReadOnly && initialData?.adminNotes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-2 mb-4">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2">Additional Instructions</p>
              <p className="text-sm text-blue-900 whitespace-pre-wrap m-0">{initialData.adminNotes}</p>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </p>
          )}

          {!isReadOnly && (
            <Button type="primary" htmlType="submit" loading={loading} className="w-full h-11 text-sm font-bold bg-rose-500 hover:bg-rose-600 border-none shadow-md shadow-rose-500/20" icon={!loading && <Send size={15} />}>
              {initialData ? 'Save Changes' : 'Book Session'}
            </Button>
          )}

          {(!unlimited && !initialData) && (
            <p className="text-[11px] text-center text-slate-400 font-medium mt-3 mb-0">
              {sessionsLeft} session{sessionsLeft !== 1 ? 's' : ''} remaining
            </p>
          )}
        </Form>
      )}
    </Modal>
  );
};

/* ─── Sessions Table (filter + cancel) ────────────────────────── */
const SessionsTable = ({ sessions, loading, onCancel, onView }) => {
  const [filter, setFilter] = useState('all');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = sessions.filter(s => {
    if (filter === 'all')       return true;
    if (filter === 'upcoming')  return s.status === 'approved' && new Date(s.bookingDate) >= today;
    return s.status === filter;
  });

  const handleCancel = (record) => {
    Modal.confirm({
      title: 'Cancel this session?',
      content: 'The session will be marked as cancelled and your session count will be refunded.',
      okText: 'Yes, Cancel',
      cancelText: 'Keep It',
      okButtonProps: { danger: true, className: 'bg-rose-500 hover:bg-rose-600 border-none shadow-none' },
      cancelButtonProps: { className: 'border-slate-200 text-slate-600 hover:text-slate-700' },
      onOk: async () => {
        try {
          await axios.patch(`${API}/requests/counselling/${record._id}/cancel`, {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          onCancel();
        } catch {
          // silent — user can retry
        }
      }
    });
  };

  const columns = [
    {
      title: 'DATE',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (text) => text ? <span className="font-medium text-slate-700">{new Date(text).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span> : '—'
    },
    {
      title: 'TIME',
      dataIndex: 'bookingTime',
      key: 'bookingTime',
      render: (text) => <span className="text-slate-600">{text || '—'}</span>
    },
    {
      title: 'NAME',
      dataIndex: 'bookingName',
      key: 'bookingName',
      render: (text) => <span className="font-medium text-slate-700">{text || '—'}</span>
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
      title: 'BOOKED ON',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => <span className="text-slate-400 text-xs">{new Date(text).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    },
    {
      title: 'ACTION',
      key: 'action',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button type="link" size="small" onClick={() => onView(record)} className="text-[11px] font-bold px-0 h-auto">
            {record.status === 'pending' ? 'Edit' : 'View'}
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
            className={`rounded-full px-4 h-8 text-[11px] font-bold transition-colors ${filter === f.key ? 'bg-rose-500 hover:bg-rose-600 border-none shadow-sm' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
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
    </>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
const CareerCounselling = () => {
  const { user, refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [counts, setCounts] = useState({ booked: 0, accepted: 0, upcoming: 0, completed: 0, rejected: 0 });
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const planLimit = user?.subscription?.careerCounsellingCount || 0;
  const hasPlanFeature = !!user?.subscription?.hasCareerCounselling || (Array.isArray(user?.subscription?.features) && user.subscription.features.some(f => f.isActive && (f.name?.toLowerCase() === 'career counselling' || f.name?.toLowerCase() === 'career counseling')));
  
  const unlimited = hasPlanFeature && planLimit === 0;
  
  const planUsed = user?.counsellingSessionsUsed || 0;
  const planLeft = unlimited ? Infinity : (hasPlanFeature ? Math.max(0, planLimit - planUsed) : 0);

  const payPerFeature = Array.isArray(user?.purchasedFeatures) ? user.purchasedFeatures.find(f => f.featureKey === 'hasCareerCounselling' && f.usageLeft > 0 && (!f.expiresAt || new Date(f.expiresAt) > new Date())) : null;
  const payPerLeft = payPerFeature ? payPerFeature.usageLeft : 0;

  const sessionsLeft = unlimited ? Infinity : planLeft + payPerLeft;
  const atLimit = !unlimited && sessionsLeft <= 0;

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await axios.get(`${API}/requests/my-sessions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSessions(res.data.sessions || []);
      setCounts(res.data.counts || { booked: 0, accepted: 0, upcoming: 0, completed: 0, rejected: 0 });
    } catch {
      // silently fail
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleBookClick = () => {
    if (atLimit) {
      Modal.warning({
        title: 'Limit Reached',
        content: 'You have no career counselling sessions left. Please upgrade your subscription or purchase an add-on to book more sessions.',
        okText: 'Close',
        okButtonProps: { className: 'bg-rose-500 hover:bg-rose-600 border-none shadow-none' },
      });
    } else {
      setShowModal(true);
    }
  };

  const handleCancelDone = () => {
    fetchSessions();
    refreshUser();
  };

  return (
    <>
      <div className="space-y-8 pb-12">
        <PageSOPBanner pageKey="careerCounselling" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-rose-50 flex items-center justify-center rounded-md border border-rose-100">
              <Star size={20} className="text-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl m-0 font-semibold tracking-tight text-slate-800">Career Counselling</h1>
              <p className="text-slate-600 font-medium m-0 text-sm mt-0.5">Expert 1-on-1 sessions to accelerate your career.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Tag color="error" className="px-3 py-1.5 rounded-md font-bold m-0 border-rose-200 bg-rose-50 text-rose-600 text-xs">
              {unlimited ? 'Unlimited' : `${sessionsLeft} Left`}
            </Tag>
            <Button
              type="primary"
              onClick={handleBookClick}
              className="h-9 px-5 rounded-md bg-rose-500 hover:bg-rose-600 border-none font-medium tracking-wide shadow-sm"
              icon={<Calendar size={14} />}
            >
              Book Session
            </Button>
          </div>
        </div>

        {/* Perks */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Video,    label: 'Video Sessions',  desc: 'HD video + screen share' },
            { icon: Clock,    label: '45 Min / Session', desc: 'Deep-dive career talks' },
            { icon: Calendar, label: 'Flexible Booking', desc: 'Pick your time slot' },
          ].map(p => (
            <Card key={p.label} bordered={false} className="rounded-xl shadow-sm bg-white" bodyStyle={{ padding: '20px' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                  <p.icon size={20} className="text-rose-500" />
                </div>
                <div>
                  <Title level={5} className="m-0 text-slate-800 font-semibold">{p.label}</Title>
                  <Text className="text-slate-500 text-sm">{p.desc}</Text>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Session Stats */}
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest m-0 mb-4">SESSION OVERVIEW</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {STAT_CARDS.map(({ key, label, color, bg }) => (
              <Card key={key} bordered={false} className="rounded-xl shadow-sm bg-white text-center py-2" bodyStyle={{ padding: '20px' }}>
                <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <p className={`text-xl font-bold m-0 ${color}`}>{counts[key]}</p>
                </div>
                <p className="text-[12px] font-bold text-slate-600 uppercase tracking-wider m-0">{label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Sessions Table */}
        <Card bordered={false} className="rounded-xl shadow-sm bg-white overflow-hidden" bodyStyle={{ padding: '24px 0 0 0' }}>
          <div className="flex items-center justify-between px-6 pb-6">
            <Title level={5} className="m-0 font-bold text-slate-800">My Sessions</Title>
            <Button
              type="text"
              icon={<RefreshCw size={16} />}
              onClick={() => { fetchSessions(); refreshUser(); }}
              className="text-slate-400 hover:text-slate-600"
            />
          </div>
          <div className="px-6 pb-2">
            <SessionsTable 
              sessions={sessions} 
              loading={sessionsLoading} 
              onCancel={handleCancelDone} 
              onView={(s) => { setEditingSession(s); setShowModal(true); }} 
            />
          </div>
        </Card>
      </div>

      <RequestModal
        visible={showModal}
        onClose={() => { setShowModal(false); setEditingSession(null); }}
        sessionsLeft={sessionsLeft}
        unlimited={unlimited}
        initialData={editingSession}
        onSuccess={() => {
          fetchSessions();
          refreshUser();
          setShowModal(false);
          setEditingSession(null);
        }}
      />
    </>
  );
};

export default CareerCounselling;
