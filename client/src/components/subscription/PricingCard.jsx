import React from 'react';
import { Check, X, Star, Zap, Infinity } from 'lucide-react';
import { Button } from "@/components/ui/button";

const NUMERIC_KEYS = new Set([
  'resumeBuilderCount', 'careerCounsellingCount', 'teamCollaborationCount',
  'activeJobPostings', 'candidateSearchPerDay', 'userSeats',
]);
const UNLIMITED_ZERO_KEYS = new Set(['activeJobPostings', 'candidateSearchPerDay']);
const STRING_ENUM_KEYS = new Set(['jobAlerts', 'companyProfileType']);

const resolveFeature = (feature, plan) => {
  if (feature.isDynamic) {
    return { enabled: !!feature.isActive, displayValue: feature.value ?? null };
  }

  const key = feature.key;
  const rawVal = plan[key];

  if (STRING_ENUM_KEYS.has(key)) {
    const disabled = rawVal === 'None' || !rawVal;
    return { enabled: !disabled, displayValue: disabled ? null : rawVal };
  }

  if (key?.startsWith('has')) {
    return { enabled: !!rawVal, displayValue: null };
  }

  if (NUMERIC_KEYS.has(key)) {
    const num = Number(rawVal);
    if (UNLIMITED_ZERO_KEYS.has(key) && num === 0) {
      return { enabled: true, displayValue: 'Unlimited' };
    }
    return { enabled: num > 0, displayValue: num > 0 ? num : null };
  }

  return { enabled: !!rawVal, displayValue: null };
};

const PricingCard = ({
  plan,
  features = [],
  onAction,
  actionLabel = 'Choose Plan',
  isPopular = false,
  currentPlanId = null,
  footer = null,
}) => {
  const isCurrent = currentPlanId === plan._id;
  const isFree = plan.price === 0;

  const savePct =
    plan.duration === 'Yearly' ? '40%' :
    plan.duration === 'Quarterly' ? '20%' : null;

  return (
    <div className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${
      isPopular
        ? 'border-emerald-300 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-200'
        : isCurrent
          ? 'border-blue-200 shadow-lg shadow-blue-500/5 ring-1 ring-blue-100'
          : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
    }`}>

      {/* Popular ribbon */}
      {isPopular && (
        <div className="absolute top-0 right-0">
          <div className="bg-emerald-500 text-slate-900 text-[9px] font-black uppercase tracking-widest px-5 py-1.5 rounded-bl-xl flex items-center gap-1.5">
            <Star size={9} fill="currentColor" /> Most Popular
          </div>
        </div>
      )}

      {/* Current plan ribbon */}
      {isCurrent && !isPopular && (
        <div className="absolute top-0 right-0">
          <div className="bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-5 py-1.5 rounded-bl-xl">
            Current Plan
          </div>
        </div>
      )}

      <div className={`p-6 border-b ${isPopular ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className={`text-lg font-bold mb-0.5 ${isPopular ? 'text-emerald-800' : 'text-slate-900'}`}>
              {plan.name}
            </h3>
            <p className="text-xs text-slate-400 font-medium capitalize">
              {plan.role === 'jobseeker' ? 'Career' : plan.role === 'recruiter' ? 'Recruiter' : 'Organization'} plan
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                {isFree ? 'Free' : `₹${plan.price.toLocaleString()}`}
              </span>
              {!isFree && (
                <span className="text-xs font-semibold text-slate-400">/{plan.duration.toLowerCase()}</span>
              )}
            </div>
            {savePct && !isFree && (
              <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                Save {savePct}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-white">
        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-7">
          {features.map((feature, idx) => {
            const { enabled, displayValue } = resolveFeature(feature, plan);
            return (
              <div key={idx} className={`flex items-start gap-3 ${enabled ? 'opacity-100' : 'opacity-35'}`}>
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {enabled
                    ? <Check size={11} strokeWidth={3} />
                    : <X size={11} strokeWidth={3} />}
                </div>
                <div className="min-w-0">
                  <span className={`text-[12px] font-semibold leading-tight ${enabled ? 'text-slate-700' : 'text-slate-400'}`}>
                    {feature.label}
                  </span>
                  {enabled && displayValue !== null && displayValue !== true && (
                    <span className="block text-[11px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                      {displayValue === 'Unlimited' ? <><Infinity size={12} /> Unlimited</> : `${displayValue}${feature.unit ? ` ${feature.unit}` : ''}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action */}
        {footer ?? (
          <Button
            onClick={() => onAction?.(plan)}
            disabled={isCurrent}
            className={`w-full h-12 rounded-xl font-bold text-sm transition-all duration-200 ${
              isCurrent
                ? 'bg-blue-50 text-blue-600 border border-blue-200 cursor-default hover:bg-blue-50'
                : isPopular
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02]'
                  : 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.02]'
            }`}
          >
            {isCurrent ? (
              <span className="flex items-center gap-2"><Check size={16} /> Active Plan</span>
            ) : isFree ? (
              'Get Started Free'
            ) : (
              <span className="flex items-center gap-2"><Zap size={15} /> {actionLabel}</span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default PricingCard;
