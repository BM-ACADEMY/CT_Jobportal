import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Users, 
  Briefcase, 
  Download,
  Activity,
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react';
import PlanComparisonTable from '../../components/subscription/PlanComparisonTable';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const SubscriptionPage = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/subscriptions`);
      // Get plans for recruiters/companies
      setPlans(res.data.filter(p => (p.role === 'recruiter' || p.role === 'company') && p.isActive));
    } catch (err) {
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = user?.subscription || { name: 'Free Tier', jobPostingLimit: 5, applicationDownloadLimit: 20 };
  const downloadsUsed = user?.downloadsUsed || 0;
  const searchUsed = user?.searchUsed || 0;
  const jobsUsed = user?.jobsUsed || 0;

  const metrics = [
    { 
      label: 'Job Posting Volume', 
      used: jobsUsed, 
      limit: currentPlan.activeJobPostings || 0, 
      icon: Briefcase,
      color: 'bg-emerald-500'
    },
    { 
      label: 'Candidate Search', 
      used: searchUsed, 
      limit: currentPlan.candidateSearchPerDay || 0, 
      icon: Download,
      color: 'bg-emerald-500'
    }
  ];

  const recruiterFeatures = [
    { label: 'Active job postings', key: 'activeJobPostings' },
    { label: 'Candidate search/day', key: 'candidateSearchPerDay' },
    { label: 'AI candidate matching', key: 'hasAICandidateMatching' },
    { label: 'ATS pipeline', key: 'hasATSPipeline' },
    { label: 'Priority listing', key: 'hasPriorityListing' },
    { label: 'Analytics dashboard', key: 'hasAnalyticsDashboard' },
    { label: 'Candidate DB export (CSV)', key: 'hasCandidateDBExport' },
    { label: 'Bulk messaging', key: 'hasBulkMessaging' },
    { label: 'Video interview integration', key: 'hasVideoInterview' },
    { label: 'Dedicated account manager', key: 'hasDedicatedManager' },
    { label: 'White-label profile', key: 'hasWhiteLabelProfile' }
  ];

  const organizationFeatures = [
    { label: 'Job postings/month', key: 'activeJobPostings' },
    { label: 'User seats', key: 'userSeats' },
    { label: 'Company profile page', key: 'companyProfileType' },
    { label: 'Branded careers page', key: 'hasBrandedCareersPage' },
    { label: 'Team collaboration', key: 'hasTeamCollaboration' },
    { label: 'Bulk applicant management', key: 'hasBulkApplicantManagement' },
    { label: 'Interview scheduling', key: 'hasInterviewScheduling' },
    { label: 'API & HRMS integration', key: 'hasAPIIntegration' },
    { label: 'SSO & security controls', key: 'hasSSO' },
    { label: 'Dedicated onboarding', key: 'hasDedicatedOnboarding' },
    { label: 'SLA guarantee', key: 'hasSLAGuarantee' },
    { label: 'Compliance & audit logs', key: 'hasComplianceAudit' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Platform Monetization</h1>
            <p className="text-base text-slate-500 font-medium">Scale your recruitment capabilities with tailored enterprise solutions.</p>
          </div>
          
          <div className="flex items-center gap-3">
             {currentPlan.hasVerifiedBadge && (
               <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl">
                  <Award size={16} fill="currentColor" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Verified Badge</span>
               </div>
             )}
             <Card className="bg-slate-900 text-white border-none rounded-[20px] p-4 flex items-center gap-4 shadow-lg">
                <div className="w-10 h-10 bg-emerald-600 flex items-center justify-center rounded-xl shadow-md">
                   <ShieldCheck size={20} />
                </div>
                <div>
                   <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Active Tier</p>
                   <h3 className="text-base font-bold tracking-tight">{currentPlan.name}</h3>
                </div>
             </Card>
          </div>
        </div>
        <div className="h-px bg-slate-200 w-full" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column - Quotas and Limits */}
        <div className="lg:col-span-2 space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {metrics.map((metric, i) => {
                const percentage = metric.limit > 0 ? (metric.used / metric.limit) * 100 : 0;
                return (
                  <Card key={i} className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white hover:border-emerald-200 transition-all">
                     <CardContent className="p-8 space-y-6">
                        <div className="flex justify-between items-center">
                           <div className={`w-12 h-12 ${metric.color.replace('500', '50')} ${metric.color.replace('bg-', 'text-')} border border-current/10 flex items-center justify-center rounded-xl shadow-sm`}>
                              <metric.icon size={22} />
                           </div>
                           <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg border-slate-100 text-slate-400">
                              {metric.limit === 0 ? 'Unlimited Access' : 'Monthly Quota'}
                           </Badge>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="flex justify-between items-end">
                              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{metric.label}</h4>
                              <div className="text-right">
                                 <span className="text-2xl font-bold text-slate-900">{metric.used}</span>
                                 <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-2">
                                    / {metric.limit === 0 ? '∞' : metric.limit}
                                 </span>
                              </div>
                           </div>
                           {metric.limit > 0 && (
                             <div className="space-y-2">
                                <Progress value={percentage} className="h-2 rounded-full bg-slate-100" />
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-slate-400">
                                   <span>Utilization: {percentage.toFixed(0)}%</span>
                                   <span>{metric.limit - metric.used} Remaining</span>
                                </div>
                             </div>
                           )}
                        </div>
                     </CardContent>
                  </Card>
                );
              })}
           </div>

           <div className="space-y-12">
              <PlanComparisonTable 
                title="Recruiter Plans Comparison" 
                plans={plans.filter(p => p.roles.includes('recruiter'))} 
                features={recruiterFeatures} 
              />

              <PlanComparisonTable 
                title="Organization Plans Comparison" 
                plans={plans.filter(p => p.roles.includes('company'))} 
                features={organizationFeatures} 
              />
           </div>

           {/* Features Comparison */}
           <Card className="rounded-[24px] border-slate-200 shadow-sm bg-white overflow-hidden relative">
              <CardContent className="p-10 space-y-10 relative z-10">
                 <div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none uppercase text-[9px] font-bold tracking-widest mb-3">Enterprise Capabilities</Badge>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">Maximize Your Recruitment ROI</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {[
                      { icon: Activity, label: 'Advanced Analytics', desc: 'Detailed tracking of job performance and applicant quality.' },
                      { icon: Users, label: 'Collaboration', desc: 'Manage multiple recruiters under a single account.' },
                      { icon: Zap, label: 'Instant Connect', desc: 'Bypass standard queues and reach out to top talent.' },
                      { icon: TrendingUp, label: 'Profile Boost', desc: 'Your company appears first in organizational search.' }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                         <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-600 shadow-sm">
                            <item.icon size={18} />
                         </div>
                         <div>
                            <h5 className="font-bold text-sm text-slate-900 tracking-tight">{item.label}</h5>
                            <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Right Column - Available Upgrade Plans */}
        <div className="space-y-6">
           <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-200">
              <div className="flex items-center gap-2.5 mb-6">
                 <Zap className="text-amber-500" size={18} fill="currentColor" />
                 <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Enterprise Tiers</h2>
              </div>

              <div className="space-y-4">
                 {plans.map((plan) => (
                   <Card key={plan._id} className="rounded-2xl border-slate-200 hover:border-emerald-300 transition-all cursor-pointer group shadow-sm bg-white overflow-hidden">
                      <CardContent className="p-5 space-y-4">
                         <div className="flex justify-between items-start">
                            <div>
                               <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors uppercase">{plan.name}</h4>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{plan.duration}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-lg font-bold text-slate-900">₹{plan.price}</p>
                            </div>
                         </div>
                         
                         <div className="space-y-2 py-3 border-t border-slate-50">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                               <Briefcase size={12} className="text-emerald-600" />
                               <span>{plan.jobPostingLimit === 0 ? 'Unlimited' : plan.jobPostingLimit} Job Postings</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                               <Download size={12} className="text-emerald-600" />
                               <span>{plan.applicationDownloadLimit === 0 ? 'Unlimited' : plan.applicationDownloadLimit} App Access</span>
                            </div>
                            {plan.hasVerifiedBadge && (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                 <Award size={12} className="text-emerald-500" />
                                 <span>Verified Badge Included</span>
                              </div>
                            )}
                         </div>

                          <Button 
                            className={`w-full h-10 rounded-xl font-bold text-[9px] uppercase tracking-[0.2em] transition-all ${
                              plan.price > 15000 
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200' 
                                : 'bg-slate-900 hover:bg-emerald-600 text-white shadow-md hover:shadow-emerald-200 shadow-slate-200'
                            }`}
                          >
                             {plan.price > 15000 ? 'Contact Sales' : 'Activate Tier'}
                          </Button>
                      </CardContent>
                   </Card>
                 ))}
                 
                 {plans.length === 0 && !loading && (
                    <div className="text-center py-8">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No available upgrades.</p>
                    </div>
                 )}
              </div>
           </div>

           <Card className="rounded-[24px] bg-white border-slate-200 overflow-hidden relative group shadow-sm">
              <div className="absolute -top-4 -right-4 p-8 text-emerald-50 opacity-50 scale-150 group-hover:rotate-12 transition-transform duration-700">
                 <ShieldCheck size={100} />
              </div>
              <CardContent className="p-6 relative z-10 space-y-4">
                 <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 uppercase">Custom Enterprise</h3>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">Specialized quotas or API access for your organization?</p>
                 </div>
                 <Button variant="outline" className="w-full h-10 rounded-xl border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                    Contact Sales
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
