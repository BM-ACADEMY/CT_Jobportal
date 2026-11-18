import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Check, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import WaveLines from '@/components/common/WaveLines';

// Shared look for every sign-in / sign-up page: mint page, one white card,
// a coloured brand panel on the left (desktop only) and the form on the right.

export const EASE = [0.22, 1, 0.36, 1];

export const inputCls =
  'w-full h-12 pl-11 rounded-xl bg-white text-zinc-900 text-sm font-medium ring-1 ring-zinc-200 border-none outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-[#34B678] aria-[invalid=true]:ring-rose-300 disabled:bg-zinc-50 disabled:text-zinc-500';

export const labelCls = 'text-sm font-semibold text-[#10213D]';

export const otpSlotCls =
  'h-12 w-11 sm:h-14 sm:w-12 rounded-xl border border-zinc-200 bg-white text-xl font-bold text-[#10213D] ring-[#34B678] first:rounded-xl last:rounded-xl';

const TONES = {
  green: {
    bg: 'from-[#34B678] to-[#1f8a57]',
    ring: '#fff',
    ringFill: 0.1,
    ringStroke: 0.18,
    eyebrow: 'text-white/80',
    accent: 'text-[#10213D]',
  },
  navy: {
    bg: 'from-[#10213D] to-[#1b3a63]',
    ring: '#34B678',
    ringFill: 0.16,
    ringStroke: 0.3,
    eyebrow: 'text-[#5fd39b]',
    accent: 'text-[#5fd39b]',
  },
};

export const AuthShell = ({ panel, children, id = 'auth' }) => (
  <div className="relative min-h-screen lg:h-screen lg:overflow-hidden bg-[#f4faf7] flex items-center justify-center px-4 py-8 sm:px-6">
    <WaveLines id={`${id}-page-waves`} />

    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="relative w-full max-w-[1040px] lg:h-[min(660px,calc(100vh-4rem))] grid lg:grid-cols-[1.05fr_1fr] rounded-[2rem] bg-white p-2 ring-1 ring-zinc-200/80 shadow-[0_40px_90px_-50px_rgba(16,33,61,0.5)]"
    >
      {panel}

      <main className="flex flex-col px-5 py-8 sm:px-10 lg:px-12 lg:overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="w-full max-w-[400px] m-auto">
          <Link to="/" className="inline-block w-24" aria-label="Velaivaaipu home">
            <BrandLogo className="w-24" />
          </Link>
          {children}
        </div>
      </main>
    </motion.div>
  </div>
);

export const AuthPanel = ({ tone = 'green', eyebrow, title, text, children }) => {
  const t = TONES[tone];
  return (
    <aside className={`hidden lg:flex relative overflow-hidden flex-col rounded-[1.6rem] bg-gradient-to-br ${t.bg} px-10 pt-10 text-white`}>
      <svg className="absolute -right-28 -bottom-28 w-[520px] h-[520px] pointer-events-none" viewBox="0 0 200 200" fill="none" aria-hidden="true">
        <circle cx="100" cy="100" r="60" fill={t.ring} fillOpacity={t.ringFill} />
        {[70, 80, 90, 99].map((r) => <circle key={r} cx="100" cy="100" r={r} stroke={t.ring} strokeOpacity={t.ringStroke} strokeWidth="0.4" />)}
      </svg>

      {eyebrow && <p className={`relative text-xs font-bold uppercase tracking-[0.18em] m-0 mb-3 ${t.eyebrow}`}>{eyebrow}</p>}
      <h2 className="relative text-[clamp(1.75rem,4vh,2.4rem)] font-bold tracking-tight leading-[1.1] m-0 max-w-sm">{title}</h2>
      {text && <p className="relative mt-3 text-sm text-white/75 leading-relaxed max-w-sm m-0">{text}</p>}
      {children}
    </aside>
  );
};

// Accent word inside a panel title.
export const PanelAccent = ({ tone = 'green', children }) => <span className={TONES[tone].accent}>{children}</span>;

// Tick list for the panel.
export const PanelPoints = ({ points, tone = 'green' }) => (
  <ul className="relative mt-[clamp(1rem,3vh,1.75rem)] space-y-3 p-0 m-0 list-none">
    {points.map((text) => (
      <li key={text} className="flex items-start gap-3 text-sm font-medium text-white/90">
        <span className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center ${tone === 'navy' ? 'bg-[#34B678] text-white' : 'bg-white text-[#1f8a57]'}`}>
          <Check size={12} strokeWidth={3.5} />
        </span>
        {text}
      </li>
    ))}
  </ul>
);

// Numbered step cards pinned to the bottom of the panel. `active` (0-based) highlights the
// current step, earlier steps show as done.
export const PanelSteps = ({ steps, active = -1 }) => (
  <ol className="relative mt-auto mb-10 pt-6 space-y-3 p-0 list-none">
    {steps.map(({ Icon, title, text }, i) => {
      const done = active > i;
      const current = active === i;
      return (
        <motion.li
          key={title}
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: EASE }}
          className={`flex items-center gap-4 rounded-2xl px-4 py-3.5 ring-1 transition-colors ${current ? 'bg-white/[0.16] ring-white/30' : 'bg-white/[0.06] ring-white/10'}`}
        >
          <span className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors ${done || current || active < 0 ? 'bg-white text-[#1f8a57]' : 'bg-white/15 text-white'}`}>
            {done ? <Check size={20} strokeWidth={3} /> : <Icon size={20} />}
          </span>
          <div className="min-w-0">
            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">Step {i + 1}</p>
            <p className="m-0 text-[15px] font-bold text-white">{title}</p>
            <p className="m-0 text-[13px] text-white/70">{text}</p>
          </div>
        </motion.li>
      );
    })}
  </ol>
);

// Picture pinned to the bottom-right of the panel.
export const PanelImage = ({ src }) => (
  <div className="relative flex-1 min-h-0 mt-4 flex justify-end items-end -mr-4">
    <motion.img
      src={src}
      alt=""
      aria-hidden="true"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
      className="h-full max-h-[400px] w-auto max-w-[75%] object-contain object-bottom"
    />
  </div>
);

export const AuthHeading = ({ title, children }) => (
  <>
    <h1 className="mt-6 text-[1.75rem] font-bold tracking-tight text-[#10213D] m-0">{title}</h1>
    {children && <p className="mt-1.5 text-zinc-500 text-sm leading-relaxed m-0">{children}</p>}
  </>
);

export const AuthAlert = ({ type = 'error', children }) => {
  if (!children) return null;
  const ok = type === 'success';
  const Icon = ok ? CheckCircle2 : AlertCircle;
  return (
    <div role={ok ? 'status' : 'alert'} className={`mt-5 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ring-1 ${ok ? 'bg-[#eaf7f0] ring-[#34B678]/25 text-[#1f8a57]' : 'bg-rose-50 ring-rose-100 text-rose-700'}`}>
      <Icon size={17} className="shrink-0 mt-px" /> <span>{children}</span>
    </div>
  );
};

export const SubmitButton = ({ loading, loadingText, children, arrow = true, className = '', ...props }) => (
  <button
    type="submit"
    disabled={loading}
    {...props}
    className={`group w-full h-12 rounded-xl bg-[#34B678] hover:bg-[#2ca66b] disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-bold border-none cursor-pointer shadow-lg shadow-[#34B678]/30 flex items-center justify-center gap-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#34B678]/30 ${className}`}
  >
    {loading
      ? <><Loader2 size={17} className="animate-spin" /> {loadingText}</>
      : <>{children} {arrow && <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />}</>}
  </button>
);

// Show / hide toggle placed inside a password field.
export const EyeToggle = ({ shown, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={shown ? 'Hide password' : 'Show password'}
    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 bg-transparent border-none cursor-pointer transition"
  >
    {shown ? <EyeOff size={17} /> : <Eye size={17} />}
  </button>
);

export const TextLink = ({ to, children, className = '' }) => (
  <Link to={to} className={`font-bold text-[#1f8a57] hover:underline ${className}`}>{children}</Link>
);
