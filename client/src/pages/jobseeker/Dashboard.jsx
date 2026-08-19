import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import DetailedJobCard from '../../components/jobseeker/DetailedJobCard';
import RecommendedJobCard from '../../components/jobseeker/RecommendedJobCard';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, QrCode, Smartphone, ExternalLink, Sparkles, TrendingUp, CircleCheck, Loader2, CheckCircle2 } from 'lucide-react';
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
        <section className="space-y-6">
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
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2 snap-x">
              {recommendedJobs.map(job => (
                <div key={job.id} className="snap-start shrink-0">
                  <RecommendedJobCard job={job} />
                </div>
              ))}
            </div>
          )}
        </section>


        {/* Job Listings Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
             <div className="space-y-0.5">
               <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Opportunities</h2>
               <p className="text-sm font-medium text-slate-500">The latest jobs added to the platform.</p>
             </div>
             <div className="flex items-center gap-3">
                {loading && <Loader2 size={16} className="text-emerald-500 animate-spin" />}
             </div>
          </div>

          <div className="space-y-4">
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
                  <DetailedJobCard 
                    key={job.id} 
                    job={job} 
                    application={application}
                    onRevoke={fetchMyApplications}
                  />
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

        <Card className="rounded-[32px] bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none overflow-hidden h-72 flex flex-col justify-end group cursor-pointer hover:shadow-2xl hover:shadow-slate-900/20 transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 group-hover:rotate-[15deg] transition-all duration-1000 ease-out">
               <TrendingUp size={120} />
            </div>
            <div className="absolute inset-0  from-slate-900 via-slate-900/60 to-transparent opacity-80" />
            <div className="p-8 relative z-10 space-y-4">
               <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-xl backdrop-blur-md">Market Report</Badge>
               <h4 className="text-xl font-black leading-tight tracking-tight">The Future of AI in Career Planning</h4>
               <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 group-hover:text-emerald-400 transition-colors uppercase tracking-[0.2em]">Read Insights <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></p>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
