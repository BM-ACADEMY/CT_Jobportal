import React, { useEffect } from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Tells an employer, in plain words, whether their company is verified yet.
// Until it is verified, their jobs are not shown on the public site.
const VerificationBanner = () => {
  const { user, refreshUser } = useAuth();
  // Re-read the account once when the page opens, so a company that was verified a minute ago stops seeing the notice.
  useEffect(() => { try { refreshUser && refreshUser(); } catch (e) { /* ignore */ } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const status = user?.companyStatus;
  if (!status || status.verified) return null;

  return (
    <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 px-4 py-3" role="status">
      <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
      <div className="text-sm text-amber-900">
        <p className="font-bold m-0">Your company is being verified</p>
        <p className="m-0 mt-1 leading-relaxed">
          You can post jobs now. They will show on the public site once our team confirms your company, usually within one working day.
          We will email you the moment it is done. If you want it faster, make sure your logo, website and description are filled in under Settings.
        </p>
      </div>
    </div>
  );
};

export const VerifiedTick = () => <ShieldCheck className="w-4 h-4 text-emerald-600 inline" />;
export default VerificationBanner;
