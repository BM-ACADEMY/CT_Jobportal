import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Smartphone, Share } from 'lucide-react';
import { Switch } from 'antd';
import { toast } from 'sonner';
import {
  pushSupported, needsInstallFirst, permissionState, getPushConfig, currentSubscription,
  enablePush, disablePush, getPushPrefs, savePushPrefs, sendTestPush,
} from '../../utils/push';

// Shown in every portal's Settings page. One switch for "this device", one checkbox per category.
const CATEGORY_LABELS = {
  jobs: { label: 'New jobs for you', hint: 'At most one a day' },
  applications: { label: 'Applications', hint: 'New applicants, status changes' },
  interviews: { label: 'Interviews and sessions', hint: 'Schedules, reminders, counselling and mock interviews' },
  messages: { label: 'Messages', hint: 'New chat messages' },
  billing: { label: 'Plan and payments', hint: 'Purchases, renewals, refunds' },
  team: { label: 'Team', hint: 'Invites and team changes' },
  general: { label: 'Everything else', hint: 'Support replies, verification, reviews' },
};

const PushSettings = () => {
  const [config, setConfig] = useState(null);     // null while loading
  const [subscribed, setSubscribed] = useState(false);
  const [muted, setMuted] = useState([]);
  const [devices, setDevices] = useState(0);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState(permissionState());

  useEffect(() => {
    let alive = true;
    (async () => {
      const cfg = await getPushConfig();
      if (!alive) return;
      setConfig(cfg);
      if (!cfg.enabled) return;
      const [sub, prefs] = await Promise.all([
        currentSubscription().catch(() => null),
        getPushPrefs().catch(() => ({ mutedCategories: [], devices: 0 })),
      ]);
      if (!alive) return;
      setSubscribed(!!sub);
      setMuted(prefs.mutedCategories || []);
      setDevices(prefs.devices || 0);
    })();
    return () => { alive = false; };
  }, []);

  // Push is not on for this deployment: show nothing rather than a dead switch.
  if (!config || !config.enabled) return null;

  const supported = pushSupported();
  const installFirst = needsInstallFirst();

  const toggleDevice = async (on) => {
    setBusy(true);
    try {
      if (on) {
        const result = await enablePush();
        setPermission(permissionState());
        if (result === 'subscribed') {
          setSubscribed(true);
          setDevices((d) => d + 1);
          toast.success('Notifications are on for this device.');
        } else if (result === 'denied') {
          toast.error('Notifications are blocked in the browser. Allow them for this site in the browser settings, then try again.');
        } else if (result === 'unsupported') {
          toast.error('This browser cannot receive notifications.');
        } else {
          toast.error('Could not switch notifications on. Please try again.');
        }
      } else {
        await disablePush();
        setSubscribed(false);
        setDevices((d) => Math.max(0, d - 1));
        toast.success('Notifications are off for this device.');
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleCategory = async (key, enabled) => {
    const next = enabled ? muted.filter((c) => c !== key) : [...new Set([...muted, key])];
    const before = muted;
    setMuted(next);
    try {
      await savePushPrefs(next);
    } catch {
      setMuted(before);
      toast.error('Could not save that preference.');
    }
  };

  const test = async () => {
    try {
      const r = await sendTestPush();
      if (!r.delivered) toast('No device accepted the test. Check the switch above.');
    } catch {
      toast.error('Could not send a test notification.');
    }
  };

  return (
    <section className="border border-slate-200 bg-white p-6 mb-6" aria-labelledby="push-settings-title">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            {subscribed ? <Bell size={16} className="text-emerald-600" /> : <BellOff size={16} className="text-slate-400" />}
          </div>
          <div className="min-w-0">
            <h3 id="push-settings-title" className="text-sm font-bold text-slate-900 m-0">Notifications on this device</h3>
            <p className="text-xs text-slate-500 m-0 mt-1">
              Get a notification on this {installFirst || /Mobi/.test(navigator.userAgent) ? 'phone' : 'computer'} even when Velaivaaipu is closed.
              You still get the in-app bell and email either way. Nothing is sent between 9 pm and 8 am except interviews and messages.
              {devices > 0 && ` Currently on for ${devices} device${devices === 1 ? '' : 's'}.`}
            </p>
          </div>
        </div>
        <Switch checked={subscribed} onChange={toggleDevice} loading={busy} disabled={!supported || installFirst} aria-label="Notifications on this device" />
      </div>

      {installFirst && (
        <p className="mt-4 text-xs text-amber-800 bg-amber-50 border border-amber-100 px-3 py-2 m-0 flex items-start gap-2">
          <Smartphone size={14} className="shrink-0 mt-0.5" />
          <span>On iPhone and iPad, notifications work only from the installed app: tap <Share size={12} className="inline" /> Share, then <strong>Add to Home Screen</strong>, open Velaivaaipu from there and switch this on.</span>
        </p>
      )}
      {!supported && !installFirst && (
        <p className="mt-4 text-xs text-slate-500 m-0">This browser does not support notifications.</p>
      )}
      {permission === 'denied' && supported && (
        <p className="mt-4 text-xs text-rose-700 m-0">Notifications are blocked for this site in the browser. Allow them in the browser's site settings to switch this on.</p>
      )}

      {(subscribed || devices > 0) && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0 mb-3">What to notify me about</p>
          <ul className="list-none p-0 m-0 grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {(config.categories || Object.keys(CATEGORY_LABELS)).map((key) => {
              const meta = CATEGORY_LABELS[key] || { label: key, hint: '' };
              const enabled = !muted.includes(key);
              return (
                <li key={key} className="flex items-center justify-between gap-3">
                  <label htmlFor={`push-cat-${key}`} className="min-w-0 cursor-pointer">
                    <span className="block text-sm font-semibold text-slate-800">{meta.label}</span>
                    {meta.hint && <span className="block text-[11px] text-slate-400">{meta.hint}</span>}
                  </label>
                  <Switch id={`push-cat-${key}`} size="small" checked={enabled} onChange={(on) => toggleCategory(key, on)} aria-label={meta.label} />
                </li>
              );
            })}
          </ul>
          {subscribed && (
            <button type="button" onClick={test} className="mt-5 text-xs font-bold text-emerald-700 bg-transparent border-none p-0 cursor-pointer hover:underline">
              Send me a test notification
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default PushSettings;
