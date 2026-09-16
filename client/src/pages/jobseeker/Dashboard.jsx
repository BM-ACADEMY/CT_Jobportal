import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import DetailedJobCard from '../../components/jobseeker/DetailedJobCard';
import RecommendedJobCard from '../../components/jobseeker/RecommendedJobCard';
import { Button, Card, Tag, Skeleton, Spin, Row, Col, Typography, Space, Alert } from 'antd';
import { ChevronRight, QrCode, Smartphone, ExternalLink, Sparkles, TrendingUp, CircleCheck, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

import { useAuth } from '../../context/AuthContext';
import PageSOPBanner from '../../components/common/PageSOPBanner';

const { Title, Text } = Typography;

const JobSeekerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matchingJobs, setMatchingJobs] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campusStudent, setCampusStudent] = useState(null);
  const [activating, setActivating] = useState(false);

  const fetchCampusStudent = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/college/me/student`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampusStudent(res.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching campus profile:', err);
      }
      setCampusStudent(null);
    }
  };

  const handleActivateProfile = async () => {
    setActivating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/college/me/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCampusStudent(current => ({
        ...current,
        ...(res.data?.student || {}),
        isActivated: true,
        placementStatus: res.data?.student?.placementStatus || 'active'
      }));
      toast.success('Profile activated — your TPO can now see you as active');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to activate profile');
    } finally {
      setActivating(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/applications/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  useEffect(() => {
    const fetchMatchingJobs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs/matching`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMatchingJobs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching matching jobs:', err);
        setMatchingJobs([]);
      }
    };

    const fetchRecentJobs = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/jobs?limit=10`);
        setRecentJobs(Array.isArray(res.data.jobs) ? res.data.jobs : Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching recent jobs:', err);
        setRecentJobs([]);
      }
    };

    Promise.all([fetchMatchingJobs(), fetchRecentJobs(), fetchMyApplications(), fetchCampusStudent()]).finally(() => setLoading(false));
  }, []);

  const recommendedJobs = (Array.isArray(matchingJobs) ? matchingJobs : []).slice(0, 4).map(job => ({
    id: job._id,
    title: job.title,
    company: job.company?.name || 'Unknown',
    location: job.location || 'Remote',
    experience: `${job.experience?.min || 0} - ${job.experience?.max || 0} Yrs Experience`,
    salary: job.salary?.isRangeHidden ? 'Salary Not Disclosed' : `${job.salary?.min || 0} - ${job.salary?.max || 0} ${job.salary?.currency || 'INR'}`,
    postedAt: new Date(job.createdAt).toLocaleDateString(),
    logo: job.company?.logo || '/default-company-logo.png',
    rating: 4.0
  }));

  const detailedJobs = (Array.isArray(recentJobs) ? recentJobs : []).map(job => ({
    id: job._id,
    title: job.title,
    company: job.company?.name || 'Unknown',
    location: job.location || 'Remote',
    experience: `${job.experience?.min || 0} - ${job.experience?.max || 0} Yrs`,
    salary: job.salary?.isRangeHidden ? 'Not disclosed' : `${job.salary?.min || 0} - ${job.salary?.max || 0} ${job.salary?.currency || 'INR'}`,
    summary: job.description?.substring(0, 150) + '...',
    tags: job.skillsRequired || [],
    postedAt: new Date(job.createdAt).toLocaleDateString(),
    logo: job.company?.logo || '/default-company-logo.png',
    rating: 4.0,
    reviews: '100+'
  }));

  return (
    <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-10 py-6 px-4">
      
      {/* Main Content Feed */}
      <div className="flex-1 min-w-0 space-y-12">
        {/* <PageSOPBanner pageKey="jobseekerDashboard" /> */}
        
        {/* Premium Welcome Header */}
        <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ background: 'linear-gradient(135deg, #1b496d 0%, #153e5e 50%, #0d2e49 100%)', borderRadius: 0 }} className="relative shadow-sm overflow-hidden group">
          <div className="p-8 sm:p-10 relative z-10">
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#34b678]/10 blur-[80px] rounded-full transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#34b678] rounded-none flex items-center justify-center border border-white/10 shrink-0">
                  <QrCode className="w-7 h-7 text-white" />
                </div>
                <div>
                   <div className="flex items-center gap-3 mb-2">
                     <Tag style={{ background: 'rgba(52, 182, 120, 0.2)', borderColor: 'rgba(52, 182, 120, 0.3)', color: '#34b678', fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', fontSize: 9, padding: '2px 8px', borderRadius: 0 }}>
                       Job Seeker Portal
                     </Tag>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">
                       ID: <span className="text-[#34b678]">{user?.display_id || 'Pending Generate'}</span>
                     </p>
                   </div>
                   <h2 className="text-2xl font-black text-white tracking-tight m-0">Welcome back, {user?.name}</h2>
                   <p className="text-xs text-slate-400 font-medium max-w-xl leading-relaxed mt-1 m-0">
                     Explore personalized job recommendations, manage applications, and track your career progression dynamically.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* campusStudent && campusStudent.idVerification?.status !== 'pending' && campusStudent.idVerification?.status !== 'rejected' && (
          <Alert
            type={campusStudent.isActivated ? "success" : "error"}
            showIcon
            icon={campusStudent.isActivated ? <CheckCircle2 /> : undefined}
            message={<Text strong>{campusStudent.isActivated ? 'Your profile is active' : 'Activate your profile'}</Text>}
            description={campusStudent.isActivated ? 'Your TPO can now see that you are actively using the portal.' : "Let your TPO know you're actively using the portal — this marks you as active on their dashboard."}
            action={
              campusStudent.isActivated ? (
                <Tag color="success" style={{ padding: '4px 12px', borderRadius: 16 }}>PROFILE ACTIVATED</Tag>
              ) : (
                <Button type="primary" danger onClick={handleActivateProfile} loading={activating} style={{ borderRadius: 8 }}>
                  Activate My Profile
                </Button>
              )
            }
            style={{ borderRadius: 16, alignItems: 'center' }}
          />
        ) */}

        {campusStudent?.interviewScorecards?.length > 0 && (
          <section className="relative z-10 rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 shadow-sm space-y-6 xl:w-[calc(100%+372px)]">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Campus placement feedback</p><h3 className="text-lg font-black text-slate-900 mt-1">My Interview Scorecards</h3><p className="text-xs text-slate-500 mt-1">Feedback recorded by your placement team for your campus interviews.</p></div>
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50">{campusStudent.interviewScorecards.length} review{campusStudent.interviewScorecards.length === 1 ? '' : 's'}</Badge>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {campusStudent.interviewScorecards.map(card => {
                const average = ((Number(card.technical || 0) + Number(card.communication || 0) + Number(card.problemSolving || 0)) / 3).toFixed(1);
                const positive = ['strong_hire', 'hire'].includes(card.recommendation);
                return <article key={card._id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4 min-w-0">
                  <div className="flex items-start justify-between gap-2"><div><h4 className="font-black text-slate-900">{card.employer?.name}</h4><p className="text-[10px] text-slate-500">{card.drive?.title || 'Campus drive'} · {new Date(card.createdAt).toLocaleDateString('en-IN')}</p></div><span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${positive ? 'bg-emerald-100 text-emerald-800' : card.recommendation === 'no_hire' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{card.recommendation.replaceAll('_', ' ')}</span></div>
                  <div className="grid grid-cols-2 gap-2">{[['Technical',card.technical],['Communication',card.communication],['Problem solving',card.problemSolving],['Average',average]].map(([label,value]) => <div key={label} className="rounded-xl bg-white border border-slate-100 p-3"><p className="text-[9px] uppercase font-bold text-slate-400 leading-tight">{label}</p><p className="text-lg font-black text-slate-800 mt-1">{value}<span className="text-xs text-slate-400">/5</span></p></div>)}</div>
                  <div className="rounded-xl bg-white border border-slate-100 p-3"><p className="text-[9px] uppercase font-bold text-slate-400">Reason / feedback</p><p className="text-xs text-slate-700 mt-1">{card.comments || 'No additional feedback was provided.'}</p>{card.interviewer && <p className="text-[9px] text-slate-400 mt-2">Interviewer: {card.interviewer}</p>}</div>
                </article>;
              })}
            </div>
          </section>
        )}

        {user?.pendingCompanyInvite && (
          <Alert
            type="info"
            message={<Text strong>Organization Invitation</Text>}
            description={
              <>
                You have been invited to join <strong>{user.pendingCompanyInvite.company?.name}</strong>'s team as
                a <strong>{user.pendingCompanyInvite.type === 'recruiter' ? 'Recruiter' : 'Employee'}</strong>.
              </>
            }
            action={
              <Space>
                <Button 
                  danger
                  onClick={async () => {
                    try {
                      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/decline-company-invite`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
                      window.location.reload();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Decline
                </Button>
                <Button
                  type="primary"
                  onClick={async () => {
                    try {
                      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/accept-company-invite`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
                      if (res.data?.token) {
                        localStorage.setItem('token', res.data.token);
                      }
                      window.location.reload();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Accept Invite
                </Button>
              </Space>
            }
            style={{ borderRadius: 16 }}
          />
        )}
        
        {/* Recommended Jobs */}
        <section className="space-y-6 mt-16">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-0.5">
              <Title level={4} style={{ margin: 0 }}>Personalized Recommendations</Title>
              <Text type="secondary">Curated opportunities based on your profile interests.</Text>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
              {[1, 2].map(i => (
                <Skeleton.Button key={i} active style={{ width: '100%', height: 160, borderRadius: 16 }} />
              ))}
            </div>
          ) : recommendedJobs.length === 0 ? (
             <Card style={{ textAlign: 'center', borderRadius: 24, background: '#f8fafc', borderStyle: 'dashed' }}>
               <Sparkles className="mx-auto text-slate-300 mb-2" size={24} />
               <Text strong className="block text-slate-500">No recommendations yet</Text>
               <Text type="secondary" style={{ fontSize: 12 }}>Complete your profile to get matched!</Text>
             </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 items-stretch">
              {recommendedJobs.map(job => (
                <div key={job.id} className="h-full">
                  <RecommendedJobCard job={job} />
                </div>
              ))}
            </div>
          )}
        </section>


        {/* Job Listings Header */}
        <div className="relative z-10 space-y-6 xl:w-[calc(100%+372px)]">
          <div className="flex items-center justify-between px-2">
             <div className="space-y-0.5">
               <Title level={4} style={{ margin: 0 }}>Recent Opportunities</Title>
               <Text type="secondary">The latest jobs added to the platform.</Text>
             </div>
             <div className="flex items-center gap-3">
                {loading && <Spin indicator={<Loader2 size={16} className="text-emerald-500 animate-spin" />} />}
             </div>
          </div>

          <div className="flex flex-col gap-6">
            {loading ? (
              [1, 2].map(i => <Skeleton.Button key={i} active style={{ width: '100%', height: 128, borderRadius: 16, marginBottom: 16 }} block />)
            ) : detailedJobs.length === 0 ? (
              <Card style={{ textAlign: 'center', borderRadius: 24, padding: 40 }}>
                <Text type="secondary" strong>No matching jobs found today.</Text>
              </Card>
            ) : (
              detailedJobs.map(job => {
                const application = myApplications.find(app => app.job?._id === job.id);
                return (
                  <div key={job.id} className="min-w-0 h-full">
                    <DetailedJobCard 
                      job={job} 
                      application={application}
                      onRevoke={fetchMyApplications}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default JobSeekerDashboard;
