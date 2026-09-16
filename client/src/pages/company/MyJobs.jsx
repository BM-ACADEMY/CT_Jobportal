import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Card, Button, Input, Select, Dropdown, Menu, Tag,
  Typography, Row, Col, Statistic, Space, Tooltip, Spin, Empty, Modal, message
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined,
  CopyOutlined, MoreOutlined, ExclamationCircleOutlined, StarOutlined
} from '@ant-design/icons';
import {
  Briefcase, MapPin, Clock, Search, ToggleLeft, ToggleRight, Users, CheckSquare, XSquare
} from 'lucide-react';
import PageSOPBanner from '@/components/common/PageSOPBanner';

const { Title, Text } = Typography;
const { confirm } = Modal;

const STATUS_COLOR = {
  active: 'success',
  closed: 'error',
  draft: 'default',
  inactive: 'warning',
};

const MyJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [quota, setQuota] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchJobs();
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs/quota`, { headers });
      setQuota(res.data);
    } catch { /* non-critical */ }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/jobs/company-jobs-stats`,
        { headers }
      );
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      message.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirm = (jobId, title) => {
    confirm({
      title: `Are you sure you want to delete "${title}"?`,
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/jobs/${jobId}`, { headers });
          message.success('Job deleted successfully');
          setJobs(prev => prev.filter(j => j._id !== jobId));
        } catch (err) {
          message.error(err.response?.data?.msg || 'Failed to delete job');
        }
      },
    });
  };

  const handleClone = async (jobId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/jobs/${jobId}/clone`, {}, { headers });
      message.success('Job cloned successfully');
      fetchJobs();
    } catch (err) {
      message.error(err.response?.data?.msg || 'Failed to clone job');
    }
  };

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active';
    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/jobs/${job._id}`, { status: newStatus }, { headers });
      message.success(`Job marked as ${newStatus}`);
      setJobs(prev => prev.map(j => j._id === job._id ? { ...j, status: newStatus } : j));
    } catch (err) {
      message.error(err.response?.data?.msg || 'Failed to update job status');
    }
  };

  const filtered = jobs.filter(job => {
    const matchesSearch = job.title?.toLowerCase().includes(search.toLowerCase()) ||
                          job.location?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.status === 'active').length,
    applicants: jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0),
    shortlisted: jobs.reduce((sum, j) => sum + (j.shortlistedCount || 0), 0),
  };

  const getDropdownMenu = (job) => (
    <Menu>
      <Menu.Item key="1" icon={<TeamOutlined />} onClick={() => navigate(`/company/applicants/${job._id}`)}>
        View Applicants
      </Menu.Item>
      <Menu.Item key="2" icon={<EditOutlined />} onClick={() => navigate(`/company/jobs/new?edit=${job._id}`)}>
        Edit Job
      </Menu.Item>
      <Menu.Item key="3" icon={<CopyOutlined />} onClick={() => handleClone(job._id)}>
        Clone Job
      </Menu.Item>
      <Menu.Item
        key="4"
        icon={job.status === 'active' ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
        onClick={() => handleToggleStatus(job)}
        style={{ color: '#d97706' }}
      >
        {job.status === 'active' ? 'Close Job' : 'Reopen Job'}
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="5" danger icon={<DeleteOutlined />} onClick={() => showDeleteConfirm(job._id, job.title)}>
        Delete Job
      </Menu.Item>
    </Menu>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <PageSOPBanner pageKey="myJobs" />
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>My Job Listings</Title>
          <Text type="secondary">Manage all your posted positions and applicants.</Text>
          {quota && !quota.unlimited && (
            <div style={{ marginTop: 8 }}>
              <Tag color={quota.used >= quota.limit ? 'error' : quota.used >= quota.limit * 0.8 ? 'warning' : 'success'}>
                <Briefcase size={12} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
                {quota.used}/{quota.limit} job postings used
                {quota.used >= quota.limit && ' — Limit reached'}
              </Tag>
            </div>
          )}
        </div>
        <Space>
          {quota && !quota.unlimited && quota.used >= quota.limit && (
            <Link to="/company/subscription">
              <Button type="default" danger icon={<StarOutlined />}>
                Upgrade
              </Button>
            </Link>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/company/jobs/new')}
            disabled={quota && !quota.unlimited && quota.used >= quota.limit}
          >
            Post New Job
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'TOTAL JOBS', value: stats.total, color: 'linear-gradient(135deg, #a855f7, #8b5cf6)', icon: <Briefcase size={20} color="#fff" /> },
          { label: 'ACTIVE', value: stats.active, color: 'linear-gradient(135deg, #f97316, #ea580c)', icon: <ToggleRight size={20} color="#fff" /> },
          { label: 'TOTAL APPLICANTS', value: stats.applicants, color: 'linear-gradient(135deg, #10b981, #059669)', icon: <Users size={20} color="#fff" /> },
          { label: 'SHORTLISTED', value: stats.shortlisted, color: 'linear-gradient(135deg, #f43f5e, #e11d48)', icon: <CheckSquare size={20} color="#fff" /> },
        ].map((s, index) => (
          <div key={index} style={{
            background: s.color,
            borderRadius: '12px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            color: 'white',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            {/* Background decorative circles */}
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              right: '-30px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              right: '-10px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }} />
            
            <div style={{ opacity: 0.9 }}>
              {s.icon}
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px', opacity: 0.9 }}>
                {s.label}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Space style={{ marginBottom: 24, width: '100%' }} wrap>
        <Input
          placeholder="Search by title or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          prefix={<Search size={16} className="text-slate-400" />}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 150 }}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'closed', label: 'Closed' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </Space>

      {/* Job List */}
      <Spin spinning={loading}>
        {filtered.length === 0 && !loading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                {jobs.length === 0 ? "No jobs posted yet" : "No jobs match your filters"}
              </span>
            }
          >
            {jobs.length === 0 && (
              <Button type="primary" onClick={() => navigate('/company/jobs/new')}>
                Post a Job
              </Button>
            )}
          </Empty>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {filtered.map(job => (
              <Card
                key={job._id}
                hoverable
                styles={{ body: { padding: '20px 24px' } }}
                className="shadow-sm"
              >
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
                  
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 8, backgroundColor: '#ecfdf5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Briefcase size={24} color="#10b981" />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 250 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 16 }}>{job.title}</Text>
                      {job.isCloned && <Tag color="blue">Cloned</Tag>}
                      <Tag color={STATUS_COLOR[job.status] || 'default'} style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>
                        {job.status}
                      </Tag>
                    </div>
                    <Space size="middle" wrap style={{ color: '#64748b', fontSize: 13 }}>
                      {job.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={14} /> {job.location}
                        </span>
                      )}
                      {job.jobType && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Briefcase size={14} /> {job.jobType}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={14} /> Posted {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </Space>
                  </div>

                  {/* Applicant counts */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <Tooltip title="View Applicants">
                      <Button
                        type="dashed"
                        onClick={() => navigate(`/company/applicants/${job._id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, height: 'auto', padding: '6px 12px' }}
                      >
                        <TeamOutlined style={{ color: '#64748b' }} />
                        <span style={{ fontWeight: 600 }}>{job.applicantsCount || 0}</span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>applicants</span>
                      </Button>
                    </Tooltip>
                    
                    {(job.shortlistedCount || 0) > 0 && (
                      <Tag color="success" style={{ margin: 0, padding: '4px 8px', borderRadius: 4 }}>
                        {job.shortlistedCount} shortlisted
                      </Tag>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ flexShrink: 0 }}>
                    <Dropdown overlay={getDropdownMenu(job)} trigger={['click']} placement="bottomRight">
                      <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </Spin>
    </div>
  );
};

export default MyJobs;
