import React from 'react';
import { Check, Minus, Info } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const PlanComparisonTable = ({ title, plans, features }) => {
  return (
    <div className="w-full overflow-x-auto rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="p-8 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50">
            <th className="p-6 text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100">Feature</th>
            {plans.map((plan) => (
              <th key={plan._id} className="p-6 text-center border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 uppercase">{plan.name}</h3>
                  <p className="text-lg font-bold text-emerald-600">
                    {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                    <span className="text-[10px] text-slate-400 font-bold ml-1">/mo</span>
                  </p>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {features.map((feature, idx) => (
            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
              <td className="p-6 text-sm font-semibold text-slate-600 flex items-center gap-2">
                {feature.label}
                {feature.info && <Info size={14} className="text-slate-300 cursor-help" />}
              </td>
              {plans.map((plan) => {
                const value = plan[feature.key];
                return (
                  <td key={plan._id} className="p-6 text-center">
                    {typeof value === 'boolean' ? (
                      value ? (
                        <div className="flex justify-center">
                          <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <Minus size={16} className="text-slate-200 mx-auto" />
                      )
                    ) : typeof value === 'number' ? (
                      <span className="text-sm font-bold text-slate-700">{value === 0 ? 'Unlimited' : value}</span>
                    ) : (
                      <span className="text-sm font-bold text-slate-700">{value || '-'}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Render Custom Features (String Arrays) */}
          {[...new Set(plans.flatMap(p => p.features || []))].map((customFeature, idx) => (
            <tr key={`custom-${idx}`} className="hover:bg-slate-50/30 transition-colors">
              <td className="p-6 text-sm font-semibold text-slate-600 flex items-center gap-2">
                {customFeature}
              </td>
              {plans.map((plan) => (
                <td key={plan._id} className="p-6 text-center">
                   {plan.features?.includes(customFeature) ? (
                    <div className="flex justify-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>
                  ) : (
                    <Minus size={16} className="text-slate-200 mx-auto" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlanComparisonTable;
