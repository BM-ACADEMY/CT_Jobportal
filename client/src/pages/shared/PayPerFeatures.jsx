import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Loader2, Zap, CheckCircle2, Clock, ShoppingBag, Download, XCircle, ArrowUpCircle } from 'lucide-react';
import { Card, Typography, Tag, Button, Modal } from 'antd';
import PayPerCheckoutModal from '../../components/subscription/PayPerCheckoutModal';

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
  const [payments, setPayments] = useState([]);
  const [gstPercentage, setGstPercentage] = useState(0);
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
    if (!user) {
      toast.error('Please log in to purchase features');
      return;
    }
    setCheckoutFeature(feature);
  };

  const handlePurchase = async (feature, quantity = 1) => {
    setProcessingId(feature._id);
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
            setProcessingId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingId(null);
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#10b981' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setProcessingId(null);
      });
      rzp.open();
    } catch (err) {
      console.error('Purchase error:', err);
      toast.error(err.response?.data?.msg || 'Failed to initiate purchase');
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-400 font-semibold text-sm">Loading available features...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 pt-4 px-4">
      {checkoutFeature && (
        <PayPerCheckoutModal
          feature={checkoutFeature}
          gstPercentage={gstPercentage}
          onClose={() => setCheckoutFeature(null)}
          onProceed={handlePurchase}
        />
      )}
      
      <Modal
        title={<span className="font-bold text-slate-900 text-lg">{descriptionModal?.name}</span>}
        open={!!descriptionModal}
        onCancel={() => setDescriptionModal(null)}
        footer={null}
        centered
      >
        <div className="pt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
          {descriptionModal?.description}
        </div>
      </Modal>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ShoppingBag size={24} className="text-emerald-600" />
            <Title level={2} className="m-0 font-black text-slate-900 tracking-tight">Pay-Per Features</Title>
          </div>
          <Text className="text-slate-500 font-medium">Buy individual features without a full subscription. Pay only for what you need.</Text>
        </div>
      </div>

      {features.length === 0 ? (
        <Card bordered={false} className="text-center py-20 rounded-none border border-dashed border-slate-200 shadow-none bg-slate-50">
          <Zap size={32} className="text-slate-300 mx-auto mb-4" />
          <Title level={4} className="m-0 text-slate-500">No features available for your role right now.</Title>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                bodyStyle={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}
                className="relative overflow-hidden rounded-none border border-slate-200 shadow-sm hover:shadow-md transition-all group bg-white h-full flex flex-col"
              >
                
                <div className="pb-4 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full flex items-center justify-center text-emerald-600 shadow-sm">
                      <Sparkles size={20} />
                    </div>
                    {purchased ? (
                      <div className="flex flex-col items-end gap-1.5">
                        {hasCreditsRemaining ? (
                          <Tag bordered={false} className="m-0 bg-emerald-100 text-emerald-700 text-[10px] font-medium px-2 py-0.5 flex items-center gap-1 rounded">
                            <CheckCircle2 size={10} /> Active
                          </Tag>
                        ) : (
                          <Tag bordered={false} className="m-0 bg-amber-100 text-amber-700 text-[10px] font-medium px-2 py-0.5 flex items-center gap-1 rounded">
                            <ArrowUpCircle size={10} /> 0 Left
                          </Tag>
                        )}
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{f.days} Days Validity</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock size={12} />
                        <span className="text-[10px] font-medium uppercase tracking-widest">{f.days} Days</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-medium text-slate-800 leading-tight mb-2 mt-0 tracking-tight">{f.name}</h3>
                  
                  <div>
                    <p className="text-slate-500 font-medium text-xs mt-0 mb-1 line-clamp-2 min-h-[32px] leading-relaxed">
                      {f.description || 'Enhance your experience with this premium feature.'}
                    </p>
                    {f.description && f.description.length > 80 && (
                      <button 
                        onClick={() => setDescriptionModal(f)} 
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold bg-transparent border-none p-0 cursor-pointer"
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
                      <span className="text-3xl font-semibold text-slate-800 tracking-tight">₹{f.cost}</span>
                      <span className="text-[11px] text-slate-400 font-medium ml-1 uppercase tracking-widest">+ GST</span>
                    </div>
                    {purchased && userPurchase ? (
                      f.usageCount > 0 ? (
                        <Tag bordered={false} className={`m-0 text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded ${userPurchase.usageLeft > 0 ? 'text-slate-600 bg-slate-100' : 'text-rose-600 bg-rose-50'}`}>
                          {userPurchase.usageLeft} Use{userPurchase.usageLeft !== 1 ? 's' : ''} Left
                        </Tag>
                      ) : (
                        <Tag bordered={false} className="m-0 text-[10px] font-medium uppercase tracking-widest text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                          Unlimited
                        </Tag>
                      )
                    ) : (
                      <>
                        {f.usageCount > 0 && (
                          <Tag bordered={false} className="m-0 text-[10px] font-medium uppercase tracking-widest text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                            {f.usageCount} Use{f.usageCount > 1 ? 's' : ''}
                          </Tag>
                        )}
                        {f.usageCount === 0 && (
                          <Tag bordered={false} className="m-0 text-[10px] font-medium uppercase tracking-widest text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
                            Unlimited
                          </Tag>
                        )}
                      </>
                    )}
                  </div>

                  {/* Purchased Details */}
                  {purchased && userPurchase && (
                    <div className="mb-6 bg-slate-50 border border-slate-100 rounded-sm p-4 space-y-3 text-xs font-medium text-slate-600">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100/55">
                        <span className="text-slate-400 font-medium text-[10px] uppercase tracking-widest">Days Left:</span>
                        <span className="text-slate-800 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                          {Math.max(0, Math.ceil((new Date(userPurchase.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))} Days Left
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium text-[10px] uppercase tracking-widest">Purchased On:</span>
                        <span className="text-slate-600 font-medium">
                          {new Date(userPurchase.purchasedAt || (new Date(userPurchase.expiresAt).getTime() - f.days * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between pb-2 border-b border-slate-100/55">
                        <span className="text-slate-400 font-medium text-[10px] uppercase tracking-widest">Expires On:</span>
                        <span className="text-slate-600 font-medium">
                          {new Date(userPurchase.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {/* Invoice Button */}
                      {payments.find(p => p.status === 'completed' && p.paymentType === 'pay-per-feature' && p.payPerFeature?._id?.toString() === f._id?.toString()) && (
                        <Button
                          onClick={() => downloadInvoice(payments.find(p => p.status === 'completed' && p.paymentType === 'pay-per-feature' && p.payPerFeature?._id?.toString() === f._id?.toString()), user)}
                          type="dashed"
                          size="small"
                          className="w-full mt-2 rounded border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 font-bold uppercase tracking-widest text-[10px]"
                          icon={<Download size={12} />}
                        >
                          Download Invoice
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Preview Details */}
                  {!purchased && (
                    <div className="mb-6 bg-slate-50/70 border border-slate-100 rounded p-3 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium text-[10px] uppercase tracking-widest">Validity Duration:</span>
                        <span className="text-slate-700 font-semibold text-[11px]">{f.days} Days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium text-[10px] uppercase tracking-widest">Usage Limit:</span>
                        <span className="text-slate-700 font-semibold text-[11px]">
                          {f.usageCount > 0 ? `${f.usageCount} Uses` : 'Unlimited'}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => handleCheckout(f)}
                    disabled={isProcessing || hasCreditsRemaining}
                    icon={isProcessing ? <Loader2 size={16} className="animate-spin" /> : hasCreditsRemaining ? <CheckCircle2 size={16} /> : purchased ? <ArrowUpCircle size={16} /> : <ShoppingBag size={16} />}
                    className={`w-full h-11 flex items-center justify-center gap-2 rounded font-medium text-xs uppercase tracking-widest transition-all shadow-none ${
                      hasCreditsRemaining
                        ? '!bg-emerald-50 !text-emerald-700 hover:!bg-emerald-50 hover:!text-emerald-700 cursor-default border border-emerald-200'
                        : '!bg-emerald-600 hover:!bg-emerald-700 !text-white border-transparent'
                    }`}
                  >
                    {isProcessing ? 'Processing...' : hasCreditsRemaining ? 'Already Purchased' : purchased ? 'Upgrade / Buy Again' : 'Buy Now'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="text-center mt-12">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.4em]">
          Secure Payments via Razorpay &bull; Instant Activation
        </p>
      </div>
    </div>
  );
};

export default PayPerFeatures;
