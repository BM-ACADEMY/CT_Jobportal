import React, { useState } from 'react';
import {
  X, ShieldCheck, Tag, Zap, CreditCard, Loader2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const fmt = (n) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PayPerCheckoutModal = ({ feature, gstPercentage = 0, onClose, onProceed }) => {
  const options = (feature.pricingOptions && feature.pricingOptions.length === 3)
    ? feature.pricingOptions
    : [
        { quantity: 1, price: feature.cost },
        { quantity: 3, price: Math.round(feature.cost * 3 * 0.95) },
        { quantity: 12, price: Math.round(feature.cost * 12 * 0.80) }
      ];

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const selectedOption = options[selectedIdx];
  const quantity = selectedOption.quantity;
  const baseTotal = selectedOption.price;

  const originalCost = feature.cost * quantity;
  const discountAmount = Math.max(0, originalCost - baseTotal);
  const discountPercentage = originalCost > 0 ? Math.round((discountAmount / originalCost) * 100) : 0;

  const gstTotal     = Math.round(baseTotal * gstPercentage) / 100;
  const grandTotal   = baseTotal + gstTotal;

  const handleProceed = async () => {
    setProcessing(true);
    try {
      await onProceed(feature, quantity);
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
              <p className="text-sm font-bold text-slate-900">Pay-Per Feature Checkout</p>
              <p className="text-[10px] text-slate-400 font-medium">Select package option and review details</p>
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

          {/* Feature banner */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-900">{feature.name}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5 capitalize">
                Pay-Per-Feature Add-on
              </p>
            </div>
          </div>

          {/* 3 Purchase Options */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
              <Tag size={10} /> Choose Purchase Option
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {options.map((opt, idx) => {
                const isSelected = selectedIdx === idx;
                const optQty = opt.quantity;
                const optPrice = opt.price;
                const normCost = feature.cost * optQty;
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
                        {optQty} Pack{optQty > 1 ? 's' : ''}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-medium">
                        {optQty * feature.days} Days
                      </span>
                      <span className="block text-[9px] text-slate-400 font-medium italic">
                        {feature.usageCount > 0 ? `${optQty * feature.usageCount} Uses` : 'Unlimited'}
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

          {/* Price breakdown */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price Breakdown</p>
            </div>
            <div className="divide-y divide-slate-50">
              {/* Per-unit cost */}
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-xs font-medium text-slate-600">Feature Cost</span>
                  {quantity > 1 && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {fmt(feature.cost)} × {quantity}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-slate-900">{fmt(originalCost)}</span>
              </div>
              {/* Discount */}
              {discountAmount > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-rose-50/50">
                  <span className="text-xs font-semibold text-rose-600">
                    Option Discount <span className="font-bold">({discountPercentage}%)</span>
                  </span>
                  <span className="text-sm font-bold text-rose-600">
                    - {fmt(discountAmount)}
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
                  {quantity > 1 && (
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {fmt(grandTotal / quantity)}/pack avg
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold text-emerald-700">{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>

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

export default PayPerCheckoutModal;
