import React, { useState, useEffect, useRef } from 'react';
import PaymentTrust from '@/components/subscription/PaymentTrust';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Loader2, Zap, CheckCircle2, Clock, ShoppingBag, Download, XCircle, ArrowUpCircle } from 'lucide-react';
import { Card, Typography, Tag, Button, Modal } from 'antd';
import PayPerCheckoutModal from '../../components/subscription/PayPerCheckoutModal';

// One button look for the whole page.
const BTN = 'inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold border-none transition';
const BTN_PRIMARY = `${BTN} bg-[#34B678] text-white shadow-md shadow-[#34B678]/25 hover:bg-[#2ca66b] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none`;
const BTN_OWNED = `${BTN} bg-[#eaf7f0] text-[#1f8a57] ring-1 ring-[#34B678]/30 cursor-default`;
const BTN_SECONDARY = `${BTN} bg-white text-[#10213D] ring-1 ring-zinc-200 hover:ring-[#34B678]/50 hover:text-[#1f8a57] cursor-pointer`;
const rowLabel = 'text-xs text-zinc-500';

const { Title, Text, Paragraph } = Typography;

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

const PayPerFeatures = () => {
  const { user, refreshUser } = useAuth();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  // A ref, not state: two quick clicks both read the same stale `processingId`.
  const purchaseInFlight = useRef(false);
  const [payments, setPayments] = useState([]);
  const [gstPercentage, setGstPercentage] = useState(0);
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [checkoutFeature, setCheckoutFeature] = useState(null);
  const [descriptionModal, setDescriptionModal] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [featuresRes, paymentsRes, settingsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/pay-per/features`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/payments/history`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/settings`)
        ]);
        setFeatures(featuresRes.data);
        setPayments(paymentsRes.data);
        setGstPercentage(settingsRes.data.gstPercentage || 0);
        setPaymentsEnabled(settingsRes.data.paymentsEnabled === true);
      } catch (err) {
        console.error('Error loading features:', err);
        toast.error('Failed to load pay-per features');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_BASE_URL]);

  const handleCheckout = (feature) => {
    if (!paymentsEnabled) {
      toast('Add-ons open soon, once online payments are switched on.');
      return;
    }
    if (!user) {
      toast.error('Please log in to purchase features');
      return;
    }
    setCheckoutFeature(feature);
  };

  const handlePurchase = async (feature, quantity = 1) => {
    if (purchaseInFlight.current) return;
    purchaseInFlight.current = true;
    setProcessingId(feature._id);
    const finishPurchase = () => {
      purchaseInFlight.current = false;
      setProcessingId(null);
    };
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const orderRes = await axios.post(`${API_BASE_URL}/pay-per/purchase/create-order`, {
        featureId: feature._id,
        quantity
      }, { headers });

      const { orderId, amount, currency, featureName } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Velaivaaipu',
        description: `Pay-per: ${featureName} ${quantity > 1 ? `x${quantity}` : ''}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await axios.post(`${API_BASE_URL}/pay-per/purchase/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              featureId: feature._id,
              quantity
            }, { headers });

            if (verifyRes.data.success) {
               toast.success(verifyRes.data.msg || 'Feature purchased successfully!');
               setCheckoutFeature(null);
               refreshUser();
            }
          } catch (err) {
            toast.error(err.response?.data?.msg || 'Payment verification failed');
          } finally {
            finishPurchase();
          }
        },
        modal: {
          ondismiss: () => {
            finishPurchase();
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#10b981' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        finishPurchase();
      });
      rzp.open();
    } catch (err) {
      console.error('Purchase error:', err);
      toast.error(err.response?.data?.msg || 'Failed to initiate purchase');
      finishPurchase();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 animate-spin text-[#34B678] mb-3" />
        <p className="m-0 text-zinc-400 text-[13px]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-10">
      {checkoutFeature && (
        <PayPerCheckoutModal
          feature={checkoutFeature}
          gstPercentage={gstPercentage}
          onClose={() => setCheckoutFeature(null)}
          onProceed={handlePurchase}
        />
      )}
      
      <Modal
        title={<span className="font-semibold text-[#10213D] text-base">{descriptionModal?.name}</span>}
        open={!!descriptionModal}
        onCancel={() => setDescriptionModal(null)}
        footer={null}
        centered
      >
        <div className="pt-2 text-[13px] text-zinc-600 leading-relaxed whitespace-pre-wrap">
          {descriptionModal?.description}
        </div>
      </Modal>

      {/* Header */}
      <div>
        <p className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1f8a57]">Buy extras</p>
        <h1 className="m-0 text-xl font-bold tracking-tight text-[#10213D] sm:text-[1.375rem]">Buy only what you need</h1>
        <p className="m-0 mt-1 max-w-2xl text-[13px] leading-relaxed text-zinc-500">Get a single feature without a full plan. Each one is active for the days shown.</p>
      </div>

      {features.length === 0 ? (
        <Card bordered={false} className="text-center py-16 rounded-2xl ring-1 ring-zinc-200/80 shadow-none bg-white">
          <Zap size={32} className="text-slate-300 mx-auto mb-4" />
          <p className="m-0 text-sm font-semibold text-[#10213D]">Nothing to buy for your account right now.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((f) => {
            const activePurchases = user?.purchasedFeatures?.filter(
              pf => pf.featureId?.toString() === f._id?.toString() && (!pf.expiresAt || new Date(pf.expiresAt) > new Date())
            ) || [];

            let userPurchase = activePurchases.find(pf => pf.usageLeft > 0 || f.usageCount === 0);

            if (!userPurchase && activePurchases.length > 0) {
              userPurchase = activePurchases[activePurchases.length - 1];
            }

            const purchased = !!userPurchase;
            const hasCreditsRemaining = userPurchase && (userPurchase.usageLeft > 0 || f.usageCount === 0);
            const isProcessing = processingId === f._id;

            return (
              <Card 
                key={f._id} 
                bordered={false}
                styles={{ body: { padding: 20, display: 'flex', flexDirection: 'column', height: '100%' } }}
                className="relative overflow-hidden rounded-2xl ring-1 ring-zinc-200/80 shadow-none hover:ring-[#34B678]/40 transition-all bg-white h-full flex flex-col"
              >
                
                <div className="pb-4 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-11 h-11 bg-[#eaf7f0] rounded-xl flex items-center justify-center text-[#1f8a57]">
                      <Sparkles size={20} />
                    </div>
                    {purchased ? (
                      <div className="flex flex-col items-end gap-1.5">
                        {hasCreditsRemaining ? (
                          <Tag bordered={false} className="m-0 bg-[#eaf7f0] text-[#1f8a57] text-[11px] font-semibold px-2 py-0.5 flex items-center gap-1 rounded-md">
                            <CheckCircle2 size={10} /> Active
                          </Tag>
                        ) : (
                          <Tag bordered={false} className="m-0 bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5 flex items-center gap-1 rounded-md">
                            <ArrowUpCircle size={10} /> 0 Left
                          </Tag>
                        )}
                        <span className="text-[11px] text-zinc-400">Valid {f.days} days</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-zinc-400">
                        <Clock size={12} />
                        <span className="text-[11px] font-medium">{f.days} {f.days === 1 ? 'day' : 'days'}</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="m-0 mb-1.5 text-[15px] font-semibold leading-snug text-[#10213D]">{f.name}</h3>
                  
                  <div>
                    <p className="m-0 mb-1 line-clamp-2 min-h-[36px] text-[13px] leading-relaxed text-zinc-500">
                      {f.description || 'Enhance your experience with this premium feature.'}
                    </p>
                    {f.description && f.description.length > 80 && (
                      <button 
                        onClick={() => setDescriptionModal(f)} 
                        className="text-xs font-semibold text-[#1f8a57] hover:underline bg-transparent border-none p-0 cursor-pointer"
                      >
                        Read more
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 mt-auto">
                  {/* Price + Usage */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold tracking-tight text-[#10213D]">₹{f.cost}</span>
                      <span className="ml-1 text-xs text-zinc-400">+ GST</span>
                    </div>
                    {purchased && userPurchase ? (
                      f.usageCount > 0 ? (
                        <Tag bordered={false} className={`m-0 text-[11px] font-semibold px-2 py-0.5 rounded-md ${userPurchase.usageLeft > 0 ? 'text-slate-600 bg-slate-100' : 'text-rose-600 bg-rose-50'}`}>
                          {userPurchase.usageLeft} Use{userPurchase.usageLeft !== 1 ? 's' : ''} Left
                        </Tag>
                      ) : (
                        <Tag bordered={false} className="m-0 text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                          Unlimited
                        </Tag>
                      )
                    ) : (
                      <>
                        {f.usageCount > 0 && (
                          <Tag bordered={false} className="m-0 text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                            {f.usageCount} Use{f.usageCount > 1 ? 's' : ''}
                          </Tag>
                        )}
                        {f.usageCount === 0 && (
                          <Tag bordered={false} className="m-0 text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                            Unlimited
                          </Tag>
                        )}
                      </>
                    )}
                  </div>

                  {/* Purchased Details */}
                  {purchased && userPurchase && (
                    <div className="mb-4 rounded-xl bg-zinc-50 p-3.5 space-y-2.5 text-xs text-zinc-600 ring-1 ring-zinc-200/70">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-200/70">
                        <span className={rowLabel}>Days left</span>
                        <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                          {Math.max(0, Math.ceil((new Date(userPurchase.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))} Days Left
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={rowLabel}>Bought on</span>
                        <span className="font-medium text-[#10213D]">
                          {new Date(userPurchase.purchasedAt || (new Date(userPurchase.expiresAt).getTime() - f.days * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-zinc-200/70">
                        <span className={rowLabel}>Ends on</span>
                        <span className="font-medium text-[#10213D]">
                          {new Date(userPurchase.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {/* Invoice Button */}
                      {payments.find(p => p.status === 'completed' && p.paymentType === 'pay-per-feature' && p.payPerFeature?._id?.toString() === f._id?.toString()) && (
                        <button
                          type="button"
                          onClick={() => downloadInvoice(payments.find(p => p.status === 'completed' && p.paymentType === 'pay-per-feature' && p.payPerFeature?._id?.toString() === f._id?.toString()), user)}
                          className={`${BTN_SECONDARY} mt-1`}
                        >
                          <Download size={15} /> Download invoice
                        </button>
                      )}
                    </div>
                  )}

                  {/* Preview Details */}
                  {!purchased && (
                    <div className="mb-4 rounded-xl bg-zinc-50 p-3.5 space-y-2 text-xs ring-1 ring-zinc-200/70">
                      <div className="flex justify-between items-center">
                        <span className={rowLabel}>Valid for</span>
                        <span className="font-semibold text-[#10213D]">{f.days} {f.days === 1 ? 'day' : 'days'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={rowLabel}>Uses</span>
                        <span className="font-semibold text-[#10213D]">
                          {f.usageCount > 0 ? `${f.usageCount} ${f.usageCount === 1 ? 'use' : 'uses'}` : 'Unlimited'}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCheckout(f)}
                    disabled={isProcessing || hasCreditsRemaining || !paymentsEnabled}
                    className={hasCreditsRemaining ? BTN_OWNED : BTN_PRIMARY}
                  >
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : hasCreditsRemaining ? <CheckCircle2 size={16} /> : purchased ? <ArrowUpCircle size={16} /> : <ShoppingBag size={16} />}
                    {isProcessing ? 'Processing…' : hasCreditsRemaining ? 'You have this' : !paymentsEnabled ? 'Opening soon' : purchased ? 'Buy again' : 'Buy now'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PaymentTrust note="Instant activation" />
    </div>
  );
};

export default PayPerFeatures;
