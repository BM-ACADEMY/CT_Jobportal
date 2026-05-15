import React, { useState, useEffect } from 'react';
import {
  X, ShieldCheck, Tag, Clock, Zap, CreditCard, Loader2,
  ChevronDown, RefreshCw, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const DURATION_ORDER = ['Monthly', 'Quarterly', 'Yearly', 'Lifetime'];

const getQuantityOptions = (duration) => {
  switch (duration) {
    case 'Monthly':
      return Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: i === 0 ? '1 Month' : `${i + 1} Months`,
      }));
    case 'Quarterly':
      return Array.from({ length: 4 }, (_, i) => ({
        value: i + 1,
        label: i === 0 ? '1 Quarter (3 months)' : `${i + 1} Quarters (${(i + 1) * 3} months)`,
      }));
    case 'Yearly':
      return Array.from({ length: 5 }, (_, i) => ({
        value: i + 1,
        label: i === 0 ? '1 Year' : `${i + 1} Years`,
      }));
    default:
      return [{ value: 1, label: duration || '1 Period' }];
  }
};

const fmt = (n) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CheckoutModal = ({ plan: initialPlan, plans = [], gstPercentage = 0, onClose, onProceed }) => {
  const rolePlans = plans
    .filter(p => p.role === initialPlan.role && p.price > 0 && p.isActive)
    .sort((a, b) => {
      const ai = DURATION_ORDER.indexOf(a.duration);
      const bi = DURATION_ORDER.indexOf(b.duration);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const [selectedPlanId, setSelectedPlanId] = useState(initialPlan._id);
  const [quantity, setQuantity] = useState(1);
  const [autoRenew, setAutoRenew] = useState(true);
  const [processing, setProcessing] = useState(false);

  const selectedPlan = rolePlans.find(p => p._id === selectedPlanId) || initialPlan;
  const isLifetime = selectedPlan.duration === 'Lifetime';
  const quantityOptions = getQuantityOptions(selectedPlan.duration);

  // Reset quantity to 1 whenever the selected plan changes
  useEffect(() => { setQuantity(1); }, [selectedPlanId]);

  const basePerUnit  = selectedPlan.price;
  const baseTotal    = basePerUnit * quantity;
  const gstTotal     = Math.round(baseTotal * gstPercentage) / 100;
  const grandTotal   = baseTotal + gstTotal;

  const handleProceed = async () => {
    setProcessing(true);
    try {
      await onProceed(selectedPlan, quantity, autoRenew);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
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

        <div className="px-6 py-5 space-y-4">

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

          {/* Two selectors side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Billing cycle selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock size={10} /> Billing Cycle
              </label>
              <div className="relative">
                <select
                  value={selectedPlanId}
                  onChange={e => setSelectedPlanId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 cursor-pointer"
                >
                  {rolePlans.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.duration} · ₹{p.price.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Quantity / period multiplier */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Tag size={10} /> Duration
              </label>
              {isLifetime ? (
                <div className="h-10 rounded-xl border border-slate-100 bg-slate-50 flex items-center px-3">
                  <span className="text-xs font-bold text-slate-500">Lifetime</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 cursor-pointer"
                  >
                    {quantityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              )}
            </div>
          </div>

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
                      {fmt(basePerUnit)} × {quantity} {selectedPlan.duration === 'Monthly' ? 'months' : selectedPlan.duration === 'Quarterly' ? 'quarters' : 'years'}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900">{fmt(baseTotal)}</span>
              </div>
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

        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          <Button
            onClick={handleProceed}
            disabled={processing}
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:scale-100"
          >
            {processing
              ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
              : <><CreditCard size={16} /> Proceed to Payment &mdash; {fmt(grandTotal)}</>
            }
          </Button>
          <button
            onClick={onClose}
            disabled={processing}
            className="w-full h-9 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
