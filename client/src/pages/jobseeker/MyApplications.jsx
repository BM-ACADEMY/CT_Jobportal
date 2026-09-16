import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Briefcase, MapPin, Clock, CheckCircle2, XCircle, Eye, Loader2,
  Search, Building2, AlertCircle, FileText, Undo2, BadgeCheck, Filter, FileCheck, XSquare
} from 'lucide-react';
import { Button, Tag, Input, Select, Card, Typography, Pagination, Modal, Space, Skeleton, Row, Col } from 'antd';
import PageSOPBanner from '@/components/common/PageSOPBanner';

const { Title, Text, Paragraph } = Typography;

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'warning',    bg: '#fffbeb', text: '#d97706', border: '#fef3c7' },
  reviewed:    { label: 'Reviewed',    color: 'processing', bg: '#eff6ff', text: '#1d4ed8', border: '#dbeafe' },
  shortlisted: { label: 'Shortlisted', color: 'success',    bg: '#ecfdf5', text: '#047857', border: '#d1fae5' },
  rejected:    { label: 'Rejected',    color: 'error',      bg: '#fff1f2', text: '#be123c', border: '#ffe4e6' },
  accepted:    { label: 'Accepted',    color: 'purple',     bg: '#f5f3ff', text: '#6d28d9', border: '#ede9fe' },
  withdrawn:   { label: 'Withdrawn',   color: 'default',    bg: '#f8fafc', text: '#64748b', border: '#f1f5f9' },
};

const REVOCABLE = ['pending', 'reviewed'];

const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/applications/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/applications/${revokeTarget.id}/revoke`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRevokeTarget(null);
      fetchApplications();
    } catch (err) {
      console.error('Revoke error:', err);
    } finally {
      setRevoking(false);
    }
  };

  const filtered = applications.filter(app => {
    const title = app.job?.title?.toLowerCase() || '';
    const company = app.job?.company?.name?.toLowerCase() || '';
    const matchesSearch = title.includes(search.toLowerCase()) || company.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedApplications = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-8 px-4">
      <PageSOPBanner pageKey="myApplications" />
      
      {/* Revoke Confirmation Modal */}
      <Modal
        title={null}
        open={!!revokeTarget}
        onCancel={() => setRevokeTarget(null)}
        footer={null}
        centered
        width={360}
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle size={24} className="text-rose-600" />
          </div>
          <Title level={4} className="m-0 mb-2">Revoke Application?</Title>
          <Paragraph className="text-slate-500 mb-6 text-sm">
            Your application for <Text strong>{revokeTarget?.title}</Text> will be withdrawn. This cannot be undone.
          </Paragraph>
          <div className="flex gap-3">
            <Button
              size="large"
              block
              onClick={() => setRevokeTarget(null)}
              disabled={revoking}
              className="rounded-xl font-bold text-xs uppercase tracking-widest bg-slate-50 border-slate-200 text-slate-600"
            >
              Keep It
            </Button>
            <Button
              size="large"
              block
              danger
              type="primary"
              onClick={handleRevoke}
              loading={revoking}
              icon={!revoking && <Undo2 size={14} />}
              className="rounded-xl font-bold text-xs uppercase tracking-widest shadow-none"
            >
              Yes, Revoke
            </Button>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Title level={2} className="m-0 font-black tracking-tight text-slate-900">My Applications</Title>
          <Text className="text-slate-500">Track all your job applications in one place.</Text>
        </div>
        <Button
          type="primary"
          size="large"
          onClick={() => navigate('/jobs')}
          icon={<Briefcase size={16} />}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase tracking-widest shadow-none h-11 px-6"
        >
          Browse Jobs
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        {[
          { label: 'TOTAL APPLIED', value: stats.total, icon: <Briefcase size={22} strokeWidth={1.5} />, bg: '#8b5cf6' }, // Violet
          { label: 'PENDING', value: stats.pending, icon: <Clock size={22} strokeWidth={1.5} />, bg: '#f97316' }, // Orange
          { label: 'SHORTLISTED', value: stats.shortlisted, icon: <FileCheck size={22} strokeWidth={1.5} />, bg: '#10b981' }, // Green
          { label: 'REJECTED', value: stats.rejected, icon: <XSquare size={22} strokeWidth={1.5} />, bg: '#f43f5e' }, // Rose/Red
        ].map(s => (
          <Col xs={12} sm={6} key={s.label}>
            <div 
              className="relative overflow-hidden p-6 rounded-none text-white flex flex-col justify-between"
              style={{ backgroundColor: s.bg, minHeight: '160px' }}
            >
              {/* Crisp translucent background decoration circles */}
              <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-white/10"></div>
              <div className="absolute -bottom-16 -right-16 w-36 h-36 rounded-full bg-white/10"></div>
              
              <div className="mb-6 opacity-90">
                {s.icon}
              </div>
              <div className="relative z-10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/90 mb-1.5">{s.label}</div>
                <div className="text-4xl font-black">{s.value}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <Input
          prefix={<Search size={16} className="text-slate-400 mr-2" />}
          placeholder="Search by job title or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-xl border-slate-200 hover:border-emerald-300 focus:border-emerald-500 text-sm w-full sm:w-[320px] h-10 shadow-none"
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full sm:w-40 font-bold text-xs uppercase tracking-widest h-10"
          options={[
            { value: 'all', label: 'ALL STATUS' },
            { value: 'pending', label: 'PENDING' },
            { value: 'reviewed', label: 'REVIEWED' },
            { value: 'shortlisted', label: 'SHORTLISTED' },
            { value: 'rejected', label: 'REJECTED' },
            { value: 'accepted', label: 'ACCEPTED' },
            { value: 'withdrawn', label: 'WITHDRAWN' },
          ]}
        />
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} bordered={false} className="rounded-2xl border border-slate-100 shadow-sm h-32">
               <Skeleton active avatar={{ size: 48, shape: 'square' }} paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card bordered={false} className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center py-20 shadow-none">
          <FileText size={48} className="text-slate-300 mx-auto mb-4" />
          <Title level={4} className="m-0 mb-2 text-slate-700">
            {applications.length === 0 ? "You haven't applied to any jobs yet" : "No applications match your filters"}
          </Title>
          <Paragraph className="text-slate-500 mb-6">
            {applications.length === 0 ? "Start exploring jobs and apply to get started." : "Try adjusting your search or filter."}
          </Paragraph>
          {applications.length === 0 && (
            <Button type="primary" size="large" onClick={() => navigate('/jobs')} className="rounded-xl bg-emerald-600 font-bold text-xs uppercase tracking-widest px-8 shadow-none">
              Browse Jobs
            </Button>
          )}
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {paginatedApplications.map(app => {
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            const job = app.job;

            // Generate fallback avatar color
            const avatarColors = ['#eab308', '#334155', '#22c55e', '#0284c7', '#ea580c', '#7c3aed'];
            const colorIdx = job?.company?.name ? job.company.name.charCodeAt(0) % avatarColors.length : 0;

            return (
              <Card
                key={app._id}
                bordered={false}
                bodyStyle={{ padding: '24px' }}
                className="rounded-none border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all group overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  {/* Company Logo Square */}
                  {job?.company?.logo && job.company.logo !== '/default-company-logo.png' && !job.company.logo.includes('default') ? (
                    <div className="w-16 h-16 bg-white border border-slate-100 flex items-center justify-center shrink-0">
                      <img src={job.company.logo} alt={job.company.name} className="max-w-[80%] max-h-[80%] object-contain" />
                    </div>
                  ) : (
                    <div 
                      className="w-16 h-16 flex items-center justify-center text-white shrink-0 font-black text-2xl"
                      style={{ backgroundColor: avatarColors[colorIdx] }}
                    >
                      {job?.company?.name?.[0]?.toUpperCase() || <Building2 size={24} />}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <Title level={5} className="m-0 text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                        {job?.title || 'Job Unavailable'}
                      </Title>
                      {app.isPriority && (
                        <BadgeCheck size={18} className="text-blue-500 fill-blue-50 shrink-0" title="Priority Application" />
                      )}
                      <Tag 
                        bordered={false}
                        className="m-0 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5"
                        style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                      >
                        {cfg.label}
                      </Tag>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400" /> {job?.company?.name || 'Unknown Company'}
                      </span>
                      {job?.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" /> {job.location}
                        </span>
                      )}
                      {job?.jobType && (
                        <span className="flex items-center gap-1.5">
                          <Briefcase size={13} className="text-slate-400" /> {job.jobType}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={13} /> Applied {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Space className="shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
                    {job?._id && (
                      <Button
                        onClick={() => navigate(`/job/${job._id}`)}
                        icon={<Eye size={14} />}
                        className="h-9 px-4 rounded-md border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-600 hover:text-emerald-600 hover:border-emerald-600 shadow-none"
                      >
                        View Job
                      </Button>
                    )}
                    {REVOCABLE.includes(app.status) && (
                      <Button
                        danger
                        onClick={() => setRevokeTarget({ id: app._id, title: job?.title || 'this job' })}
                        icon={<Undo2 size={14} />}
                        className="h-9 px-4 rounded-md font-bold text-xs uppercase tracking-wider shadow-none"
                      >
                        Revoke
                      </Button>
                    )}
                  </Space>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > itemsPerPage && (
        <div className="flex justify-center mt-8 pt-8 border-t border-slate-100">
          <Pagination
            current={currentPage}
            total={filtered.length}
            pageSize={itemsPerPage}
            onChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

export default MyApplications;
