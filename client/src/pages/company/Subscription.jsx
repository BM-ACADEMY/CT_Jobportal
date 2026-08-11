import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageSOPBanner from '@/components/common/PageSOPBanner';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck, Zap, Crown, Clock, AlertCircle, RefreshCw, Download, XCircle, CheckCircle2, Info
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PricingCard from '../../components/subscription/PricingCard';
import CheckoutModal from '../../components/subscription/CheckoutModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const STATUS_CONFIG = {
  completed:  { label: 'Active',       badge: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
  superseded: { label: 'Deactivated',  badge: 'bg-slate-50 text-slate-400',     icon: Clock },
  failed:     { label: 'Failed',       badge: 'bg-rose-50 text-rose-600',       icon: XCircle },
  pending:    { label: 'Pending',      badge: 'bg-amber-50 text-amber-600',     icon: Clock },
  cancelled:  { label: 'Cancelled',    badge: 'bg-rose-50 text-rose-400',       icon: XCircle },
};

const generateInvoiceHTML = (payment, user) => {
  const invoiceNo   = payment.razorpay_payment_id || payment._id?.slice(-8).toUpperCase();
  const orderId     = payment.razorpay_order_id   || '—';
  const date        = new Date(payment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const isPayPer      = payment.paymentType === 'pay-per-feature';
  const planName      = isPayPer ? (payment.payPerFeature?.name || 'A-la-carte Feature') : (payment.plan?.name || 'Subscription Plan');
  const duration      = isPayPer ? (payment.payPerFeature?.days ? `${payment.payPerFeature.days} Days` : 'N/A') : (payment.plan?.duration || 'N/A');
  const description   = isPayPer ? 'Pay-Per Feature Unlock' : 'Velaivaaipu Premium Access';
  const method        = payment.paymentMethod || 'Razorpay';
  const statusLabel   = STATUS_CONFIG[payment.status]?.label || payment.status;
  const userName      = user?.name  || '—';
  const userEmail     = user?.email || '—';

  const baseAmt   = payment.baseAmount   || payment.amount || 0;
  const gstPct    = payment.gstPercentage || 0;
  const gstAmt    = payment.gstAmount    || 0;
  const totalAmt  = payment.amount       || 0;
  const isFree    = totalAmt === 0;

  const fmtINR = (n) => n > 0 ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00';
  const amountDisplay = isFree ? '₹0 (Free)' : fmtINR(totalAmt);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice – ${invoiceNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 28px; border-bottom: 2px solid #e2e8f0; }
    .brand { display: flex; flex-direction: column; gap: 4px; }
    .brand-name { font-size: 22px; font-weight: 800; color: #10b981; letter-spacing: -0.5px; }
    .brand-sub  { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; }
    .invoice-label { text-align: right; }
    .invoice-label h1 { font-size: 32px; font-weight: 800; color: #f1f5f9; letter-spacing: -1px; text-transform: uppercase; }
    .invoice-label p  { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
    .meta-block h3 { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-bottom: 10px; }
    .meta-block p  { font-size: 13px; color: #334155; line-height: 1.7; }
    .meta-block p strong { font-weight: 700; color: #1e293b; }
    .table-wrap { margin-bottom: 32px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f8fafc; }
    th { padding: 12px 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; text-align: left; }
    th.right, td.right { text-align: right; }
    td { padding: 16px 20px; font-size: 13px; color: #334155; border-top: 1px solid #f1f5f9; }
    td strong { font-weight: 700; color: #1e293b; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-box { width: 280px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 10px 20px; font-size: 13px; border-top: 1px solid #f1f5f9; }
    .totals-row:first-child { border-top: none; }
    .totals-row.total { background: #f0fdf4; font-weight: 800; font-size: 14px; color: #10b981; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .status-completed  { background: #d1fae5; color: #059669; }
    .status-superseded { background: #f1f5f9; color: #94a3b8; }
    .status-failed     { background: #fee2e2; color: #dc2626; }
    .status-pending    { background: #fef9c3; color: #ca8a04; }
    .status-cancelled  { background: #fee2e2; color: #f87171; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; }
    .footer p { font-size: 11px; color: #94a3b8; }
    .footer .thanks { font-size: 13px; font-weight: 700; color: #10b981; }
    @media print {
      body { padding: 20px; }
      @page { margin: 12mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <span class="brand-name">Velaivaaipu</span>
      <span class="brand-sub">Professional Hub</span>
    </div>
    <div class="invoice-label">
      <h1>Invoice</h1>
      <p>#${invoiceNo}</p>
    </div>
  </div>
  <div class="meta">
    <div class="meta-block">
      <h3>Billed To</h3>
      <p><strong>${userName}</strong></p>
      <p>${userEmail}</p>
    </div>
    <div class="meta-block" style="text-align:right">
      <h3>Invoice Details</h3>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Method:</strong> ${method}</p>
      <p><strong>Status:</strong> <span class="status-badge status-${payment.status}">${statusLabel}</span></p>
      <p><strong>Total Paid:</strong> ${amountDisplay}</p>
    </div>
  </div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th>Plan</th>
          <th>Duration</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td><strong>${isPayPer ? 'Feature' : 'Subscription'} — ${planName}</strong><br/><span style="font-size:11px;color:#94a3b8;">${description}</span></td>
          <td>${planName}</td>
          <td>${duration}</td>
          <td class="right"><strong>${isFree ? '₹0 (Free)' : fmtINR(baseAmt)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Base Amount</span><span>${isFree ? '₹0' : fmtINR(baseAmt)}</span></div>
      <div class="totals-row"><span>GST (${gstPct}%)</span><span>${isFree ? '₹0' : fmtINR(gstAmt)}</span></div>
      <div class="totals-row total"><span>Total</span><span>${amountDisplay}</span></div>
    </div>
  </div>
  <div class="footer">
    <p>Velaivaaipu &bull; Professional Hub<br/>Thank you for your subscription.</p>
    <p class="thanks">Payment Verified ✓</p>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
};

const downloadInvoice = (payment, user) => {
  const html   = generateInvoiceHTML(payment, user);
  const blob   = new Blob([html], { type: 'text/html' });
  const url    = URL.createObjectURL(blob);
  const win    = window.open(url, '_blank');
  if (!win) toast.error('Allow popups to download the invoice');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

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
  const [payments, setPayments] = useState([]);
  const [downgradePlan, setDowngradePlan] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [plansRes, featuresRes, settingsRes, paymentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/subscriptions`),
          axios.get(`${API_BASE_URL}/subscriptions/features`),
          axios.get(`${API_BASE_URL}/settings`),
          axios.get(`${API_BASE_URL}/payments/history`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setPlans(plansRes.data.filter(p => p.isActive));
        setGlobalFeatures(featuresRes.data);
        setGstPercentage(settingsRes.data.gstPercentage || 0);
        setPayments(paymentsRes.data);
      } catch {
        toast.error('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const loadOrgAutoRenew = async () => {
      const token = localStorage.getItem('token');
      try {
        if (user?.role === 'college') {
          const res = await axios.get(`${API_BASE_URL}/college/profile`, { headers: { Authorization: `Bearer ${token}` } });
          setAutoRenew(!!res.data.autoRenewEnabled);
        } else if (user?.role === 'company') {
          const res = await axios.get(`${API_BASE_URL}/company/profile`, { headers: { Authorization: `Bearer ${token}` } });
          setAutoRenew(!!res.data.company?.autoRenewEnabled);
        } else {
          setAutoRenew(!!user?.autoRenew);
        }
      } catch {
        setAutoRenew(!!user?.autoRenew);
      }
    };
    if (user?.role) loadOrgAutoRenew();
  }, [user?.role, user?.autoRenew]);

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
      if (user?.role === 'college') {
        await axios.put(`${API_BASE_URL}/college/me/subscription/auto-renew`, { autoRenewEnabled: next }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else if (user?.role === 'company') {
        await axios.put(`${API_BASE_URL}/company/subscription/auto-renew`, { autoRenewEnabled: next }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.patch(`${API_BASE_URL}/user/auto-renew`, { autoRenew: next }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setAutoRenew(next);
      toast.success(`Auto-renewal ${next ? 'enabled' : 'disabled'}`);
      refreshUser();
    } catch {
      toast.error('Failed to update auto-renewal preference');
    } finally {
      setSavingAutoRenew(false);
    }
  };

  const isRecurringRole = (role) => role === 'college' || role === 'company';

  // Only warn when switching away from an active, paid plan to a cheaper one — a fresh
  // purchase or an expired-plan renewal isn't "downgrading" anything that was paid for.
  // Custom-priced plans (e.g. Enterprise) store price:0 as a placeholder, not an actual
  // price, so they're never comparable and can't be flagged as a downgrade.
  const isDowngrade = (plan) =>
    !isExpired && currentPlan && currentPlan.price > 0 && !plan.isCustomPrice &&
    plan._id !== currentPlan._id && plan.price < currentPlan.price;

  const handleUpgrade = (plan) => {
    if (isDowngrade(plan)) {
      setDowngradePlan(plan);
      return;
    }
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

      if (isRecurringRole(plan.role)) {
        const subRes = await axios.post(`${API_BASE_URL}/payments/create-subscription`, {
          planId: plan._id,
          couponCode
        }, { headers: { Authorization: `Bearer ${token}` } });

        const { subscriptionId, keyId } = subRes.data;

        const options = {
          key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          subscription_id: subscriptionId,
          name: 'Velaivaaipu',
          description: `${plan.name} — ${plan.duration} (auto-renews)`,
          handler: async (response) => {
            try {
              const verifyRes = await axios.post(`${API_BASE_URL}/payments/verify-subscription`, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan._id,
                couponCode
              }, { headers: { Authorization: `Bearer ${token}` } });

              if (verifyRes.data.success) {
                toast.success('Subscription active — it will auto-renew automatically.');
                setCheckoutPlan(null);
                setAutoRenew(true);
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
              toast.success('Subscription upgraded successfully');
              setCheckoutPlan(null);
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
    if (role === 'college') {
      return (plan.features || []).map(f => ({
        label: f.name,
        key: 'dynamic',
        isDynamic: true,
        isActive: !!f.isActive,
        value: f.value,
      }));
    }
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

  const defaultTab = user?.role === 'company' ? 'company' : user?.role === 'college' ? 'college' : 'recruiter';

  // A delegated team member (a recruiter added by an org admin, or an org_employee) doesn't own
  // billing for the organization — only the org admin purchases/changes the org's plan. They may
  // freely purchase a recruiter-tier plan for their own personal use (fully separate from the
  // org's plan — see `organizationSubscription`), but never see or buy an organization-tier plan.
  const isRestrictedTeamMember = (user?.role === 'recruiter' && user?.isTeamManaged) || user?.role === 'org_employee';

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 pt-4">
      <PageSOPBanner pageKey="companySubscription" />

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

      {/* Downgrade confirmation */}
      <ConfirmDialog
        open={!!downgradePlan}
        onOpenChange={(open) => { if (!open) setDowngradePlan(null); }}
        title="Downgrade your plan?"
        description={`You're switching from ${currentPlan?.name || 'your current plan'} to ${downgradePlan?.name || 'this plan'}. Any amount already paid for your current plan is non-refundable, and you'll lose access to features exclusive to your current tier once the change takes effect.`}
        confirmLabel="Downgrade Anyway"
        destructive
        onConfirm={() => {
          const plan = downgradePlan;
          setDowngradePlan(null);
          if (plan.price === 0) {
            handleProceedPayment(plan);
          } else {
            setCheckoutPlan(plan);
          }
        }}
      />

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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
              {payments.find(p => p.status === 'completed' && p.paymentType !== 'pay-per-feature' && (p.plan?._id?.toString() === currentPlan?._id?.toString() || p.plan?.id === currentPlan?._id?.toString())) && (
                <Button
                  onClick={() => downloadInvoice(payments.find(p => p.status === 'completed' && p.paymentType !== 'pay-per-feature' && (p.plan?._id?.toString() === currentPlan?._id?.toString() || p.plan?.id === currentPlan?._id?.toString())), user)}
                  variant="outline"
                  className="h-10 px-4 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-sm flex items-center gap-2"
                >
                  <Download size={14} /> Download Invoice
                </Button>
              )}
              {(isExpired || isExpiringSoon) && (
                <Button
                  onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-sm"
                >
                  Renew Now
                </Button>
              )}
            </div>
          </div>

          {/* Auto-renew toggle — this is the user's own personal plan, so it's always theirs to manage */}
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
          {user?.role !== 'recruiter' && user?.role !== 'company' && user?.role !== 'college' && user?.role !== 'org_employee' && (
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
                {isRestrictedTeamMember && user?.organizationSubscription && (
                  <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-start gap-2.5">
                    <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 font-medium">
                      Your organization ({user.employerCompanyName || 'your company'}) is on the <span className="font-bold">{user.organizationSubscription.name}</span> plan — that's managed by your organization admin. The plans below are separate: buy one for your own personal use.
                    </p>
                  </div>
                )}
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
                        currentPlanId={isExpired ? plans.find(p => p.price === 0 && p.role === plan.role)?._id : currentPlan?._id}
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
                        currentPlanId={isExpired ? plans.find(p => p.price === 0 && p.role === plan.role)?._id : currentPlan?._id}
                        onAction={handleUpgrade}
                        isPopular={idx === 1}
                        gstPercentage={gstPercentage}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="college" className="m-0">
                {plans.filter(p => p.role === 'college').length === 0 ? (
                  <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200">
                    <Zap size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No campus plans available</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {plans.filter(p => p.role === 'college').sort((a, b) => a.price - b.price).map((plan, idx) => (
                      <PricingCard
                        key={plan._id}
                        plan={plan}
                        features={buildFeatures(plan, 'college')}
                        currentPlanId={isExpired ? plans.find(p => p.price === 0 && p.role === plan.role)?._id : currentPlan?._id}
                        onAction={handleUpgrade}
                        isPopular={idx === 2}
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
