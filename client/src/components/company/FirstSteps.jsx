import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const KEY = 'employer_first_steps_hidden';
const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };

// A short checklist for a new employer. Disappears when everything is done, or when they hide it.
const FirstSteps = ({ jobCount = 0, loading = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hidden, setHidden] = useState(read);
  const company = user?.companyStatus;
  if (hidden || loading || !company) return null;

  const steps = [
    { done: !!company.hasLogo, label: 'Add your company logo', go: '/company/settings' },
    { done: !!company.hasDescription, label: 'Write two lines about your company', go: '/company/settings' },
    { done: jobCount > 0, label: 'Post your first job', go: '/company/jobs/new' },
    { done: !!company.verified, label: 'Get verified (we check this for you)', go: null },
  ];
  if (steps.every((s) => s.done)) return null;
  const doneCount = steps.filter((s) => s.done).length;

  const hide = () => { try { localStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ } setHidden(true); };

  return (
    <div className="border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="m-0 font-black text-slate-800 text-sm uppercase tracking-wider">Get started ({doneCount} of {steps.length})</p>
        <button type="button" onClick={hide} className="text-xs text-slate-400 underline bg-transparent border-0 cursor-pointer">Hide</button>
      </div>
      <ul className="m-0 p-0 list-none space-y-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            {s.done ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 shrink-0" />}
            <span className={s.done ? 'text-slate-400 line-through' : 'text-slate-700'}>{s.label}</span>
            {!s.done && s.go && (
              <button type="button" onClick={() => navigate(s.go)} className="ml-auto text-xs font-bold text-[#1b496d] bg-transparent border-0 cursor-pointer">Do it</button>
            )}
          </li>
        ))}
      </ul>
      <p className="m-0 mt-4 text-xs text-slate-500">Stuck? Write to <a href="mailto:hello@velaivaaipu.in" className="underline">hello@velaivaaipu.in</a> and a person will reply.</p>
    </div>
  );
};

export default FirstSteps;
