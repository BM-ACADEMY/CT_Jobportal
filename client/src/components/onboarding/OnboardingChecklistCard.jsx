import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, PlayCircle } from 'lucide-react';
import { useOnboarding } from '../../context/OnboardingContext';

const TITLES = {
  jobseeker: 'Finish setting up your profile',
  company: 'Set up your company to start hiring',
  college: 'Set up your college',
  employee: 'Complete your profile',
};

// Shown on each portal's dashboard until every step is done.
const OnboardingChecklistCard = () => {
  const { data, openTour } = useOnboarding();
  if (!data?.enabled || data.complete) return null;

  return (
    <section className="mb-6 border border-slate-200 bg-white p-5 shadow-sm" aria-label="Setup checklist">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">{TITLES[data.group] || 'Finish your setup'}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{data.done} of {data.total} done</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={openTour} className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer">
            <PlayCircle size={14} /> Take the tour
          </button>
          <span className="text-sm font-black text-emerald-600">{data.percent}%</span>
        </div>
      </div>
      <div className="mt-3 h-2 w-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={data.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${data.percent}%` }} />
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {data.steps.map((s) => (
          <li key={s.key}>
            <Link
              to={s.path}
              className={`flex items-start gap-2.5 p-2.5 border text-sm no-underline transition-colors ${s.done ? 'border-transparent text-slate-400' : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-slate-800'}`}
            >
              {s.done ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" /> : <Circle size={18} className="text-slate-300 shrink-0 mt-0.5" />}
              <span className="min-w-0">
                <span className={`block font-semibold ${s.done ? 'line-through' : ''}`}>{s.label}</span>
                {!s.done && <span className="block text-xs text-slate-500 mt-0.5">{s.hint}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {data.nextStep && (
        <Link to={data.nextStep.path} className="mt-4 inline-flex items-center gap-1.5 bg-slate-900 text-white text-sm font-bold px-4 py-2.5 no-underline hover:bg-slate-800">
          Next: {data.nextStep.label} <ArrowRight size={15} />
        </Link>
      )}
    </section>
  );
};

export default OnboardingChecklistCard;
