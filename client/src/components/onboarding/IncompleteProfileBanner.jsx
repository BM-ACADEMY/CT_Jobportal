import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

const today = () => new Date().toISOString().slice(0, 10);
const keyFor = (group) => `onboarding_banner_${group}`;

// Slim strip shown on every page of a portal until the checklist is complete.
// "Dismiss" hides it for the rest of the day only, so it comes back tomorrow.
const IncompleteProfileBanner = () => {
  const { data } = useOnboarding();
  const [hidden, setHidden] = useState(false);

  if (!data?.enabled || data.complete || hidden) return null;
  let dismissedToday = false;
  try { dismissedToday = localStorage.getItem(keyFor(data.group)) === today(); } catch { /* ignore */ }
  if (dismissedToday) return null;

  const dismiss = () => {
    try { localStorage.setItem(keyFor(data.group), today()); } catch { /* ignore */ }
    setHidden(true);
  };
  const next = data.nextStep;
  const lead = data.group === 'jobseeker' ? `Your profile is ${data.percent}% complete.`
    : data.group === 'college' ? `Your college setup is ${data.percent}% complete.`
    : `Your setup is ${data.percent}% complete.`;

  return (
    <div className="mb-4 flex items-center gap-3 border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900" role="status">
      <span className="min-w-0 flex-1">
        <strong className="font-bold">{lead}</strong>{' '}
        {next && <Link to={next.path} className="font-semibold underline underline-offset-2 text-amber-900">Next: {next.label} <ArrowRight size={13} className="inline -mt-0.5" /></Link>}
      </span>
      <button type="button" onClick={dismiss} aria-label="Hide until tomorrow" className="shrink-0 text-amber-700 hover:text-amber-900 bg-transparent border-none cursor-pointer p-1">
        <X size={15} />
      </button>
    </div>
  );
};

export default IncompleteProfileBanner;
