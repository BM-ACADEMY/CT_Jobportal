import React from 'react';
import { useT } from './LanguageContext';

// Small "EN | தமிழ்" switch for the header.
const LanguageToggle = ({ className = '' }) => {
  const { lang, setLang } = useT();
  const base = 'px-2 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer';
  const on = 'bg-[#138060] text-white';
  const off = 'text-slate-600 hover:bg-slate-100';
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-lg border border-slate-200 p-0.5 ${className}`} role="group" aria-label="Language">
      <button type="button" onClick={() => setLang('en')} aria-pressed={lang === 'en'} className={`${base} ${lang === 'en' ? on : off}`}>EN</button>
      <button type="button" onClick={() => setLang('ta')} aria-pressed={lang === 'ta'} lang="ta" className={`${base} ${lang === 'ta' ? on : off}`}>தமிழ்</button>
    </div>
  );
};

export default LanguageToggle;
