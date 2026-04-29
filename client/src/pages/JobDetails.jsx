import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Briefcase, 
  IndianRupee, 
  Clock, 
  Loader2, 
  ArrowLeft, 
  Building2, 
  Globe, 
  Users, 
  Calendar, 
  ChevronRight,
  Share2,
  Bookmark,
  CheckCircle2,
  Zap,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import JobApplicationModal from '../components/jobs/JobApplicationModal';

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/jobs`);
        const foundJob = response.data.find(j => j._id === id);
        if (foundJob) {
          setJob(foundJob);
        } else {
          toast.error("Job not found");
          navigate('/jobs');
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
        toast.error("Failed to load job details");
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL, navigate]);

  const handleApply = () => {
    if (!user) {
      toast.error("Please login to apply for this job");
      navigate('/login');
      return;
    }

    if (user.role === 'company') {
      toast.error("Companies cannot apply for jobs");
      return;
    }

    if (user.id === job.recruiter) {
      toast.error("You cannot apply for a job you have posted");
      return;
    }

    setIsApplyModalOpen(true);
  };

  const handleSaveJob = async () => {
    if (!user) {
      toast.error("Please login to save this job");
      navigate('/login');
      return;
    }

    setIsSaving(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/user/save-job/${id}`);
      updateUser({ savedJobs: response.data.savedJobs });
      toast.success(response.data.msg);
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error("Failed to save job");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareJob = () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: job.title,
      text: `Check out this job opportunity: ${job.title} at ${job.company?.name}`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch((err) => {
        if (err.name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      });
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Link copied! Share it with your friends.");
    }).catch(err => {
      console.error('Could not copy text: ', err);
      toast.error("Failed to copy link");
    });
  };

  const isJobSaved = user?.savedJobs?.some(savedId => String(savedId) === String(id));

  const formatSalary = (salary) => {
    if (!salary || salary.isRangeHidden) return "Not Disclosed";
    if (salary.min && salary.max) {
      return `₹${(salary.min / 100000).toFixed(1)}-${(salary.max / 100000).toFixed(1)} LPA`;
    }
    if (salary.min) return `₹${(salary.min / 100000).toFixed(1)}+ LPA`;
    return "Competitive";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-primary" />
        </motion.div>
        <p className="text-slate-400 font-semibold tracking-widest uppercase text-xs mt-4">Analyzing Opportunity...</p>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* ─── HEADER / BREADCRUMB ─── */}
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-12">
        <nav className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link to="/jobs" className="hover:text-primary transition-colors">Jobs</Link>
          <ChevronRight size={14} />
          <span className="text-slate-900 truncate max-w-[200px]">{job.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="flex items-start gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-24 h-24 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0 shadow-sm"
            >
              {job.company?.logo ? (
                <img src={`${API_DOMAIN}${job.company.logo}`} alt={job.company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 size={40} className="text-primary/20" />
              )}
            </motion.div>
            <div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 font-medium px-3">
                    <Zap size={12} className="mr-1.5 fill-emerald-700" /> Hiring Now
                  </Badge>
                  <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wide">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 mb-3 tracking-tight leading-tight">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 text-primary font-medium text-lg">
                    {job.company?.name}
                    {job.company?.website && (
                      <a href={job.company.website} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-primary transition-colors">
                        <Globe size={16} />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-bold">
                    <MapPin size={18} className="text-slate-300" />
                    {job.location || 'Remote'}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <Button 
              onClick={handleSaveJob}
              disabled={isSaving}
              variant="outline" 
              size="xl" 
              className={`rounded-2xl h-16 w-16 p-0 border-slate-100 transition-all ${isJobSaved ? 'text-primary bg-primary/5 border-primary/20' : 'text-slate-400 hover:bg-slate-50 hover:text-primary'}`}
            >
              <Bookmark size={24} className={isJobSaved ? 'fill-primary' : ''} />
            </Button>
            <Button 
              onClick={handleShareJob}
              variant="outline" 
              size="xl" 
              className="rounded-2xl h-16 w-16 p-0 border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-primary transition-all"
            >
              <Share2 size={24} />
            </Button>
            <Button 
              onClick={handleApply}
              size="xl" 
              className="rounded-md px-10 h-14 bg-slate-900 hover:bg-primary text-white font-bold text-lg shadow-md transition-all hover:scale-[1.01]"
            >
              Apply for this job
            </Button>
          </motion.div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-12">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Job Type', value: job.jobType, icon: <Briefcase size={20} /> },
              { label: 'Experience', value: `${job.experience?.min}-${job.experience?.max} Yrs`, icon: <Clock size={20} /> },
              { label: 'Salary (LPA)', value: formatSalary(job.salary), icon: <IndianRupee size={20} /> },
              { label: 'Work Mode', value: job.workMode || 'In-office', icon: <Building2 size={20} /> },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50/50 border border-slate-100 rounded-lg p-6 hover:border-primary/20 transition-colors">
                <div className="text-primary mb-3 bg-white w-10 h-10 rounded-md flex items-center justify-center shadow-sm">
                  {item.icon}
                </div>
                <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-slate-900 font-semibold tracking-tight">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-8 w-1 bg-primary rounded-full" />
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Job Description</h2>
            </div>
            <div className="prose prose-slate max-w-none">
              <div className="text-slate-600 leading-[1.8] font-medium text-lg whitespace-pre-wrap">
                {job.description}
              </div>
            </div>
          </section>

          {/* Skills */}
          {job.skillsRequired && job.skillsRequired.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1.5 bg-primary rounded-full" />
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Required Expertise</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {job.skillsRequired.map((skill, i) => (
                  <Badge key={i} className="bg-white text-slate-700 hover:border-primary/50 border-slate-200 font-semibold py-2 px-4 rounded-lg text-sm shadow-sm transition-all cursor-default">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Additional Details if any */}
          {job.additionalDetails && job.additionalDetails.length > 0 && (
            <section className="bg-emerald-50/50 rounded-lg p-8 border border-emerald-100">
              <div className="flex items-center gap-3 mb-8">
                <Info size={20} className="text-emerald-600" />
                <h2 className="text-lg font-semibold text-emerald-900 tracking-tight">Additional Information</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {job.additionalDetails.map((detail, index) => (
                  <div key={detail._id || index} className="flex flex-col gap-1">
                    <span className="text-[10px] font-medium text-emerald-700/50 uppercase tracking-wide">{detail.key}</span>
                    <span className="text-emerald-900 font-semibold leading-relaxed">{detail.value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
          
          {/* Job Overview Card */}
          <Card className="border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-900 text-white p-6">
              <CardTitle className="text-lg font-bold tracking-tight">Job Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Vacancies</p>
                  <p className="text-slate-900 font-semibold">{job.vacancies || 1} Positions</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Timings</p>
                  <p className="text-slate-900 font-medium">{job.timings || '9:00 AM - 6:00 PM'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-primary shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Shifts</p>
                  <p className="text-slate-900 font-medium">{job.shifts || 'Day Shift'}</p>
                </div>
              </div>

              <Separator className="bg-slate-50" />
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-sm font-bold text-slate-600">Direct Company Hiring</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-sm font-bold text-slate-600">Immediate Joining</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Card */}
          <Card className="border-slate-100 rounded-xl overflow-hidden shadow-sm bg-slate-50/30">
            <CardContent className="p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">About Company</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0 shadow-sm">
                  {job.company?.logo ? (
                    <img src={`${API_DOMAIN}${job.company.logo}`} alt={job.company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={24} className="text-primary/20" />
                  )}
                </div>
                <div>
                  <p className="text-slate-900 font-semibold tracking-tight">{job.company?.name}</p>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{job.company?.location || 'India'}</p>
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
                Leading provider of innovative solutions in the industry, focused on growth and employee excellence.
              </p>
              <div className="space-y-3">
                {job.company?.website && (
                  <a 
                    href={job.company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-primary transition-all group"
                  >
                    <span className="text-sm font-bold text-slate-600">Visit Website</span>
                    <Globe size={16} className="text-slate-300 group-hover:text-primary" />
                  </a>
                )}
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-100">
                  <span className="text-sm font-semibold text-slate-600">Company Size</span>
                  <span className="text-xs font-bold text-slate-900">500+ Employees</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Warning */}
          <div className="p-8 rounded-xl border border-amber-100 bg-amber-50/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <Info size={18} />
              </div>
              <h4 className="font-bold text-amber-900 text-sm tracking-tight">Job Safety Tip</h4>
            </div>
            <p className="text-xs font-bold text-amber-800/70 leading-relaxed">
              Don't provide your bank or credit card details when applying for jobs. CareerPoint does not charge any money from job seekers.
            </p>
          </div>
        </div>

      </div>

      <JobApplicationModal 
        isOpen={isApplyModalOpen} 
        onClose={() => setIsApplyModalOpen(false)} 
        job={job}
        user={user}
      />
    </div>
  );
};

export default JobDetails;
