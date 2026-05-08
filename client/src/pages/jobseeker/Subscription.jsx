import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Users, 
  BookOpen, 
  FileText, 
  GraduationCap,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import PlanComparisonTable from '../../components/subscription/PlanComparisonTable';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const SubscriptionPage = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState([]);
  const [viewersLoading, setViewersLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchPlans();
    if (user?.subscription?.hasProfileViewAccess) {
      fetchViewers();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/subscriptions`);
      setPlans(res.data.filter(p => p.role === 'jobseeker' && p.isActive));
    } catch (err) {
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchViewers = async () => {
    try {
      setViewersLoading(true);
      const res = await axios.get(`${API_BASE_URL}/user/profile/viewers`);
      setViewers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setViewersLoading(false);
    }
  };

  const currentPlan = user?.subscription || { name: 'Free Tier', features: ['Standard Job Search'] };

  const seekerFeatures = [
    { 
      id: 'careerGuidance', 
      title: 'Career Guidance', 
      desc: 'Book free sessions with industry experts.', 
      icon: GraduationCap,
      active: !!user?.subscription?.careerCounsellingCount > 0,
      color: 'bg-emerald-500'
    },
    { 
      id: 'resumePrep', 
      title: 'Resume Preparation', 
      desc: 'Professional resume reviews and templates.', 
      icon: FileText,
      active: !!user?.subscription?.hasResumeBuilder,
      color: 'bg-emerald-500'
    },
    { 
      id: 'examAccess', 
      title: 'Interview Prep', 
      desc: 'Mock tests and interview preparation tools.', 
      icon: BookOpen,
      active: !!user?.subscription?.hasInterviewPrep,
      color: 'bg-orange-500'
    },
    { 
      id: 'profileViews', 
      title: 'Profile Insights', 
      desc: 'See which companies are looking at you.', 
      icon: Users,
      active: !!user?.subscription?.hasProfileViewInsights,
      color: 'bg-purple-500'
    }
  ];

  const jobSeekerFeatures = [
    { label: 'Resume builder', key: 'hasResumeBuilder' },
    { label: 'Apply to jobs', key: 'hasUnlimitedApplications' },
    { label: 'Job alerts', key: 'jobAlerts' },
    { label: 'Profile boost', key: 'hasProfileBoost' },
    { label: 'AI resume review', key: 'hasAIResumeReview' },
    { label: 'Profile view insights', key: 'hasProfileViewInsights' },
    { label: 'Message recruiters', key: 'hasMessageRecruiters' },
    { label: 'Salary benchmarking', key: 'hasSalaryBenchmarking' },
    { label: 'Skill gap analysis', key: 'hasSkillGapAnalysis' },
    { label: 'Career counselling session', key: 'careerCounsellingCount' },
    { label: 'Interview prep & mock tests', key: 'hasInterviewPrep' },
    { label: 'Priority application badge', key: 'hasPriorityBadge' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Subscription Management</h1>
            <p className="text-base text-slate-500 font-medium">Elevate your professional visibility with premium services.</p>
          </div>
          
          <Card className="bg-slate-900 text-white border-none rounded-[20px] p-4 flex items-center gap-4 shadow-lg">
             <div className="w-10 h-10 bg-emerald-600 flex items-center justify-center rounded-xl shadow-md">
                <ShieldCheck size={20} />
             </div>
             <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Active Plan</p>
                <h3 className="text-base font-bold tracking-tight">{currentPlan.name}</h3>
             </div>
          </Card>
        </div>
        <div className="h-px bg-slate-200 w-full" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column - Subscription Services */}
        <div className="lg:col-span-2 space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {seekerFeatures.map((feature) => (
                <Card key={feature.id} className={`rounded-[24px] border-slate-200 overflow-hidden bg-white hover:border-emerald-200 transition-all shadow-sm ${!feature.active ? 'opacity-75' : ''}`}>
                   <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-6">
                         <div className={`w-12 h-12 ${feature.color.replace('500', '50')} ${feature.color.replace('bg-', 'text-')} border border-current/10 flex items-center justify-center rounded-xl shadow-sm`}>
                            <feature.icon size={20} />
                         </div>
                         {feature.active ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 uppercase text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-lg">Active Access</Badge>
                         ) : (
                            <Badge variant="outline" className="text-slate-400 border-slate-100 uppercase text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-lg">Locked</Badge>
                         )}
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1.5">{feature.title}</h4>
                      <p className="text-xs font-medium text-slate-500 mb-6 leading-relaxed">{feature.desc}</p>
                      
                      {feature.active ? (
                        <Button className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-widest gap-2">
                           Access Service <ChevronRight size={14} />
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full h-11 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-widest gap-2">
                           Upgrade to unlock <Zap size={14} className="text-amber-500" />
                        </Button>
                      )}
                   </CardContent>
                </Card>
              ))}
           </div>

           {/* Profile Viewers Section */}
           {user?.subscription?.hasProfileViewAccess && (
             <Card className="rounded-[24px] border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="p-6 border-b border-slate-100">
                   <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                         <CardTitle className="text-base font-bold text-slate-900 tracking-tight">Identity Insights</CardTitle>
                         <CardDescription className="text-xs font-medium text-slate-500">Organizations that analyzed your credentials.</CardDescription>
                      </div>
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl border border-emerald-100 shadow-sm">
                         <Users size={18} />
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   {viewersLoading ? (
                     <div className="p-12 text-center text-slate-400 font-medium text-xs">Analyzing traffic patterns...</div>
                   ) : viewers.length > 0 ? (
                     <div className="divide-y divide-slate-50">
                        {viewers.map((view, i) => (
                          <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-400 text-sm group-hover:bg-white group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                                   {view.viewer?.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900">{view.viewer?.name}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                      {new Date(view.timestamp).toLocaleDateString()} at {new Date(view.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                   </p>
                                </div>
                             </div>
                             <Button variant="ghost" size="sm" className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-lg">
                                View Profile
                             </Button>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="p-16 text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                          <AlertCircle className="w-6 h-6 text-slate-200" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No recent traffic identified.</p>
                     </div>
                   )}
                </CardContent>
             </Card>
           )}
        </div>

        {/* Right Column - Available Upgrade Plans */}
        <div className="space-y-6">
           <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-200">
              <div className="flex items-center gap-2.5 mb-6">
                 <Zap className="text-amber-500" size={18} fill="currentColor" />
                 <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Available Tiers</h2>
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
                            {plan.features.slice(0, 3).map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                 <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                                 <span className="truncate">{f}</span>
                              </div>
                            ))}
                         </div>

                          <Button 
                            className={`w-full h-10 rounded-xl font-bold text-[9px] uppercase tracking-[0.2em] transition-all ${
                              plan.price > 15000 
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200' 
                                : 'bg-slate-900 hover:bg-emerald-600 text-white shadow-md hover:shadow-emerald-200 shadow-slate-200'
                            }`}
                          >
                             {plan.price > 15000 ? 'Contact Sales' : 'Activate Plan'}
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
                    <h3 className="text-sm font-bold text-slate-900 uppercase">Verified Talent</h3>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">Official CT-Certified badges boost profile visibility by up to 3.5x.</p>
                 </div>
                 <Button variant="outline" className="w-full h-10 rounded-xl border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                    Learn More
                 </Button>
              </CardContent>
           </Card>
        </div>

        {/* Plan Comparison Table - Full Width Row */}
        <div className="lg:col-span-3">
          <PlanComparisonTable 
            title="Job Seeker Plans Comparison" 
            plans={plans} 
            features={jobSeekerFeatures} 
          />
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
