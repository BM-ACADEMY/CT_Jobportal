import React from 'react';
import { ShieldCheck } from 'lucide-react';

// Shown only when an admin has marked the company as phoned and confirmed (company.verifiedByCall).
const VerifiedEmployerBadge = ({ company }) => {
  if (!company || company.verifiedByCall !== true) return null;
  return (
    <span title="Our team phoned this company and confirmed it is real" className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
      <ShieldCheck size={10} /> Verified employer
    </span>
  );
};

export default VerifiedEmployerBadge;
