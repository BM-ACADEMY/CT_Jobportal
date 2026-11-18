import React from 'react';
import { Check, X, ArrowRight, XCircle } from 'lucide-react';

const NUMERIC_KEYS = new Set([
  'resumeBuilderCount', 'careerCounsellingCount', 'teamCollaborationCount', 'aiResumeReviewCount',
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
      aiResumeReviewCount: 'hasAiResumeReview',
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

// Layout: a tinted "price panel" at the top (name, price, GST, button) and the feature list
// below, included features first. Brand: logo green #34B678, navy #10213D. The popular
// card swaps the panel to navy.
const PricingCard = ({
  plan,
  features = [],
  onAction,
  onCancel,
  actionLabel = 'Choose Plan',
  isPopular = false,
  currentPlanId = null,
  footer = null,
  gstPercentage = 0,
  paymentsEnabled = true,
}) => {
  const isCurrent = currentPlanId === plan._id;
  const isFree = plan.price === 0;
  // Paid plans cannot be bought until the payment gateway is live (server switch PAYMENTS_ENABLED).
  const paymentsClosed = !isFree && !paymentsEnabled && !isCurrent;
  // The GST line is shown whenever tax applies so the card price never differs from the checkout total by surprise.
  const showGst = !isFree && !plan.isCustomPrice && Number(gstPercentage) > 0;
  const dark = isPopular;

  const rows = features.map((feature) => ({ feature, ...resolveFeature(feature, plan) }));
  const included = rows.filter((r) => r.enabled);
  const excluded = rows.filter((r) => !r.enabled);

  const disabled = isCurrent || paymentsClosed;
  const buttonCls = disabled
    ? (dark ? 'bg-white/10 text-white/50 cursor-not-allowed' : 'bg-zinc-200/70 text-zinc-500 cursor-not-allowed')
    : isFree
      ? (dark ? 'bg-white text-[#10213D] hover:bg-white/90' : 'bg-[#10213D] text-white hover:bg-[#0b1830]')
      : 'bg-[#34B678] text-white hover:bg-[#2ca66b] shadow-lg shadow-[#34B678]/30';

  return (
    <div
      className={`group relative flex flex-col h-full rounded-[1.75rem] bg-white p-2 transition duration-300 hover:-translate-y-1 ${
        isCurrent ? 'ring-2 ring-[#34B678]' : dark ? 'ring-2 ring-[#10213D]' : 'ring-1 ring-zinc-200 hover:ring-[#34B678]/50'
      } shadow-[0_24px_60px_-34px_rgba(16,33,61,0.35)]`}
    >
      {/* Price panel */}
      <div className={`relative overflow-hidden rounded-[1.4rem] p-6 ${dark ? 'bg-[#10213D] text-white' : 'bg-[#f4faf7]'}`}>
        <svg className="absolute -right-16 -top-16 w-48 h-48 pointer-events-none" viewBox="0 0 200 200" fill="none" aria-hidden="true">
          {[40, 60, 80, 100].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} stroke={dark ? '#34B678' : '#34B678'} strokeOpacity={dark ? 0.25 : 0.18} />
          ))}
        </svg>

        <div className="relative flex items-center justify-between gap-3">
          <h3 className={`text-base font-bold m-0 ${dark ? 'text-white' : 'text-[#10213D]'}`}>{plan.name}</h3>
          {isCurrent ? (
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#34B678]">Your plan</span>
          ) : isPopular ? (
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#34B678]">Most popular</span>
          ) : null}
        </div>

        <div className="relative mt-4 flex items-end gap-1.5">
          <span className={`text-[2.75rem] leading-none font-bold tracking-tight ${dark ? 'text-white' : 'text-[#10213D]'}`}>
            {plan.isCustomPrice ? 'Custom' : (isFree ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`)}
          </span>
          {!isFree && !plan.isCustomPrice && (
            <span className={`mb-1 text-sm font-semibold ${dark ? 'text-white/60' : 'text-zinc-500'}`}>/ {plan.duration.toLowerCase()}</span>
          )}
        </div>
        <p className={`relative mt-2 text-xs font-medium m-0 min-h-[1rem] ${dark ? 'text-white/60' : 'text-zinc-500'}`}>
          {showGst
            ? `+ ${Number(gstPercentage)}% GST · ₹${Math.round(plan.price * (1 + Number(gstPercentage) / 100)).toLocaleString('en-IN')} total`
            : isFree ? 'Free forever · no card needed' : ''}
        </p>

        <div className="relative mt-5 space-y-2">
          {footer ?? (
            <>
              <button
                onClick={() => onAction?.(plan)}
                disabled={disabled}
                aria-disabled={disabled}
                className={`w-full h-12 rounded-xl cursor-pointer text-sm font-bold transition flex items-center justify-center gap-2 border-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#34B678]/30 ${buttonCls}`}
              >
                {isCurrent ? 'Current plan' : paymentsClosed ? 'Opening soon' : isFree ? 'Get started free' : actionLabel}
                {!disabled && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}
              </button>

              {isCurrent && !isFree && onCancel && (
                <button
                  onClick={() => onCancel(plan)}
                  className={`w-full py-2 rounded-xl cursor-pointer text-xs font-semibold transition flex items-center justify-center gap-2 bg-transparent border-none ${
                    dark ? 'text-white/50 hover:text-rose-300 hover:bg-rose-500/10' : 'text-zinc-500 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <XCircle size={13} /> Cancel subscription
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 px-5 pt-6 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 m-0 mb-4">What's included</p>
        <ul className="space-y-3 p-0 m-0 list-none">
          {included.map(({ feature, displayValue }, idx) => (
            <li key={`in-${idx}`} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-[#34B678] text-white flex items-center justify-center shrink-0">
                <Check size={12} strokeWidth={3.5} />
              </span>
              <span className="text-zinc-700 font-medium">
                {feature.label}
                {displayValue !== null && displayValue !== true && (
                  <span className="ml-1.5 font-bold text-[#10213D]">
                    ({displayValue === 'Unlimited' ? 'Unlimited' : `${displayValue}${feature.unit ? ` ${feature.unit}` : ''}`})
                  </span>
                )}
              </span>
            </li>
          ))}
          {excluded.map(({ feature }, idx) => (
            <li key={`out-${idx}`} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-zinc-100 text-zinc-300 flex items-center justify-center shrink-0">
                <X size={12} strokeWidth={3} />
              </span>
              <span className="text-zinc-400">{feature.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PricingCard;
