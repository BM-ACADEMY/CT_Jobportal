import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Zap, Briefcase, Download, Trophy, ChevronRight } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import PricingCard from '../../components/subscription/PricingCard';
import PlanComparisonTable from '../../components/subscription/PlanComparisonTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SubscriptionPage = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/subscriptions`);
      setPlans(res.data.filter(p => p.isActive));
    } catch (err) {
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = user?.subscription || { name: 'Free Tier', jobPostingLimit: 5, applicationDownloadLimit: 20 };
  const searchUsed = user?.searchUsed || 0;
  const jobsUsed = user?.jobsUsed || 0;

  const recruiterFeatures = [
    { label: 'Job postings', key: 'activeJobPostings' },
    { label: 'Candidate search', key: 'candidateSearchPerDay', unit: '/day' },
    { label: 'ATS pipeline', key: 'hasATSPipeline' },
    { label: 'Analytics dashboard', key: 'hasAnalyticsDashboard' },
    { label: 'Candidate DB export', key: 'hasCandidateDBExport' },
    { label: 'Bulk messaging', key: 'hasBulkMessaging' },
    { label: 'Video interview', key: 'hasVideoInterview' }
  ];

  const organizationFeatures = [
    { label: 'Job postings', key: 'activeJobPostings', unit: '/month' },
    { label: 'User seats', key: 'userSeats' },
    { label: 'Company profile', key: 'companyProfileType' },
    { label: 'Team collaboration', key: 'hasTeamCollaboration' },
    { label: 'Bulk app management', key: 'hasBulkApplicantManagement' },
    { label: 'Interview scheduling', key: 'hasInterviewScheduling' },
    { label: 'Dedicated onboarding', key: 'hasDedicatedOnboarding' }
  ];

  const handleUpgrade = async (plan) => {
    try {
      const token = localStorage.getItem('token');
      
      // If the plan is free, handle it without Razorpay
      if (plan.price === 0) {
        const res = await axios.post(`${API_BASE_URL}/payments/verify-payment`, {
          planId: plan._id,
          razorpay_payment_id: 'free_plan_' + Date.now(),
          razorpay_order_id: 'free_order_' + Date.now(),
          razorpay_signature: 'free_signature',
          isFree: true
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.success) {
          toast.success("Free plan activated!");
          refreshUser();
        }
        return;
      }

      // 1. Create order on server
      const orderRes = await axios.post(`${API_BASE_URL}/payments/create-order`, {
        planId: plan._id
      }, { headers: { Authorization: `Bearer ${token}` } });

      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: amount,
        currency: currency,
        name: "Naukri Clone",
        description: `Upgrade to ${plan.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/payments/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (verifyRes.data.success) {
              toast.success("Subscription upgraded successfully!");
              refreshUser();
            }
          } catch (err) {
            toast.error(err.response?.data?.msg || "Payment verification failed");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#059669",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to initiate payment");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tight uppercase">Platform Monetization</h1>
            <p className="text-base text-slate-500 font-medium italic">Scale your recruitment capabilities with tailored enterprise solutions.</p>
          </div>
          
          <div className="flex items-center gap-4">
             <Card className="bg-[#0f172a] text-white border-none rounded-[24px] p-6 flex items-center gap-6 shadow-2xl">
                <div className="w-12 h-12 bg-emerald-600 flex items-center justify-center rounded-2xl shadow-lg border border-emerald-500/20">
                   <ShieldCheck size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Active Membership</p>
                   <h3 className="text-xl font-black tracking-tight uppercase">{currentPlan.name}</h3>
                </div>
             </Card>
          </div>
        </div>
        <div className="h-px bg-slate-200 w-full" />
      </div>

      {/* Main Pricing Section */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-3">
              <Zap className="text-amber-500" size={20} fill="currentColor" />
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Enterprise Tiers</h2>
           </div>
        </div>

        <Tabs defaultValue={user?.role === 'company' ? 'company' : 'recruiter'} className="w-full space-y-10">
           {user?.role !== 'recruiter' && user?.role !== 'company' && (
             <TabsList className="bg-slate-100 p-1 rounded-2xl w-fit">
                <TabsTrigger value="recruiter" className="rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Recruiter Plans</TabsTrigger>
                <TabsTrigger value="company" className="rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Organization Plans</TabsTrigger>
             </TabsList>
           )}

           {(user?.role === 'recruiter' || !user?.role) && (
             <TabsContent value="recruiter" className="m-0">
                <div className="flex flex-col gap-8">
                  {plans.filter(p => p.role === 'recruiter').map((plan, idx) => (
                    <PricingCard 
                      key={plan._id} 
                      plan={plan} 
                      features={recruiterFeatures}
                      isPopular={idx === 1}
                      currentPlanId={user?.subscription?._id}
                      onAction={handleUpgrade}
                    />
                  ))}
                  {plans.filter(p => p.role === 'recruiter').length === 0 && !loading && (
                     <div className="col-span-full p-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No recruitment tiers identified.</p>
                     </div>
                  )}
                </div>
             </TabsContent>
           )}

           {(user?.role === 'company' || !user?.role) && (
             <TabsContent value="company" className="m-0">
                <div className="flex flex-col gap-8">
                  {plans.filter(p => p.role === 'company').map((plan, idx) => (
                    <PricingCard 
                      key={plan._id} 
                      plan={plan} 
                      features={organizationFeatures}
                      isPopular={idx === 1}
                      currentPlanId={user?.subscription?._id}
                      onAction={handleUpgrade}
                    />
                  ))}
                  {plans.filter(p => p.role === 'company').length === 0 && !loading && (
                     <div className="col-span-full p-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No organizational tiers identified.</p>
                     </div>
                  )}
                </div>
             </TabsContent>
           )}
        </Tabs>
      </div>

      <div className="h-px bg-slate-200 w-full" />

      {/* Utilization and Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
         <div className="lg:col-span-2 space-y-12">
            {/* Quota Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {[
                 { label: 'Job Postings', used: jobsUsed, limit: currentPlan.activeJobPostings || 0, icon: Briefcase },
                 { label: 'Search Credits', used: searchUsed, limit: currentPlan.candidateSearchPerDay || 0, icon: Download }
               ].map((metric, i) => {
                 const percentage = metric.limit > 0 ? (metric.used / metric.limit) * 100 : 0;
                 return (
                   <Card key={i} className="rounded-[32px] border-slate-200 shadow-sm overflow-hidden bg-white hover:border-emerald-200 transition-all p-8">
                      <div className="flex justify-between items-start mb-8">
                         <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center rounded-2xl shadow-sm">
                            <metric.icon size={24} />
                         </div>
                         <Badge variant="outline" className="font-black text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded-xl border-slate-100 text-slate-400">
                            {metric.limit === 0 || metric.limit === 'Unlimited' ? 'Infinite Access' : 'Monthly Quota'}
                         </Badge>
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-end">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{metric.label}</h4>
                            <div className="text-right">
                               <span className="text-3xl font-black text-slate-900">{metric.used}</span>
                               <span className="text-slate-400 font-bold text-xs uppercase tracking-widest ml-2">
                                  / {metric.limit === 0 || metric.limit === 'Unlimited' ? '∞' : metric.limit}
                               </span>
                            </div>
                         </div>
                         {typeof metric.limit === 'number' && metric.limit > 0 && (
                            <div className="space-y-3">
                               <Progress value={percentage} className="h-2 rounded-full bg-slate-100" />
                               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  <span>{percentage.toFixed(0)}% Utilized</span>
                                  <span>{metric.limit - metric.used} Remaining</span>
                               </div>
                            </div>
                         )}
                      </div>
                   </Card>
                 );
               })}
            </div>

            {/* Detailed Tables */}
            <div className="space-y-16">
               {(user?.role === 'recruiter' || !user?.role) && (
                 <PlanComparisonTable 
                   title="Recruiter Feature Matrix" 
                   plans={plans.filter(p => p.role === 'recruiter')} 
                   features={recruiterFeatures} 
                 />
               )}
               {(user?.role === 'company' || !user?.role) && (
                 <PlanComparisonTable 
                   title="Organization Feature Matrix" 
                   plans={plans.filter(p => p.role === 'company')} 
                   features={organizationFeatures} 
                 />
               )}
            </div>
         </div>

         {/* Sidebar Support */}
         <div className="lg:col-span-1 space-y-8">
            <Card className="rounded-[32px] bg-white border-slate-200 overflow-hidden relative group shadow-sm p-8">
               <div className="absolute -top-4 -right-4 p-8 text-emerald-50 opacity-50 scale-150 group-hover:rotate-12 transition-transform duration-700">
                  <ShieldCheck size={120} />
               </div>
               <div className="relative z-10 space-y-6">
                  <div className="space-y-3">
                     <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Enterprise Support</h3>
                     <p className="text-sm font-medium text-slate-500 leading-relaxed">Dedicated onboarding and custom HRMS integrations for high-volume organizations.</p>
                  </div>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm">
                     Request Consultation
                  </Button>
               </div>
            </Card>

            <Card className="rounded-[32px] bg-[#0f172a] text-white border-none p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 space-y-6">
                   <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                      <Trophy size={24} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase tracking-tight">Premium Badge</h3>
                      <p className="text-xs font-medium text-slate-400 leading-relaxed">Verified companies receive a special badge that increases application quality by 40%.</p>
                   </div>
                   <div className="h-px bg-white/10 w-full" />
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Available in Pro+</span>
                      <ChevronRight size={18} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
            </Card>
         </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
