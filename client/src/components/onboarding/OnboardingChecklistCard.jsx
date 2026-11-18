import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, PlayCircle, ChevronDown } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

const TITLES = {
  jobseeker: 'Finish setting up your profile',
  company: 'Set up your company to start hiring',
  college: 'Set up your college',
  employee: 'Complete your profile',
};

const PREVIEW = 4;

// Shown on each portal's dashboard until every step is done. Shows the next few open
// steps first; the rest (and finished ones) sit behind "Show all".
const OnboardingChecklistCard = ({ className = 'mb-6' }) => {
  const { data, openTour } = useOnboarding();
  const [showAll, setShowAll] = useState(false);
  if (!data?.enabled || data.complete) return null;
  const ordered = [...data.steps.filter((s) => !s.done), ...data.steps.filter((s) => s.done)];
  const steps = showAll ? ordered : ordered.slice(0, PREVIEW);
  const hiddenCount = ordered.length - steps.length;

  return (
    <section className={`${className} rounded-2xl bg-white p-5 sm:p-6 ring-1 ring-zinc-200/80`} aria-label="Setup checklist">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-[15px] font-semibold text-[#10213D]">{TITLES[data.group] || 'Finish your setup'}</h2>
          <p className="m-0 text-xs text-zinc-500 mt-0.5">{data.done} of {data.total} done</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={openTour} className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-[#10213D] bg-transparent border-none cursor-pointer">
            <PlayCircle size={14} /> Take the tour
          </button>
          <span className="text-sm font-bold text-[#1f8a57]">{data.percent}%</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden" role="progressbar" aria-valuenow={data.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-[#34B678] transition-all" style={{ width: `${data.percent}%` }} />
      </div>
      <ul className="m-0 mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.key}>
            <Link
              to={s.path}
              className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-[13px] no-underline ring-1 transition ${s.done ? 'ring-transparent bg-zinc-50 text-zinc-400' : 'ring-zinc-200 hover:ring-[#34B678]/50 hover:bg-[#f4faf7] text-[#10213D]'}`}
            >
              {s.done ? <CheckCircle2 size={16} className="text-[#34B678] shrink-0 mt-0.5" /> : <Circle size={16} className="text-zinc-300 shrink-0 mt-0.5" />}
              <span className="min-w-0">
                <span className={`block font-medium ${s.done ? 'line-through' : ''}`}>{s.label}</span>
                {!s.done && <span className="block text-xs text-zinc-400 mt-0.5">{s.hint}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      {data.nextStep && (
        <Link to={data.nextStep.path} className="inline-flex items-center gap-1.5 rounded-xl bg-[#34B678] text-white text-[13px] font-semibold px-4 h-10 no-underline shadow-md shadow-[#34B678]/25 hover:bg-[#2ca66b]">
          Next: {data.nextStep.label} <ArrowRight size={15} />
        </Link>
      )}
      {ordered.length > PREVIEW && (
        <button type="button" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll} className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-[#10213D] bg-transparent border-none cursor-pointer">
          {showAll ? 'Show less' : `Show all ${ordered.length} steps`}
          <ChevronDown size={14} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
          {!showAll && hiddenCount > 0 && <span className="sr-only">({hiddenCount} more)</span>}
        </button>
      )}
      </div>
    </section>
  );
};

export default OnboardingChecklistCard;
