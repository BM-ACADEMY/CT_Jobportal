import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck, Zap, Briefcase, Users, Star, CheckCircle2,
  Clock, AlertCircle, Crown, FileText, TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PricingCard from '../../components/subscription/PricingCard';

const JOBSEEKER_FEATURES = [
  { label: 'Resume Builder', key: 'hasResumeBuilder' },
  { label: 'Resume Count', key: 'resumeBuilderCount' },
  { label: 'Job Alerts', key: 'jobAlerts' },
  { label: 'Profile Boost', key: 'hasProfileBoost' },
  { label: 'Profile View Insights', key: 'hasProfileViewInsights' },
  { label: 'Career Counselling', key: 'hasCareerCounselling' },
  { label: 'Counselling Sessions', key: 'careerCounsellingCount' },
  { label: 'Interview Prep', key: 'hasInterviewPrep' },
  { label: 'Priority Badge', key: 'hasPriorityBadge' },
];

const FEATURE_HIGHLIGHTS = [
  { key: 'hasResumeBuilder', icon: FileText, label: 'Resume Builder', desc: 'AI-powered professional templates', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'hasProfileBoost', icon: TrendingUp, label: 'Profile Boost', desc: 'Appear higher in recruiter searches', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'hasProfileViewInsights', icon: Users, label: 'Profile Insights', desc: 'See who viewed your profile', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'hasCareerCounselling', icon: Star, label: 'Career Counselling', desc: '1-on-1 expert career sessions', color: 'text-rose-600', bg: 'bg-rose-50' },
  { key: 'hasInterviewPrep', icon: Briefcase, label: 'Interview Prep', desc: 'AI mock interviews & feedback', color: 'text-teal-600', bg: 'bg-teal-50' },
];

const AutoRenewToggle = ({ enabled, onToggle, saving }) => (
  <button
    onClick={onToggle}
    disabled={saving}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none shrink-0 ${enabled ? 'bg-emerald-500' : 'bg-slate-200'
      } ${saving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    role="switch"
    aria-checked={enabled}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
    />
  </button>
);

const SubscriptionPage = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [globalFeatures, setGlobalFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRenew, setAutoRenew] = useState(!!user?.autoRenew);
  const [savingAutoRenew, setSavingAutoRenew] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, featuresRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/subscriptions`),
          axios.get(`${API_BASE_URL}/subscriptions/features`),
        ]);
        setPlans(plansRes.data.filter(p => p.isActive && p.role === 'jobseeker'));
        setGlobalFeatures(featuresRes.data.filter(f => f.role === 'jobseeker'));
      } catch {
        toast.error('Failed to load plans');
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

  // When user has no subscription they are implicitly on the free plan
  const freePlan = plans.find(p => p.price === 0);
  const effectiveCurrentPlanId = currentPlan?._id || freePlan?._id || null;
  const isOnFreePlan = !currentPlan || currentPlan?.price === 0;

  const handleCancel = () => setCancelConfirm(true);

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/payments/cancel-plan`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Subscription cancelled. You are now on the Free plan.');
      setCancelConfirm(false);
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

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

  const handleUpgrade = async (plan) => {
    try {
      const token = localStorage.getItem('token');

      if (plan.price === 0) {
        const res = await axios.post(`${API_BASE_URL}/payments/verify-payment`, {
          planId: plan._id,
          razorpay_payment_id: `free_plan_${Date.now()}`,
          razorpay_order_id: `free_order_${Date.now()}`,
          razorpay_signature: 'free_signature',
          isFree: true,
          autoRenew,
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.success) {
          toast.success('Subscription updated');
          refreshUser();
        }
        return;
      }

      const orderRes = await axios.post(`${API_BASE_URL}/payments/create-order`, {
        planId: plan._id,
      }, { headers: { Authorization: `Bearer ${token}` } });

      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'CareerPoint',
        description: `Upgrade to ${plan.name}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/payments/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: plan._id,
              autoRenew,
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (verifyRes.data.success) {
              toast.success('Subscription upgraded successfully!');
              refreshUser();
            }
          } catch (err) {
            toast.error(err.response?.data?.msg || 'Payment verification failed');
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#10b981' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Payment initiation failed');
    }
  };

  const buildPlanFeatures = (plan) => [
    ...JOBSEEKER_FEATURES,
    ...globalFeatures.map(gf => {
      const featureInPlan = (plan.features || []).find(f => f.name === gf.name);
      return {
        label: gf.name,
        isDynamic: true,
        isActive: !!featureInPlan?.isActive,
        value: featureInPlan?.value ?? null,
      };
    }),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 pt-4">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Premium Plans</h1>
        <p className="text-sm text-slate-500 mt-1">Unlock advanced tools to accelerate your job search.</p>
      </div>

      {/* Cancel confirmation modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in slide-in-from-bottom-4">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} className="text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">Cancel Subscription?</h3>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              Your plan will be cancelled immediately and you'll be moved to the <strong>Free plan</strong>. Any remaining paid period will be forfeited.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelConfirm(false)}
                disabled={cancelling}
                className="flex-1 h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Keep Plan
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelling}
                className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {cancelling ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Status */}
      {!isOnFreePlan ? (
        <div className={`rounded-2xl border p-6 flex flex-col gap-5 ${isExpired ? 'border-red-200 bg-red-50' :
            isExpiringSoon ? 'border-amber-200 bg-amber-50' :
              'border-emerald-200 bg-emerald-50'
          }`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isExpired ? 'bg-red-100' : isExpiringSoon ? 'bg-amber-100' : 'bg-emerald-100'
              }`}>
              {isExpired ? <AlertCircle size={22} className="text-red-600" /> :
                isExpiringSoon ? <Clock size={22} className="text-amber-600" /> :
                  <Crown size={22} className="text-emerald-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className="font-bold text-slate-900">{currentPlan?.name}</p>
                <Badge className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border-none ${isExpired ? 'bg-red-100 text-red-700' :
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

          {/* Auto-renew toggle — only shown when plan is active and not expired */}
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
            <p className="font-bold text-slate-700">Free Plan</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Upgrade to unlock premium features below</p>
          </div>
        </div>
      )}

      {/* Active Feature Highlights */}
      {currentPlan && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Your Active Features</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FEATURE_HIGHLIGHTS.map((item, i) => {
              const active = !!currentPlan[item.key];
              return (
                <div
                  key={i}
                  className={`rounded-2xl border p-4 flex items-start gap-3 transition-opacity ${active ? 'border-slate-100 bg-white shadow-sm' : 'border-slate-100 bg-white opacity-40'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-xl ${active ? item.bg : 'bg-slate-100'} flex items-center justify-center shrink-0`}>
                    <item.icon size={17} className={active ? item.color : 'text-slate-400'} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-snug">{item.label}</p>
                    {active ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={10} /> Enabled
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">Not included</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plans */}
      <div id="plans-section">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Available Plans</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-semibold">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200">
            <Zap size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">No plans available at the moment</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan, idx) => (
              <PricingCard
                key={plan._id}
                plan={plan}
                features={buildPlanFeatures(plan)}
                currentPlanId={effectiveCurrentPlanId}
                onAction={handleUpgrade}
                onCancel={!isOnFreePlan ? handleCancel : undefined}
                isPopular={idx === Math.floor(plans.length / 2)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-[0.4em]">
          Secure Payments via Razorpay &bull; Cancel Anytime
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
