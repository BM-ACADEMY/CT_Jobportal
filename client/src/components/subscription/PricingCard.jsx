import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, Zap, Star, Shield, Trophy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PricingCard = ({ plan, features, onAction, actionLabel = "Choose Plan", isPopular = false, currentPlanId = null, footer = null }) => {
  const [expanded, setExpanded] = useState(false);
  const isCurrent = currentPlanId === plan._id;

  // Split features into visible and hidden
  const visibleFeaturesCount = 5;
  const visibleFeatures = features.slice(0, visibleFeaturesCount);
  const hiddenFeatures = features.slice(visibleFeaturesCount);

  return (
    <div className={`relative flex flex-col lg:flex-row items-center gap-8 p-8 lg:p-10 rounded-[32px] border-2 transition-all duration-500 bg-white group ${
      isPopular 
        ? 'border-[#0f172a] shadow-2xl scale-[1.02] z-10' 
        : 'border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md'
    }`}>
      
      {isPopular && (
        <div className="absolute -top-4 left-10">
          <Badge className="bg-[#0f172a] text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border-none flex items-center gap-2">
            <Star size={12} fill="currentColor" /> Most Popular
          </Badge>
        </div>
      )}

      {/* 1. Brand & Price Section */}
      <div className="w-full lg:w-[30%] space-y-6">
        <div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-emerald-600 transition-colors">
            {plan.name}
          </h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
            Everything you need for your {plan.role === 'jobseeker' ? 'career' : 'business'}.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">₹{plan.price.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">/{plan.duration.toLowerCase()}</span>
          </div>
          {plan.price > 0 && (
             <div className="mt-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase tracking-widest py-1 px-3 rounded-lg">
                   Save {(plan.duration === 'Yearly' ? '40%' : (plan.duration === 'Quarterly' ? '25%' : '20%'))}
                </Badge>
             </div>
          )}
        </div>
      </div>

      <div className="hidden lg:block w-px h-24 bg-slate-100" />

      {/* 2. Features Grid - Responsive and attractive */}
      <div className="flex-grow w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
          {features.slice(0, 6).map((feature, idx) => (
            <FeatureItem key={idx} feature={feature} plan={plan} />
          ))}
        </div>
        
        {features.length > 6 && !expanded && (
           <button 
             type="button"
             onClick={() => setExpanded(true)}
             className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 mt-6 flex items-center gap-2"
           >
             <ChevronDown size={14} /> + {features.length - 6} more exclusive perks
           </button>
        )}

        {expanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
             {features.slice(6).map((feature, idx) => (
               <FeatureItem key={idx + 6} feature={feature} plan={plan} />
             ))}
             <button 
               type="button"
               onClick={() => setExpanded(false)}
               className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 mt-4 flex items-center gap-2 col-span-full"
             >
               <ChevronUp size={14} /> Show Less
             </button>
          </div>
        )}
      </div>

      <div className="hidden lg:block w-px h-24 bg-slate-100" />

      {/* 3. Action Section */}
      <div className="w-full lg:w-[20%] flex flex-col justify-center">
        {footer ? footer : (
          <Button 
            onClick={() => onAction && onAction(plan)}
            disabled={isCurrent}
            className={`w-full h-16 rounded-[20px] font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 ${
              isPopular 
                ? 'bg-[#0f172a] hover:bg-slate-800 text-white shadow-xl shadow-slate-200 active:scale-[0.95]' 
                : 'bg-white border-2 border-slate-100 text-slate-600 hover:border-slate-200 hover:bg-slate-50 shadow-sm active:scale-[0.95]'
            }`}
          >
            {isCurrent ? 'Active' : actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

const FeatureItem = ({ feature, plan }) => {
  // Logic to determine if feature is enabled in this plan
  let isEnabled = false;
  let value = null;

  if (typeof feature.key === 'string') {
    if (feature.key.startsWith('has')) {
      isEnabled = !!plan[feature.key];
    } else if (feature.key.includes('Count') || feature.key.includes('Limit') || feature.key.includes('Seats') || feature.key.includes('Postings') || feature.key.includes('SearchPerDay')) {
      value = plan[feature.key];
      isEnabled = value > 0 || value === 'Unlimited' || value === 0; // 0 often means unlimited in some fields
      if (value === 0 && (feature.key === 'activeJobPostings' || feature.key === 'candidateSearchPerDay')) {
         value = 'Unlimited';
      }
    } else if (feature.key === 'jobAlerts') {
      isEnabled = plan[feature.key] !== 'None';
      value = plan[feature.key];
    }
  }

  return (
    <div className={`flex items-start gap-4 ${isEnabled ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 ${
        isEnabled 
          ? 'bg-white border-emerald-500 text-emerald-500' 
          : 'bg-white border-slate-200 text-slate-300'
      }`}>
        {isEnabled ? <Check size={10} strokeWidth={4} /> : <X size={10} strokeWidth={4} />}
      </div>
      <div className="flex flex-col">
        <span className={`text-[11px] font-bold uppercase tracking-tight ${isEnabled ? 'text-slate-700' : 'text-slate-400'}`}>
          {feature.label}
        </span>
        {isEnabled && value !== null && value !== true && (
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
            {value} {feature.unit || ''}
          </span>
        )}
      </div>
    </div>
  );
};

export default PricingCard;
