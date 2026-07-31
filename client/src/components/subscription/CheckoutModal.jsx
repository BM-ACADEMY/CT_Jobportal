import React, { useState, useEffect } from 'react';
import {
  X, ShieldCheck, Tag, Clock, Zap, CreditCard, Loader2,
  ChevronDown, RefreshCw, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const DURATION_ORDER = ['Monthly', 'Quarterly', 'Yearly', 'Lifetime'];

const fmt = (n) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getDurationLabel = (duration, qty) => {
  if (duration === 'Monthly') return qty === 1 ? '1 Month' : `${qty} Months`;
  if (duration === 'Quarterly') return qty === 1 ? '1 Quarter' : `${qty} Quarters`;
  if (duration === 'Yearly') return qty === 1 ? '1 Year' : `${qty} Years`;
  return qty === 1 ? `1 ${duration}` : `${qty} ${duration}s`;
};

const CheckoutModal = ({ plan: initialPlan, plans = [], gstPercentage = 0, onClose, onProceed }) => {
  const rolePlans = plans
    .filter(p => p.role === initialPlan.role && p.price > 0 && p.isActive)
    .sort((a, b) => {
      const ai = DURATION_ORDER.indexOf(a.duration);
      const bi = DURATION_ORDER.indexOf(b.duration);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan._id);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [autoRenew, setAutoRenew] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const selectedPlan = rolePlans.find(p => p._id === selectedPlanId) || initialPlan;
  const isLifetime = selectedPlan.duration === 'Lifetime';

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Reset selected option index to 0 whenever selected plan changes
  useEffect(() => { setSelectedIdx(0); }, [selectedPlanId]);

  const options = (selectedPlan.pricingOptions && selectedPlan.pricingOptions.length === 3)
    ? selectedPlan.pricingOptions
    : [
        { quantity: 1, price: selectedPlan.price },
        { quantity: 3, price: Math.round(selectedPlan.price * 3 * 0.95) },
        { quantity: 12, price: Math.round(selectedPlan.price * 12 * 0.80) }
      ];

  const selectedOption = options[selectedIdx];
  const quantity = isLifetime ? 1 : selectedOption.quantity;
  const baseTotal = isLifetime ? selectedPlan.price : selectedOption.price;

  const originalCost = selectedPlan.price * quantity;
  const bulkDiscountAmount = Math.max(0, originalCost - baseTotal);
  let finalBaseTotal = baseTotal;
  let couponDiscountAmount = 0;

  if (appliedCoupon) {
    couponDiscountAmount = Math.round(baseTotal * appliedCoupon.percentage) / 100;
    finalBaseTotal = baseTotal - couponDiscountAmount;
  }

  const discountPercentage = originalCost > 0 ? Math.round(((bulkDiscountAmount + couponDiscountAmount) / originalCost) * 100) : 0;

  const gstTotal     = Math.round(finalBaseTotal * gstPercentage) / 100;
  const grandTotal   = finalBaseTotal + gstTotal;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/coupons/validate`, { code: couponCode });
      setAppliedCoupon(res.data);
      toast.success('Coupon applied successfully');
    } catch (err) {
      setCouponError(err.response?.data?.msg || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleProceed = async () => {
    setProcessing(true);
    try {
      await onProceed(selectedPlan, quantity, autoRenew, appliedCoupon?.code);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[88vh] flex flex-col overflow-hidden my-auto border border-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ShieldCheck size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Order Summary</p>
              <p className="text-[10px] text-slate-400 font-medium">Review your plan before payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">

          {/* Plan banner */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-900">{selectedPlan.name}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5 capitalize">
                {selectedPlan.role === 'jobseeker'
                  ? 'Career Plan'
                  : selectedPlan.role === 'recruiter'
                  ? 'Recruiter Plan'
                  : 'Organization Plan'}
              </p>
            </div>
          </div>

          {/* Billing Cycle Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Clock size={10} /> Choose Plan Cycle
            </label>
            <div className="relative">
              <select
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 cursor-pointer"
              >
                {rolePlans.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.duration} · ₹{p.price.toLocaleString('en-IN')} / base
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* 3 Duration Options (not shown for Lifetime) */}
          {!isLifetime && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                <Tag size={10} /> Choose Duration
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {options.map((opt, idx) => {
                  const isSelected = selectedIdx === idx;
                  const optQty = opt.quantity;
                  const optPrice = opt.price;
                  const normCost = selectedPlan.price * optQty;
                  const optDiscount = normCost > 0 ? Math.round(((normCost - optPrice) / normCost) * 100) : 0;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedIdx(idx)}
                      className={`flex flex-col items-center justify-between p-3.5 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500'
                          : 'border-slate-100 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className={`block text-xs font-black uppercase tracking-tight ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {getDurationLabel(selectedPlan.duration, optQty)}
                        </span>
                      </div>

                      <div className="mt-3.5 space-y-1">
                        <span className={`block text-xs font-extrabold ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                          ₹{optPrice}
                        </span>
                        {optDiscount > 0 && (
                          <span className="inline-block text-[8px] font-black text-emerald-600 bg-emerald-100/70 px-1 py-0.5 rounded-md">
                            Save {optDiscount}%
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price breakdown */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price Breakdown</p>
            </div>
            <div className="divide-y divide-slate-50">
              {/* Per-unit cost */}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-xs font-medium text-slate-600">Plan Cost</span>
                  {quantity > 1 && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {fmt(selectedPlan.price)} × {quantity}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900">{fmt(originalCost)}</span>
              </div>
              {/* Bulk Discount */}
              {bulkDiscountAmount > 0 && !isLifetime && (
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                  <span className="text-xs font-medium text-slate-600">
                    Bulk Discount
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    - {fmt(bulkDiscountAmount)}
                  </span>
                </div>
              )}
              {/* Coupon Discount */}
              {appliedCoupon && (
                <div className="flex items-center justify-between px-4 py-3 bg-amber-50">
                  <span className="text-xs font-semibold text-amber-700">
                    Coupon ({appliedCoupon.code}) <span className="font-bold">-{appliedCoupon.percentage}%</span>
                  </span>
                  <span className="text-sm font-bold text-amber-700">
                    - {fmt(couponDiscountAmount)}
                  </span>
                </div>
              )}
              {/* GST */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-medium text-slate-600">
                  GST <span className="text-slate-400">({gstPercentage}%)</span>
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {gstPercentage > 0
                    ? `+ ${fmt(gstTotal)}`
                    : <span className="text-slate-400">—</span>}
                </span>
              </div>
              {/* Total */}
              <div className="flex items-center justify-between px-4 py-3.5 bg-emerald-50/60">
                <div>
                  <span className="text-sm font-bold text-slate-800">Total Payable</span>
                  {quantity > 1 && !isLifetime && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {fmt(grandTotal / quantity)}/period avg
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold text-emerald-700">{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Coupon Input */}
          <div className="rounded-xl border border-slate-100 p-3.5 bg-slate-50/60">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Tag size={10} /> Have a Coupon?
            </p>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1"><Check size={12}/> {appliedCoupon.code} Applied</span>
                <button onClick={handleRemoveCoupon} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <Button 
                  onClick={handleApplyCoupon} 
                  disabled={!couponCode || validatingCoupon}
                  className="h-[34px] px-4 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded-lg"
                >
                  {validatingCoupon ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
                </Button>
              </div>
            )}
            {couponError && <p className="text-[10px] text-red-500 font-bold mt-1">{couponError}</p>}
          </div>

          {/* Auto-pay checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition-colors group select-none">
            <div
              onClick={() => setAutoRenew(v => !v)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                autoRenew
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-white border-slate-300 group-hover:border-slate-400'
              }`}
            >
              {autoRenew && <Check size={11} strokeWidth={3} className="text-white" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RefreshCw size={11} className={autoRenew ? 'text-emerald-500' : 'text-slate-400'} />
                Enable Auto-Pay
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                Automatically renew your subscription before it expires. You can turn this off anytime.
              </p>
            </div>
          </label>

          {/* Terms and conditions checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition-colors group select-none mt-2">
            <div
              onClick={(e) => { e.preventDefault(); setTermsAccepted(v => !v); }}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                termsAccepted
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'bg-white border-slate-300 group-hover:border-slate-400'
              }`}
            >
              {termsAccepted && <Check size={11} strokeWidth={3} className="text-white" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-emerald-600 hover:underline">Terms and Conditions</a>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                By checking this, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </label>

        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 space-y-2">
          <Button
            onClick={handleProceed}
            disabled={processing || !termsAccepted}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:scale-100"
          >
            {processing
              ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
              : <><CreditCard size={16} /> Proceed to Payment &mdash; {fmt(grandTotal)}</>
            }
          </Button>
          <button
            onClick={onClose}
            disabled={processing}
            className="w-full h-8 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
