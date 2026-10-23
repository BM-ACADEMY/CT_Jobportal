import React, { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';
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
    <div className="mb-4 flex items-center gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
      <Download size={18} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <strong className="font-bold">Install the Velaivaaipu app.</strong>{' '}
        {ios
          ? <>Tap <Share size={13} className="inline -mt-0.5" /> Share, then "Add to Home Screen".</>
          : 'Open jobs and your profile in one tap from your home screen.'}
      </span>
      {!ios && (
        <button type="button" onClick={async () => { await promptInstall(); setHidden(true); }} className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-2 border-none cursor-pointer">
          Install
        </button>
      )}
      <button type="button" onClick={dismiss} aria-label="Not now" className="shrink-0 text-emerald-700 hover:text-emerald-900 bg-transparent border-none cursor-pointer p-1">
        <X size={15} />
      </button>
    </div>
  );
};

export default InstallPrompt;
