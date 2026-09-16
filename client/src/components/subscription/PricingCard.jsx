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

  const cardContent = (
    <div className={`p-6 bg-white flex flex-col justify-between h-full ${isPopular ? 'rounded-[22px]' : 'rounded-3xl border border-neutral-200 hover:shadow-lg transition-shadow bg-white'}`}>
      <div>
        <h3 className="text-neutral-700 text-sm mb-6 font-medium">{plan.name}</h3>
        <div className="flex items-baseline gap-1 mb-8">
          <span className="text-[28px] font-bold text-neutral-900">
            {plan.isCustomPrice ? 'Custom' : (isFree ? 'Free' : `₹${plan.price.toLocaleString()}`)}
          </span>
          {!isFree && (
            <span className="text-neutral-600 text-xs">/{plan.duration.toLowerCase()}</span>
          )}
        </div>

        {savePct && !isFree && (
          <div className="mb-6 -mt-4">
            <span className="inline-block text-[10px] font-semibold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
              Save {savePct}
            </span>
          </div>
        )}

        <ul className="space-y-4 mb-8">
          {features.map((feature, idx) => {
            const { enabled, displayValue } = resolveFeature(feature, plan);
            return (
              <li key={idx} className="flex items-center gap-3 text-sm text-neutral-600">
                {enabled ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-check text-neutral-600 shrink-0"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x text-neutral-300 shrink-0"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6M9 9l6 6"></path></svg>
                )}
                <span className={enabled ? '' : 'text-neutral-400 line-through'}>
                  {feature.label}
                  {enabled && displayValue !== null && displayValue !== true && (
                    <span className="font-semibold text-neutral-900 ml-1.5">
                      ({displayValue === 'Unlimited' ? 'Unlimited' : `${displayValue}${feature.unit ? ` ${feature.unit}` : ''}`})
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-2">
        {footer ?? (
          <>
            <button
              onClick={() => onAction?.(plan)}
              disabled={isCurrent}
              className={`w-full py-3 rounded-full cursor-pointer text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                isCurrent
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-gradient-to-r from-[#FF5804] to-[#FF8D28]/70 text-white hover:opacity-95 shadow-sm'
              }`}
            >
              {isCurrent ? (
                <span>Current Plan</span>
              ) : isFree ? (
                'Get started'
              ) : (
                <>
                  <Zap size={14} /> {actionLabel}
                </>
              )}
            </button>

            {isCurrent && !isFree && onCancel && (
              <button
                onClick={() => onCancel(plan)}
                className="w-full py-2 rounded-full cursor-pointer text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center gap-1 bg-transparent border-none"
              >
                <XCircle size={13} /> Cancel Plan
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (isPopular) {
    return (
      <div className="bg-gradient-to-r from-[#FF861C] to-[#FFDBC4] rounded-3xl p-1.5 shadow-xl hover:shadow-lg transition-shadow flex flex-col h-full">
        <p className="text-center text-orange-700 text-xs font-semibold py-1.5">Popular</p>
        <div className="flex-1 rounded-[22px] overflow-hidden">
          {cardContent}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {cardContent}
    </div>
  );
};

export default PricingCard;
