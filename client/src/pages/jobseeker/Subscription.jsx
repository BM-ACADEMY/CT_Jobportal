import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Zap, Briefcase, Download, Trophy, ChevronRight, GraduationCap, Layout, MessageSquare, Target, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PricingCard from '../../components/subscription/PricingCard';
import PlanComparisonTable from '../../components/subscription/PlanComparisonTable';

const SubscriptionPage = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState([]);
  const [viewersLoading, setViewersLoading] = useState(true);

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
      setPlans(res.data.filter(p => p.isActive && p.role === 'jobseeker'));
    } catch (err) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchViewers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/jobseeker/profile-views`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViewers(res.data);
    } catch (err) {
      console.error("Error fetching viewers:", err);
    } finally {
      setViewersLoading(false);
    }
  };

  const currentPlan = user?.subscription || { name: 'Free Tier' };

  const seekerFeatures = [
    { 
      id: 'resume', 
      title: 'Smart Resume Builder', 
      desc: 'Create AI-optimized resumes that beat ATS systems.', 
      icon: Layout, 
      color: 'bg-blue-500', 
      active: user?.subscription?.hasResumeBuilder 
    },
    { 
      id: 'alerts', 
      title: 'Priority Job Alerts', 
      desc: 'Get notified of new opportunities before anyone else.', 
      icon: Zap, 
      color: 'bg-amber-500', 
      active: user?.subscription?.jobAlerts !== 'None' 
    },
    { 
      id: 'insights', 
      title: 'Profile Insights', 
      desc: 'See exactly which companies are viewing your profile.', 
      icon: Target, 
      color: 'bg-emerald-500', 
      active: user?.subscription?.hasProfileViewInsights 
    },
    { 
      id: 'counselling', 
      title: 'Career Guidance', 
      desc: '1-on-1 sessions with industry experts and coaches.', 
      icon: GraduationCap, 
      color: 'bg-purple-500', 
      active: user?.subscription?.hasCareerCounselling 
    }
  ];

  const jobSeekerFeatures = [
    { label: 'Resume builder', key: 'hasResumeBuilder' },
    { label: 'Job alerts', key: 'jobAlerts' },
    { label: 'Profile boost', key: 'hasProfileBoost' },
    { label: 'Profile view insights', key: 'hasProfileViewInsights' },
    { label: 'Message recruiters', key: 'hasMessageRecruiters' },
    { label: 'Career counselling', key: 'careerCounsellingCount', unit: 'Sessions' },
    { label: 'Interview prep', key: 'hasInterviewPrep' },
    { label: 'Priority badge', key: 'hasPriorityBadge' }
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

      // 2. Open Razorpay modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: amount,
        currency: currency,
        name: "Naukri Clone",
        description: `Upgrade to ${plan.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            // 3. Verify payment on server
            const verifyRes = await axios.post(`${API_BASE_URL}/payments/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (verifyRes.data.success) {
              toast.success("Subscription upgraded successfully!");
              refreshUser(); // Update user context
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
          color: "#059669", // emerald-600
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
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tight uppercase">Subscription Management</h1>
            <p className="text-base text-slate-500 font-medium italic">Elevate your professional visibility with premium services.</p>
          </div>
          
          <Card className="bg-[#0f172a] text-white border-none rounded-[24px] p-6 flex items-center gap-6 shadow-2xl">
             <div className="w-12 h-12 bg-emerald-600 flex items-center justify-center rounded-2xl shadow-lg border border-emerald-500/20">
                <ShieldCheck size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Current Membership</p>
                <h3 className="text-xl font-black tracking-tight uppercase">{currentPlan.name}</h3>
             </div>
          </Card>
        </div>
        <div className="h-px bg-slate-200 w-full" />
      </div>

      {/* Pricing Cards Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
           <Zap className="text-amber-500" size={20} fill="currentColor" />
           <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Available Upgrade Tiers</h2>
        </div>
        <div className="flex flex-col gap-8">
          {plans.map((plan, idx) => (
            <PricingCard 
              key={plan._id} 
              plan={plan} 
              features={jobSeekerFeatures}
              isPopular={idx === 1 || plan.price > 1000} 
              currentPlanId={user?.subscription?._id}
              actionLabel={plan.price > 15000 ? "Contact Us" : "Get Started Now"}
              onAction={handleUpgrade}
            />
          ))}
        </div>
        {plans.length === 0 && !loading && (
           <div className="p-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No premium tiers identified for your role.</p>
           </div>
        )}
      </div>

      <div className="h-px bg-slate-200 w-full" />

      {/* Existing Insights and Comparison Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2">
            {/* Seeker Features Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
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

            {/* Profile Viewers */}
            {user?.subscription?.hasProfileViewAccess && (
              <Card className="rounded-[32px] border-slate-200 shadow-sm overflow-hidden bg-white">
                 <CardHeader className="p-8 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                       <div className="space-y-1">
                          <CardTitle className="text-lg font-black text-slate-900 tracking-tight uppercase">Identity Insights</CardTitle>
                          <CardDescription className="text-xs font-medium text-slate-500">Organizations that analyzed your credentials recently.</CardDescription>
                       </div>
                       <div className="w-12 h-12 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl border border-emerald-100 shadow-sm">
                          <Users size={22} />
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0">
                    {viewersLoading ? (
                      <div className="p-12 text-center text-slate-400 font-medium text-xs">Analyzing traffic patterns...</div>
                    ) : viewers.length > 0 ? (
                      <div className="divide-y divide-slate-50">
                         {viewers.map((view, i) => (
                           <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center font-black text-slate-400 text-sm group-hover:bg-white group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                                    {view.viewer?.name?.[0]?.toUpperCase()}
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-slate-900">{view.viewer?.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">
                                       {new Date(view.timestamp).toLocaleDateString()} at {new Date(view.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                 </div>
                              </div>
                              <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 rounded-xl px-4">
                                 View Profile
                              </Button>
                           </div>
                         ))}
                      </div>
                    ) : (
                      <div className="p-20 text-center space-y-4">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                           <AlertCircle className="w-8 h-8 text-slate-200" />
                         </div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No recent traffic identified.</p>
                      </div>
                    )}
                 </CardContent>
              </Card>
            )}
         </div>

         {/* Comparison Sidebar / Table Link */}
         <div className="lg:col-span-1 space-y-6">
            <Card className="rounded-[32px] bg-white border-slate-200 overflow-hidden relative group shadow-sm">
               <div className="absolute -top-4 -right-4 p-8 text-emerald-50 opacity-50 scale-150 group-hover:rotate-12 transition-transform duration-700">
                  <ShieldCheck size={100} />
               </div>
               <CardContent className="p-8 relative z-10 space-y-6">
                  <div className="space-y-2">
                     <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Verified Talent</h3>
                     <p className="text-xs font-medium text-slate-500 leading-relaxed">Official CT-Certified badges boost profile visibility by up to 3.5x for potential recruiters.</p>
                  </div>
                  <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
                     Learn More
                  </Button>
               </CardContent>
            </Card>

            <Card className="rounded-[32px] bg-[#0f172a] text-white border-none overflow-hidden relative group shadow-2xl p-8">
                <div className="space-y-4">
                   <Trophy className="text-amber-400" size={32} />
                   <h3 className="text-lg font-black uppercase tracking-tight">Elite Comparison</h3>
                   <p className="text-xs font-medium text-slate-400 leading-relaxed">Compare every feature across our membership tiers to find your perfect fit.</p>
                   <Button variant="link" className="text-emerald-400 p-0 h-auto font-black text-[10px] uppercase tracking-widest hover:text-emerald-300 transition-colors" onClick={() => document.getElementById('comparison-table').scrollIntoView({ behavior: 'smooth' })}>
                      View Detailed Table <ChevronRight size={14} className="ml-1" />
                   </Button>
                </div>
            </Card>
         </div>
      </div>

      {/* Plan Comparison Table */}
      <div id="comparison-table" className="pt-10">
        <PlanComparisonTable 
          title="Job Seeker Plans Comparison" 
          plans={plans} 
          features={jobSeekerFeatures} 
        />
      </div>
    </div>
  );
};

export default SubscriptionPage;
