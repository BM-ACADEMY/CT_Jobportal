import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';
import { MESSAGES } from '../../data/microcopy';
import { subscribePwa, canPromptInstall, promptInstall, isStandalone, isIosSafari, visitCount } from '../../utils/pwa';

const DISMISS_KEY = 'vv_install_dismissed_at';
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

const recentlyDismissed = () => {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < FOURTEEN_DAYS; } catch { return false; }
};

// variant "banner": waits for the person's second visit. variant "inline": shown right away (for example after a campus test).
const InstallPrompt = ({ variant = 'banner' }) => {
  const [, force] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [visits] = useState(() => visitCount());

  useEffect(() => subscribePwa(() => force((n) => n + 1)), []);

  const ios = isIosSafari();
  const installable = canPromptInstall();
  const eligible = !isStandalone() && !hidden && !recentlyDismissed() && (installable || ios) && (variant === 'inline' || visits >= 2);

  useEffect(() => { if (eligible) trackEvent('pwa_install_prompt', { variant }); }, [eligible, variant]);

  if (!eligible) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setHidden(true);
  };

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl bg-white p-3 pr-2 text-[13px] text-zinc-600 ring-1 ring-zinc-200/80 sm:p-3.5" role="status">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf7f0] text-[#1f8a57]"><Download size={17} /></span>
      <span className="min-w-0 flex-1 leading-snug">
        <strong className="font-semibold text-[#10213D]">Install the Velaivaaipu app.</strong>{' '}
        {ios
          ? <>Tap <Share size={13} className="inline -mt-0.5" /> Share, then "Add to Home Screen".</>
          : MESSAGES.installPrompt}
      </span>
      {!ios && (
        <button type="button" onClick={async () => { await promptInstall(); setHidden(true); }} className="shrink-0 h-9 rounded-lg bg-[#34B678] hover:bg-[#2ca66b] px-3.5 text-xs font-semibold text-white border-none cursor-pointer transition">
          Install
        </button>
      )}
      <button type="button" onClick={dismiss} aria-label="Not now" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 bg-transparent border-none cursor-pointer">
        <X size={15} />
      </button>
    </div>
  );
};

export default InstallPrompt;
