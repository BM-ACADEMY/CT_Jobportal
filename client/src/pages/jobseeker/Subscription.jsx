import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck, Zap, Briefcase, Users, Star, CheckCircle2,
  Clock, AlertCircle, Crown, FileText, TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Card, Typography, Tag, Button, Switch, Modal, Space } from 'antd';
import PricingCard from '../../components/subscription/PricingCard';
import CheckoutModal from '../../components/subscription/CheckoutModal';
import PageSOPBanner from '../../components/common/PageSOPBanner';

const { Title, Text, Paragraph } = Typography;

const JOBSEEKER_FEATURES = [
  { label: 'Resume Builder', key: 'hasResumeBuilder' },
  { label: 'Resume Count', key: 'resumeBuilderCount' },
  { label: 'Job Alerts', key: 'jobAlerts' },
  { label: 'Profile Boost', key: 'hasProfileBoost' },
  { label: 'Profile View Insights', key: 'hasProfileViewInsights' },
  { label: 'Career Counselling', key: 'hasCareerCounselling' },
  { label: 'Counselling Sessions', key: 'careerCounsellingCount' },
  { label: 'Mock Interviews', key: 'hasMockInterviews' },
  { label: 'Priority Badge', key: 'hasPriorityBadge' },
];

const FEATURE_HIGHLIGHTS = [
  { key: 'hasResumeBuilder', icon: FileText, label: 'Resume Builder', desc: 'AI-powered professional templates', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  { key: 'hasProfileBoost', icon: TrendingUp, label: 'Profile Boost', desc: 'Appear higher in recruiter searches', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  { key: 'hasProfileViewInsights', icon: Users, label: 'Profile Insights', desc: 'See who viewed your profile', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { key: 'hasCareerCounselling', icon: Star, label: 'Career Counselling', desc: '1-on-1 expert career sessions', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  { key: 'hasMockInterviews', icon: Briefcase, label: 'Mock Interviews', desc: 'AI mock interviews & feedback', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
];

const SubscriptionPage = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [globalFeatures, setGlobalFeatures] = useState([]);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [autoRenew, setAutoRenew] = useState(!!user?.autoRenew);
  const [savingAutoRenew, setSavingAutoRenew] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, featuresRes, settingsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/subscriptions`),
          axios.get(`${API_BASE_URL}/subscriptions/features`),
          axios.get(`${API_BASE_URL}/settings`),
        ]);
        setPlans(plansRes.data.filter(p => p.isActive && p.role === 'jobseeker'));
        setGlobalFeatures(featuresRes.data.filter(f => f.role === 'jobseeker'));
        setGstPercentage(settingsRes.data.gstPercentage || 0);
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
  const effectiveCurrentPlanId = isExpired ? freePlan?._id : (currentPlan?._id || freePlan?._id || null);
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

  const handleAutoRenewToggle = async (checked) => {
    setSavingAutoRenew(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/user/auto-renew`, { autoRenew: checked }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAutoRenew(checked);
      toast.success(`Auto-renewal ${checked ? 'enabled' : 'disabled'}`);
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

  const handleProceedPayment = async (plan, quantity = 1, selectedAutoRenew = true, couponCode = null) => {
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
        couponCode
      }, { headers: { Authorization: `Bearer ${token}` } });

      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Velaivaaipu',
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
              couponCode
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (verifyRes.data.success) {
              toast.success('Subscription upgraded successfully!');
              setCheckoutPlan(null);
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

  const buildPlanFeatures = (plan) => {
    const staticLabels = new Set(JOBSEEKER_FEATURES.map(f => f.label.toLowerCase()));
    return [
      ...JOBSEEKER_FEATURES,
      ...globalFeatures
        .filter(gf => !staticLabels.has(gf.name.toLowerCase()))
        .map(gf => {
          const featureInPlan = (plan.features || []).find(f => f.name === gf.name);
          return {
            label: gf.name,
            isDynamic: true,
            isActive: !!featureInPlan?.isActive,
            value: featureInPlan?.value ?? null,
          };
        }),
    ];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 pt-8 px-4">
      <PageSOPBanner pageKey="jobseekerSubscription" />

      {/* Header */}
      <div>
        <Title level={2} className="m-0 font-black text-slate-900 tracking-tight">Premium Plans</Title>
        <Text className="text-slate-500 font-medium">Unlock advanced tools to accelerate your job search.</Text>
      </div>

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

      {/* Cancel confirmation modal */}
      <Modal
        title={null}
        open={cancelConfirm}
        onCancel={() => setCancelConfirm(false)}
        footer={null}
        centered
        width={360}
        styles={{ body: { padding: 0 } }}
      >
        <div className="p-8 text-center">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle size={24} className="text-rose-600" />
          </div>
          <Title level={4} className="m-0 mb-2">Cancel Subscription?</Title>
          <Paragraph className="text-slate-500 mb-6 text-sm">
            Your plan will be cancelled immediately and you'll be moved to the <Text strong>Free plan</Text>. Any remaining paid period will be forfeited.
          </Paragraph>
          <div className="flex gap-3">
            <Button
              size="large"
              block
              onClick={() => setCancelConfirm(false)}
              disabled={cancelling}
              className="rounded-sm font-bold text-xs uppercase tracking-widest bg-slate-50 border-slate-200 text-slate-600 shadow-none"
            >
              Keep Plan
            </Button>
            <Button
              size="large"
              block
              danger
              type="primary"
              onClick={confirmCancel}
              loading={cancelling}
              className="rounded-sm font-bold text-xs uppercase tracking-widest shadow-none"
            >
              Yes, Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Current Plan Status */}
      {!isOnFreePlan ? (
        <Card 
          bordered={false}
          bodyStyle={{ padding: '24px' }}
          className={`rounded-none border shadow-sm ${
            isExpired ? 'border-red-200 bg-red-50' :
            isExpiringSoon ? 'border-amber-200 bg-amber-50' :
            'border-emerald-200 bg-emerald-50'
          }`}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${isExpired ? 'bg-red-100' : isExpiringSoon ? 'bg-amber-100' : 'bg-emerald-200/50'}`}>
                {isExpired ? <AlertCircle size={24} className="text-red-600" /> :
                  isExpiringSoon ? <Clock size={24} className="text-amber-600" /> :
                    <Crown size={24} className="text-emerald-700" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h3 className="text-xl m-0 font-bold text-slate-900">{currentPlan?.name}</h3>
                  <Tag 
                    bordered={false} 
                    className={`m-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                      isExpired ? 'bg-red-100 text-red-700' :
                      isExpiringSoon ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-200/50 text-emerald-700'
                    }`}
                  >
                    {isExpired ? 'Expired' : isExpiringSoon ? `${daysLeft}d left` : 'Active'}
                  </Tag>
                </div>
                <p className="text-sm text-slate-600 font-medium m-0">
                  {expiry
                    ? `${isExpired ? 'Expired on' : 'Renews on'} ${expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : 'Lifetime access'}
                </p>
              </div>
              {(isExpired || isExpiringSoon) && (
                <Button
                  onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="h-10 px-6 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-none border-none shrink-0"
                >
                  Renew Now
                </Button>
              )}
            </div>

            {/* Auto-renew toggle */}
            {!isExpired && (
              <div className="flex items-center justify-between rounded-sm bg-white/70 border border-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} className={autoRenew ? 'text-emerald-600' : 'text-slate-400'} />
                  <div>
                    <h4 className="text-sm m-0 font-bold text-slate-800 leading-tight">Auto-Renewal</h4>
                    <p className="text-xs text-slate-500 mt-0.5 m-0">
                      {autoRenew ? 'Your plan renews automatically before expiry' : 'Your plan will not auto-renew'}
                    </p>
                  </div>
                </div>
                <Switch checked={autoRenew} onChange={handleAutoRenewToggle} loading={savingAutoRenew} />
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card 
          bordered={false}
          className="rounded-none border border-slate-200 bg-slate-50 shadow-none"
          bodyStyle={{ padding: '24px' }}
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <ShieldCheck size={24} className="text-slate-500" />
            </div>
            <div>
              <h3 className="text-lg m-0 font-bold text-slate-800">Free Plan</h3>
              <p className="text-sm text-slate-500 font-medium mt-1 m-0">Upgrade to unlock premium features below</p>
            </div>
          </div>
        </Card>
      )}

      {/* Active Feature Highlights */}
      {currentPlan && !isExpired && (
        <div className="mt-10">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Your Active Features</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURE_HIGHLIGHTS.map((item, i) => {
              const active = !!currentPlan[item.key];
              return (
                <Card
                  key={i}
                  bordered={false}
                  bodyStyle={{ padding: '20px' }}
                  className={`rounded-none border transition-opacity ${
                    active ? `border-slate-200 bg-white shadow-sm` : 'border-slate-100 bg-white opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full ${active ? item.bg : 'bg-slate-100'} flex items-center justify-center shrink-0 border ${active ? item.border : 'border-transparent'}`}>
                      <item.icon size={18} className={active ? item.color : 'text-slate-400'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-800 m-0 mb-1">{item.label}</h4>
                      {active ? (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Enabled
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 block">Not included</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Plans */}
      <div id="plans-section" className="pt-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Available Plans</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 text-sm font-semibold m-0">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <Card bordered={false} className="text-center py-16 rounded-none border border-dashed border-slate-200 shadow-none bg-transparent">
            <Zap size={32} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-semibold m-0">No plans available at the moment</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
              <PricingCard
                key={plan._id}
                plan={plan}
                features={buildPlanFeatures(plan)}
                currentPlanId={effectiveCurrentPlanId}
                onAction={handleUpgrade}
                onCancel={!isOnFreePlan ? handleCancel : undefined}
                isPopular={idx === Math.floor(plans.length / 2)}
                gstPercentage={gstPercentage}
              />
            ))}
          </div>
        )}
      </div>

      <div className="text-center mt-12">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.4em] m-0">
          Secure Payments via Razorpay &bull; Cancel Anytime
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
