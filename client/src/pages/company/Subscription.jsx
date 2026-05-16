import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck, Zap, Crown, Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PricingCard from '../../components/subscription/PricingCard';
import CheckoutModal from '../../components/subscription/CheckoutModal';

const RECRUITER_FEATURES = [
  { label: 'Job postings', key: 'activeJobPostings' },
  { label: 'Candidate search', key: 'candidateSearchPerDay', unit: '/day' },
  { label: 'ATS pipeline', key: 'hasATSPipeline' },
  { label: 'Analytics dashboard', key: 'hasAnalyticsDashboard' },
  { label: 'Candidate DB export', key: 'hasCandidateDBExport' },
  { label: 'Bulk messaging', key: 'hasBulkMessaging' },
  { label: 'Video interview', key: 'hasVideoInterview' },
  { label: 'Priority Listing', key: 'hasPriorityListing' },
  { label: 'AI candidate matching', key: 'hasAICandidateMatching' },
];

const COMPANY_FEATURES = [
  { label: 'User seats', key: 'userSeats' },
  { label: 'Company profile', key: 'companyProfileType' },
  { label: 'Team collaboration', key: 'hasTeamCollaboration' },
  { label: 'Bulk app management', key: 'hasBulkApplicantManagement' },
  { label: 'Interview scheduling', key: 'hasInterviewScheduling' },
  { label: 'Dedicated onboarding', key: 'hasDedicatedOnboarding' },
];

const AutoRenewToggle = ({ enabled, onToggle, saving }) => (
  <button
    onClick={onToggle}
    disabled={saving}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
      enabled ? 'bg-emerald-500' : 'bg-slate-200'
    } ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    role="switch"
    aria-checked={enabled}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
      }`}
    />
  </button>
);

const SubscriptionPage = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [globalFeatures, setGlobalFeatures] = useState([]);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [autoRenew, setAutoRenew] = useState(!!user?.autoRenew);
  const [savingAutoRenew, setSavingAutoRenew] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, featuresRes, settingsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/subscriptions`),
          axios.get(`${API_BASE_URL}/subscriptions/features`),
          axios.get(`${API_BASE_URL}/settings`),
        ]);
        setPlans(plansRes.data.filter(p => p.isActive));
        setGlobalFeatures(featuresRes.data);
        setGstPercentage(settingsRes.data.gstPercentage || 0);
      } catch {
        toast.error('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setAutoRenew(!!user?.autoRenew);
  }, [user?.autoRenew]);

  const currentPlan = user?.subscription;
  const expiry = user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
  const daysLeft = expiry ? Math.max(0, Math.ceil((expiry - new Date()) / 86400000)) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft !== null && daysLeft === 0;

  const handleAutoRenewToggle = async () => {
    const next = !autoRenew;
    setSavingAutoRenew(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/user/auto-renew`, { autoRenew: next }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAutoRenew(next);
      toast.success(`Auto-renewal ${next ? 'enabled' : 'disabled'}`);
      refreshUser();
    } catch {
      toast.error('Failed to update auto-renewal preference');
    } finally {
      setSavingAutoRenew(false);
    }
  };

  const handleUpgrade = (plan) => {
    if (plan.price === 0) {
      handleProceedPayment(plan);
      return;
    }
    setCheckoutPlan(plan);
  };

  const handleProceedPayment = async (plan, quantity = 1, selectedAutoRenew = true) => {
    try {
      const token = localStorage.getItem('token');

      if (plan.price === 0) {
        const res = await axios.post(`${API_BASE_URL}/payments/verify-payment`, {
          planId: plan._id,
          razorpay_payment_id: `free_plan_${Date.now()}`,
          razorpay_order_id: `free_order_${Date.now()}`,
          razorpay_signature: 'free_signature',
          isFree: true,
          quantity: 1,
          autoRenew: selectedAutoRenew,
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.success) {
          toast.success('Subscription updated');
          setCheckoutPlan(null);
          refreshUser();
        }
        return;
      }

      const orderRes = await axios.post(`${API_BASE_URL}/payments/create-order`, {
        planId: plan._id,
        quantity,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const { orderId, amount, currency } = orderRes.data;

      setCheckoutPlan(null);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Job Portal',
        description: `${plan.name} — ${quantity > 1 ? `${quantity}× ` : ''}${plan.duration}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/payments/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id,
              quantity,
              autoRenew: selectedAutoRenew,
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (verifyRes.data.success) {
              toast.success('Subscription upgraded successfully');
              refreshUser();
            }
          } catch (err) {
            toast.error(err.response?.data?.msg || 'Verification failed');
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#10b981' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Payment failed to initiate');
    }
  };

  const buildFeatures = (plan, role) => {
    const base = role === 'company' ? COMPANY_FEATURES : RECRUITER_FEATURES;
    const staticLabels = new Set(base.map(f => f.label.toLowerCase()));
    return [
      ...base,
      ...globalFeatures
        .filter(f => f.role === role)
        .filter(gf => !staticLabels.has(gf.name.toLowerCase()))
        .map(gf => {
          const featureInPlan = (plan.features || []).find(f => f.name === gf.name);
          return {
            label: gf.name,
            key: 'dynamic',
            isDynamic: true,
            isActive: !!featureInPlan?.isActive,
            value: featureInPlan?.value,
          };
        }),
    ];
  };

  const defaultTab = user?.role === 'company' ? 'company' : 'recruiter';

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 pt-4">

      {/* Checkout summary modal */}
      {checkoutPlan && (
        <CheckoutModal
          plan={checkoutPlan}
          plans={plans}
          gstPercentage={gstPercentage}
          onClose={() => setCheckoutPlan(null)}
          onProceed={handleProceedPayment}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription & Billing</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account tier and monitor service utilization.</p>
        </div>
      </div>

      {/* Current Plan Status */}
      {currentPlan ? (
        <div className={`rounded-2xl border p-6 flex flex-col gap-5 ${
          isExpired ? 'border-red-200 bg-red-50' :
          isExpiringSoon ? 'border-amber-200 bg-amber-50' :
          'border-emerald-200 bg-emerald-50'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isExpired ? 'bg-red-100' : isExpiringSoon ? 'bg-amber-100' : 'bg-emerald-100'
            }`}>
              {isExpired ? <AlertCircle size={22} className="text-red-600" /> :
               isExpiringSoon ? <Clock size={22} className="text-amber-600" /> :
               <Crown size={22} className="text-emerald-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className="font-bold text-slate-900">{currentPlan.name}</p>
                <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border-none ${
                  isExpired ? 'bg-red-100 text-red-700' :
                  isExpiringSoon ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {isExpired ? 'Expired' : isExpiringSoon ? `${daysLeft}d left` : 'Active'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {expiry
                  ? `${isExpired ? 'Expired on' : 'Renews on'} ${expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : 'Lifetime access'}
              </p>
            </div>
            {(isExpired || isExpiringSoon) && (
              <Button
                onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-sm shrink-0"
              >
                Renew Now
              </Button>
            )}
          </div>

          {/* Auto-renew toggle */}
          {!isExpired && (
            <div className="flex items-center justify-between rounded-xl bg-white/70 border border-white px-4 py-3">
              <div className="flex items-center gap-2.5">
                <RefreshCw size={15} className={autoRenew ? 'text-emerald-600' : 'text-slate-400'} />
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Auto-Renewal</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {autoRenew ? 'Your plan renews automatically before expiry' : 'Your plan will not auto-renew'}
                  </p>
                </div>
              </div>
              <AutoRenewToggle enabled={autoRenew} onToggle={handleAutoRenewToggle} saving={savingAutoRenew} />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} className="text-slate-400" />
          </div>
          <div>
            <p className="font-bold text-slate-700">Free Tier</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Upgrade to unlock premium features below</p>
          </div>
        </div>
      )}

      {/* Plans */}
      <div id="plans-section" className="space-y-8">
        <Tabs defaultValue={defaultTab} className="w-full space-y-8">
          {user?.role !== 'recruiter' && user?.role !== 'company' && (
            <div className="flex justify-center">
              <TabsList className="bg-slate-100 p-1 rounded-xl w-fit">
                <TabsTrigger value="recruiter" className="rounded-lg px-8 py-2.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Recruiters
                </TabsTrigger>
                <TabsTrigger value="company" className="rounded-lg px-8 py-2.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Organizations
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center py-16">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
              <p className="text-slate-400 text-sm font-semibold">Loading plans...</p>
            </div>
          ) : (
            <>
              <TabsContent value="recruiter" className="m-0">
                {plans.filter(p => p.role === 'recruiter').length === 0 ? (
                  <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200">
                    <Zap size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No recruiter plans available</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {plans.filter(p => p.role === 'recruiter').map((plan, idx) => (
                      <PricingCard
                        key={plan._id}
                        plan={plan}
                        features={buildFeatures(plan, 'recruiter')}
                        currentPlanId={currentPlan?._id}
                        onAction={handleUpgrade}
                        isPopular={idx === 1}
                        gstPercentage={gstPercentage}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="company" className="m-0">
                {plans.filter(p => p.role === 'company').length === 0 ? (
                  <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200">
                    <Zap size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No organization plans available</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {plans.filter(p => p.role === 'company').map((plan, idx) => (
                      <PricingCard
                        key={plan._id}
                        plan={plan}
                        features={buildFeatures(plan, 'company')}
                        currentPlanId={currentPlan?._id}
                        onAction={handleUpgrade}
                        isPopular={idx === 1}
                        gstPercentage={gstPercentage}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <div className="text-center opacity-40">
        <p className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.4em]">Secure Transactions via Razorpay</p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
