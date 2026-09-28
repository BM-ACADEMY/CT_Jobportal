import React from 'react';
import { Check, X, Star, Zap, Infinity, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

const NUMERIC_KEYS = new Set([
  'resumeBuilderCount', 'careerCounsellingCount', 'teamCollaborationCount',
  'activeJobPostings', 'candidateSearchPerDay', 'userSeats',
]);
const STRING_ENUM_KEYS = new Set(['jobAlerts', 'companyProfileType']);

const resolveFeature = (feature, plan) => {
  if (feature.isDynamic) {
    let displayValue = feature.value ?? null;
    if (feature.type === 'count' && (displayValue === 0 || displayValue === '0')) {
      displayValue = 'Unlimited';
    }
    return { enabled: !!feature.isActive, displayValue };
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
    const PARENT_BOOLEAN_KEYS = {
      careerCounsellingCount: 'hasCareerCounselling',
      resumeBuilderCount: 'hasResumeBuilder',
      messageRecruitersCount: 'hasMessageRecruiters'
    };
    
    const parentKey = PARENT_BOOLEAN_KEYS[key];
    if (parentKey && !plan[parentKey]) {
      return { enabled: false, displayValue: null };
    }

    const num = Number(rawVal);
    if (num === 0) {
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
  onCancel,
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
    <div className={`relative flex flex-col h-full transition-all duration-500 ${isPopular ? 'scale-105 z-10' : 'hover:-translate-y-2'}`}>
      
      {isPopular && (
        <div className="absolute -top-4 inset-x-0 flex justify-center z-20">
          <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 text-[10px] font-black uppercase tracking-[2px] px-4 py-1.5 rounded-none shadow-lg shadow-emerald-500/30">
            Most Popular
          </div>
        </div>
      )}

      <div className={`flex flex-col flex-1 p-8 rounded-none border ${
        isPopular 
          ? 'bg-slate-900 border-slate-700 shadow-[0_0_40px_rgba(52,182,120,0.15)] relative overflow-hidden group' 
          : 'bg-white border-slate-200 hover:border-emerald-500/30 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]'
      }`}>
        
        {isPopular && (
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full transition-all duration-700 group-hover:bg-emerald-500/20" />
        )}

        <div className="relative z-10">
          <h3 className={`text-xs font-black uppercase tracking-[2px] mb-6 ${isPopular ? 'text-emerald-400' : 'text-slate-500'}`}>
            {plan.name}
          </h3>
          
          <div className="flex items-baseline gap-1 mb-8">
            <span className={`text-4xl font-black tracking-tight ${isPopular ? 'text-white' : 'text-slate-900'}`}>
              {plan.isCustomPrice ? 'Custom' : (isFree ? 'Free' : `₹${plan.price.toLocaleString()}`)}
            </span>
            {!isFree && (
              <span className={`text-xs font-bold ${isPopular ? 'text-slate-400' : 'text-slate-400'}`}>
                /{plan.duration.toLowerCase()}
              </span>
            )}
          </div>

          {savePct && !isFree && (
            <div className="mb-8 -mt-4">
              <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-none border ${
                isPopular 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                Save {savePct}
              </span>
            </div>
          )}

          <div className={`h-px w-full mb-8 ${isPopular ? 'bg-slate-800' : 'bg-slate-100'}`} />

          <ul className="space-y-4 mb-10">
            {features.map((feature, idx) => {
              const { enabled, displayValue } = resolveFeature(feature, plan);
              return (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  {enabled ? (
                    <div className={`mt-0.5 w-5 h-5 flex items-center justify-center shrink-0 ${isPopular ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-500'}`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : (
                    <div className={`mt-0.5 w-5 h-5 flex items-center justify-center shrink-0 ${isPopular ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-300'}`}>
                      <X size={14} strokeWidth={3} />
                    </div>
                  )}
                  
                  <span className={`${enabled ? (isPopular ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium') : (isPopular ? 'text-slate-600 line-through' : 'text-slate-400 line-through')}`}>
                    {feature.label}
                    {enabled && displayValue !== null && displayValue !== true && (
                      <span className={`ml-1.5 ${isPopular ? 'text-white font-bold' : 'text-slate-900 font-bold'}`}>
                        ({displayValue === 'Unlimited' ? 'Unlimited' : `${displayValue}${feature.unit ? ` ${feature.unit}` : ''}`})
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-auto relative z-10 space-y-3">
          {footer ?? (
            <>
              <button
                onClick={() => onAction?.(plan)}
                disabled={isCurrent}
                className={`w-full h-12 rounded-none cursor-pointer text-xs font-black uppercase tracking-[1.5px] transition-all duration-300 flex items-center justify-center gap-2 border-none ${
                  isCurrent
                    ? (isPopular ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')
                    : (isPopular 
                        ? 'bg-emerald-500 text-slate-900 hover:bg-emerald-400 shadow-[0_0_20px_rgba(52,182,120,0.3)] hover:shadow-[0_0_30px_rgba(52,182,120,0.5)]' 
                        : 'bg-slate-900 text-white hover:bg-emerald-500 shadow-sm')
                }`}
              >
                {isCurrent ? (
                  'Current Plan'
                ) : isFree ? (
                  'Get started'
                ) : (
                  <>
                    <Zap size={14} className={isPopular ? 'text-slate-900' : 'text-emerald-400'} fill="currentColor" /> 
                    {actionLabel}
                  </>
                )}
              </button>

              {isCurrent && !isFree && onCancel && (
                <button
                  onClick={() => onCancel(plan)}
                  className={`w-full py-3 rounded-none cursor-pointer text-[10px] font-bold uppercase tracking-[1px] transition-all flex items-center justify-center gap-2 bg-transparent border-none ${
                    isPopular ? 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <XCircle size={13} /> Cancel Subscription
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
