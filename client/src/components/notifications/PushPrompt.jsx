import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';
import { useAuth } from '../../context/AuthContext';
import { visitCount } from '../../utils/pwa';
import { pushSupported, needsInstallFirst, permissionState, getPushConfig, currentSubscription, enablePush } from '../../utils/push';

const DISMISS_KEY = 'vv_push_prompt_dismissed_at';
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const recentlyDismissed = () => {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < THIRTY_DAYS; } catch { return false; }
};

const SETTINGS_PATH = { jobseeker: '/candidate/settings', org_employee: '/employee/settings', company: '/company/settings', recruiter: '/company/settings', college: '/college/settings' };

// Small banner on the dashboard home. Never on the first visit, never when the browser already answered,
// never on iPhone Safari outside the installed app (push cannot work there), hidden for 30 days on dismiss.
const PushPrompt = () => {
  const { user } = useAuth();
  const [state, setState] = useState('checking'); // checking | eligible | hidden
  const [visits] = useState(() => visitCount());

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user || visits < 2 || recentlyDismissed() || !pushSupported() || needsInstallFirst() || permissionState() !== 'default') {
        if (alive) setState('hidden');
        return;
      }
      const cfg = await getPushConfig();
      const sub = cfg.enabled ? await currentSubscription().catch(() => null) : null;
      if (alive) setState(cfg.enabled && !sub ? 'eligible' : 'hidden');
    })();
    return () => { alive = false; };
  }, [user, visits]);

  useEffect(() => { if (state === 'eligible') trackEvent('push_prompt_shown'); }, [state]);

  if (state !== 'eligible') return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    trackEvent('push_prompt_dismissed');
    setState('hidden');
  };

  const turnOn = async () => {
    const result = await enablePush();
    trackEvent(result === 'subscribed' ? 'push_enabled' : 'push_prompt_declined', { result });
    setState('hidden');
    if (result !== 'subscribed') {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    }
  };

  return (
    <div className="mb-4 flex items-center gap-3 border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950" role="status">
      <Bell size={18} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <strong className="font-bold">Want to know the moment something happens?</strong>{' '}
        Turn on notifications for applications, interviews and messages. You choose what to get, and nothing arrives at night.{' '}
        <Link to={SETTINGS_PATH[user?.role] || '/candidate/settings'} className="font-semibold underline">Settings</Link>
      </span>
      <button type="button" onClick={turnOn} className="shrink-0 border-none bg-sky-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-800 cursor-pointer">
        Turn on
      </button>
      <button type="button" onClick={dismiss} aria-label="Not now" className="shrink-0 border-none bg-transparent p-1 text-sky-700 hover:text-sky-900 cursor-pointer">
        <X size={16} />
      </button>
    </div>
  );
};

export default PushPrompt;
