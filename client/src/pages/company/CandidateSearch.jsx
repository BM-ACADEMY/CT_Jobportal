import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';
import {
  Search, MapPin, Briefcase, Sparkles,
  AlertTriangle, ChevronRight, Filter, X, GraduationCap, BadgeCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Input, Button, Card, Typography, Avatar, Tag, Alert, Form, Row, Col, Space, Checkbox, Empty
} from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const API = import.meta.env.VITE_API_BASE_URL;

const CandidateSearch = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  const [qReq, setQReq] = useState(false);
  const [skillsReq, setSkillsReq] = useState(false);
  const [locationReq, setLocationReq] = useState(false);
  const [degreeReq, setDegreeReq] = useState(false);
  const [experienceRoleReq, setExperienceRoleReq] = useState(false);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [quota, setQuota] = useState(null);
  const [limitReached, setLimitReached] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const handleSearch = async (values) => {
    const q = values.q || '';
    const skills = values.skills || '';
    const location = values.location || '';
    const degree = values.degree || '';
    const experienceRole = values.experienceRole || '';

    if (!q.trim() && !skills.trim() && !location.trim()) {
      toast.error('Enter at least one search term');
      return;
    }
    
    setLoading(true);
    setLimitReached(false);
    
    try {
      const params = new URLSearchParams();
      if (q.trim()) { params.set('q', q.trim()); params.set('qReq', qReq); }
      if (skills.trim()) { params.set('skills', skills.trim()); params.set('skillsReq', skillsReq); }
      if (location.trim()) { params.set('location', location.trim()); params.set('locationReq', locationReq); }
      if (degree.trim()) { params.set('degree', degree.trim()); params.set('degreeReq', degreeReq); }
      if (experienceRole.trim()) { params.set('experienceRole', experienceRole.trim()); params.set('experienceRoleReq', experienceRoleReq); }

      const res = await axios.get(`${API}/jobs/candidates/search?${params}`, { headers });
      setResults(res.data.candidates || []);
      setQuota({ limit: res.data.limit, used: res.data.used, remaining: res.data.remaining });
      setSearched(true);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresUpgrade) {
        setLimitReached(true);
        setQuota({ limit: err.response.data.limit, used: err.response.data.used, remaining: 0 });
        setSearched(true);
        setResults([]);
      } else {
        toast.error(err.response?.data?.msg || 'Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (candidateId) => {
    try {
      const res = await axios.get(`${API}/jobs/candidates/${candidateId}/profile`, { headers });
      setQuota({ limit: res.data.limit, used: res.data.used, remaining: res.data.remaining });
      navigate(`/candidate/profile/${candidateId}`);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresUpgrade) {
        setLimitReached(true);
        setQuota({ limit: err.response.data.limit, used: err.response.data.used, remaining: 0 });
        toast.error('Daily profile view limit reached. Upgrade to view more candidates.');
      } else {
        toast.error(err.response?.data?.msg || 'Could not open profile');
      }
    }
  };

  const handleClear = () => {
    form.resetFields();
    setQReq(false);
    setSkillsReq(false);
    setLocationReq(false);
    setDegreeReq(false);
    setExperienceRoleReq(false);
    setResults([]);
    setSearched(false);
    setLimitReached(false);
  };

  const isUnlimited = quota?.limit === 0;
  const atLimit = !isUnlimited && quota && quota.remaining === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
      <PageSOPBanner pageKey="candidateSearch" />
      
      <div>
        <Title level={3} style={{ margin: 0 }}>Candidate Search</Title>
        <Text type="secondary">Search our talent pool and view candidate profiles.</Text>
      </div>

      {quota && !isUnlimited && (
        <Alert
          message={atLimit
            ? `Daily profile view limit reached (${quota.used}/${quota.limit}). Resets at midnight.`
            : `${quota.remaining} of ${quota.limit} candidate profile views remaining today.`
          }
          type={atLimit ? "error" : (quota.remaining <= 2 ? "warning" : "success")}
          showIcon
          icon={<AlertTriangle size={16} />}
          action={atLimit && (
            <Link to="/company/subscription">
              <Button size="small" type="link" icon={<Sparkles size={12} />}>Upgrade</Button>
            </Link>
          )}
        />
      )}

      <Card 
        bordered={false} 
        className="shadow-sm rounded-2xl" 
        bodyStyle={{ padding: '24px' }}
      >
        <Text type="secondary" className="text-xs font-bold uppercase tracking-widest mb-4 block">
          Search Filters
        </Text>
        <Form form={form} onFinish={handleSearch} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="q" style={{ marginBottom: 12 }}>
                <Input 
                  size="large"
                  prefix={<Search size={16} className="text-slate-400 mr-2" />} 
                  placeholder="Name, headline, role..."
                  addonAfter={
                    <Checkbox checked={qReq} onChange={e => setQReq(e.target.checked)}>
                      <span className="text-[10px] font-bold text-slate-500">REQ</span>
                    </Checkbox>
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="skills" style={{ marginBottom: 12 }}>
                <Input 
                  size="large"
                  prefix={<Filter size={16} className="text-slate-400 mr-2" />} 
                  placeholder="Skills (comma-separated)"
                  addonAfter={
                    <Checkbox checked={skillsReq} onChange={e => setSkillsReq(e.target.checked)}>
                      <span className="text-[10px] font-bold text-slate-500">REQ</span>
                    </Checkbox>
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="location" style={{ marginBottom: 12 }}>
                <Input 
                  size="large"
                  prefix={<MapPin size={16} className="text-slate-400 mr-2" />} 
                  placeholder="Location"
                  addonAfter={
                    <Checkbox checked={locationReq} onChange={e => setLocationReq(e.target.checked)}>
                      <span className="text-[10px] font-bold text-slate-500">REQ</span>
                    </Checkbox>
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {showAdvanced && (
            <Row gutter={16} className="pt-2">
              <Col xs={24} sm={12}>
                <Form.Item name="degree" style={{ marginBottom: 12 }}>
                  <Input 
                    size="large"
                    prefix={<GraduationCap size={16} className="text-slate-400 mr-2" />} 
                    placeholder="Degree / Qualification (e.g. B.Tech)"
                    addonAfter={
                      <Checkbox checked={degreeReq} onChange={e => setDegreeReq(e.target.checked)}>
                        <span className="text-[10px] font-bold text-slate-500">REQ</span>
                      </Checkbox>
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="experienceRole" style={{ marginBottom: 12 }}>
                  <Input 
                    size="large"
                    prefix={<Briefcase size={16} className="text-slate-400 mr-2" />} 
                    placeholder="Past Experience Role (e.g. Manager)"
                    addonAfter={
                      <Checkbox checked={experienceRoleReq} onChange={e => setExperienceRoleReq(e.target.checked)}>
                        <span className="text-[10px] font-bold text-slate-500">REQ</span>
                      </Checkbox>
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              loading={loading}
              disabled={atLimit}
              icon={<SearchOutlined />}
              style={{ backgroundColor: '#10b981' }}
            >
              Search Candidates
            </Button>
            <Button 
              size="large"
              icon={<Filter size={16} />}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide Advanced' : 'Advanced Filters'}
            </Button>
            {(form.getFieldValue('q') || form.getFieldValue('skills') || form.getFieldValue('location') || form.getFieldValue('degree') || form.getFieldValue('experienceRole')) && (
              <Button 
                size="large"
                type="text"
                icon={<X size={16} />}
                onClick={handleClear}
              >
                Clear
              </Button>
            )}
          </div>
        </Form>
      </Card>

      {limitReached && (
        <Alert
          message="Daily search limit reached"
          description={`Your plan allows ${quota?.limit} candidate profile view${quota?.limit > 1 ? 's' : ''} per day. Upgrade to get unlimited access.`}
          type="error"
          showIcon
          icon={<AlertTriangle size={24} />}
          action={
            <Link to="/company/subscription">
              <Button type="primary" danger icon={<Sparkles size={14} />}>Upgrade Plan</Button>
            </Link>
          }
          className="rounded-xl shadow-sm"
        />
      )}

      {searched && !limitReached && (
        <div className="space-y-4" style={{ marginTop: '24px' }}>
          <Text type="secondary" className="text-xs font-bold uppercase tracking-widest">
            {results.length === 0 ? 'No candidates found' : `${results.length} candidate${results.length > 1 ? 's' : ''} found`}
          </Text>
          
          <div className="flex flex-col gap-4">
            {results.map(candidate => (
              <Card 
                key={candidate._id}
                bodyStyle={{ padding: '20px' }}
                className="rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer"
                bordered
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <Avatar 
                    size={64} 
                    src={candidate.avatar} 
                    icon={<UserOutlined />}
                    shape="square"
                    className="rounded-xl"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Text strong className="text-lg">{candidate.name}</Text>
                      {candidate.profileVerificationStatus === 'Verified' && (
                        <BadgeCheck size={18} className="text-blue-500" />
                      )}
                      {candidate.isPriority && (
                        <BadgeCheck size={18} className="text-blue-500 fill-blue-50" />
                      )}
                    </div>
                    
                    {candidate.profile?.headline && (
                      <Text type="secondary" className="block mb-2 text-sm">{candidate.profile.headline}</Text>
                    )}
                    
                    <Space size="middle" className="mb-2 flex-wrap">
                      {candidate.profile?.preferredRole && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Briefcase size={14} className="text-slate-400" /> {candidate.profile.preferredRole}
                        </span>
                      )}
                      {candidate.profile?.location && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin size={14} className="text-slate-400" /> {candidate.profile.location}
                        </span>
                      )}
                    </Space>
                    
                    {candidate.profile?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {candidate.profile.skills.slice(0, 5).map(skill => (
                          <Tag key={skill} bordered={false} className="bg-slate-100 text-slate-600 rounded-md px-2 py-0.5">
                            {skill}
                          </Tag>
                        ))}
                        {candidate.profile.skills.length > 5 && (
                          <Tag bordered={false} color="green" className="rounded-md px-2 py-0.5">
                            +{candidate.profile.skills.length - 5} more
                          </Tag>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleViewProfile(candidate._id)}
                    disabled={atLimit}
                    size="large"
                    icon={<ChevronRight size={16} />}
                    iconPosition="end"
                  >
                    View Profile
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {results.length === 0 && (
            <Card className="rounded-2xl border-dashed">
              <Empty 
                description="No candidates match your search"
                image={<Search size={48} className="text-slate-200 mx-auto" />}
              >
                <Text type="secondary" className="text-xs mt-2 block">
                  Try different keywords, skills, or location.
                </Text>
              </Empty>
            </Card>
          )}
        </div>
      )}

      {!searched && !loading && (
        <Card className="rounded-2xl border-dashed" style={{ marginTop: '24px' }}>
          <Empty 
            description="Search for candidates"
            image={<SearchOutlined style={{ fontSize: 48, color: '#e2e8f0' }} />}
          >
            <Text type="secondary" className="text-xs mt-2 block">
              Enter a name, skill, or location to find matching candidates in our talent pool.
            </Text>
          </Empty>
        </Card>
      )}
    </div>
  );
};

export default CandidateSearch;
