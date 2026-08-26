import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import DetailedJobCard from '../../components/jobseeker/DetailedJobCard';
import RecommendedJobCard from '../../components/jobseeker/RecommendedJobCard';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Smartphone, ExternalLink, Sparkles, CircleCheck, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

import { useAuth } from '../../context/AuthContext';
import PageSOPBanner from '../../components/common/PageSOPBanner';

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
      // A job seeker who has not joined a college has no campus activation state.
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

  // Map backend jobs to RecommendedJobCard format
  const recommendedJobs = (Array.isArray(matchingJobs) ? matchingJobs : []).slice(0, 4).map(job => ({
    id: job._id,
    title: job.title,
    company: job.company?.name || 'Unknown',
    location: job.location || 'Remote',
    postedAt: new Date(job.createdAt).toLocaleDateString(),
    logo: job.company?.logo || '/default-company-logo.png',
    rating: 4.0 // Mock rating
  }));

  // Map backend jobs to DetailedJobCard format (from recentJobs now)
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
    <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-10 py-6">
      
      {/* Main Content Feed */}
      <div className="flex-1 min-w-0 space-y-12">
        <PageSOPBanner pageKey="jobseekerDashboard" />
        {/* Premium Welcome Header */}
        <div className="relative rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 sm:p-10 text-white shadow-2xl overflow-hidden group">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner border border-white/20 flex items-center justify-center">
                <QrCode className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="space-y-1">
                 <h2 className="text-3xl font-black text-white tracking-tight">Welcome back, {user?.name}</h2>
                 <div className="flex items-center gap-3">
                   <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold tracking-widest text-[10px] uppercase backdrop-blur-md">
                     Job Seeker Portal
                   </Badge>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                     ID: <span className="text-emerald-400">{user?.display_id || 'Pending Generate'}</span>
                   </p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {campusStudent &&
          campusStudent.idVerification?.status !== 'pending' &&
          campusStudent.idVerification?.status !== 'rejected' && (
            <div className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-colors ${campusStudent.isActivated ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {campusStudent.isActivated ? 'Your profile is active' : 'Activate your profile'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {campusStudent.isActivated
                    ? 'Your TPO can now see that you are actively using the portal.'
                    : "Let your TPO know you're actively using the portal — this marks you as active on their dashboard."}
                </p>
              </div>
              {campusStudent.isActivated ? (
                <Badge className="h-10 px-5 rounded-full bg-emerald-600 hover:bg-emerald-600 text-white border-0 font-bold text-xs uppercase tracking-widest shrink-0 gap-2 shadow-sm cursor-default select-none">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile Activated
                </Badge>
              ) : (
                <Button
                  type="button"
                  onClick={handleActivateProfile}
                  disabled={activating}
                  className="h-11 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest shrink-0 transition-colors"
                >
                  {activating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Activate My Profile
                </Button>
              )}
            </div>
          )}

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
          <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 shadow-lg shadow-emerald-500/10 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 fade-in">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                {user.pendingCompanyInvite.company?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Organization Invitation</h3>
                <p className="text-sm text-slate-500">
                  You have been invited to join <strong>{user.pendingCompanyInvite.company?.name}</strong>'s team as
                  a <strong>{user.pendingCompanyInvite.type === 'recruiter' ? 'Recruiter' : 'Employee'}</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button 
                onClick={async () => {
                  try {
                    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/decline-company-invite`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                variant="outline" 
                className="flex-1 md:flex-none border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                Decline
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/user/accept-company-invite`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
                    // Accepting can change the account's role (e.g. jobseeker -> org_employee) —
                    // the old token still has the old role baked in, so every role-gated request
                    // would 403 with "insufficient permissions" until re-login unless we swap in
                    // the fresh token the server just issued before reloading.
                    if (res.data?.token) {
                      localStorage.setItem('token', res.data.token);
                    }
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                Accept Invite
              </Button>
            </div>
          </div>
        )}
        
        {/* Recommended Jobs */}
        <section className="relative z-10 space-y-6 xl:w-[calc(100%+372px)]">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">Personalized Recommendations</h2>
              <p className="text-sm font-medium text-slate-500">Curated opportunities based on your profile interests.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-[280px] h-40 bg-slate-50 rounded-2xl animate-pulse shrink-0 border border-slate-100" />
              ))}
            </div>
          ) : recommendedJobs.length === 0 ? (
             <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <Sparkles className="mx-auto text-slate-300 mb-2" size={24} />
               <p className="text-sm font-bold text-slate-500">No recommendations yet</p>
               <p className="text-[10px] text-slate-400">Complete your profile to get matched!</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendedJobs.map(job => (
                <div key={job.id} className="min-w-0">
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
               <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Opportunities</h2>
               <p className="text-sm font-medium text-slate-500">The latest jobs added to the platform.</p>
             </div>
             <div className="flex items-center gap-3">
                {loading && <Loader2 size={16} className="text-emerald-500 animate-spin" />}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />)
            ) : detailedJobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-slate-400 font-medium">No matching jobs found today.</p>
              </div>
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

      {/* Right Column Widgets */}
      <div className="hidden xl:flex flex-col gap-8 w-[340px]">
        <Card className="p-8 rounded-[32px] bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100/60 shadow-sm group hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-500">
          <CardContent className="p-0 space-y-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                 <Sparkles size={24} />
              </div>
              <div>
                <p className="text-base font-black text-slate-900 leading-tight">Resume Builder</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">AI-Powered</p>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">Elevate your application with a professional CV. Use our Pro templates to stand out to top recruiters.</p>
            <Button onClick={() => navigate('/candidate/resume-builder')} className="w-full h-12 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all duration-300 text-xs uppercase tracking-widest">
              Craft My Resume
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default JobSeekerDashboard;
