// PWA helpers: service worker registration with an "update available" prompt, and the install prompt state.
import { toast } from 'sonner';
import { trackEvent } from './analytics';

let deferredPrompt = null;
let refreshRequested = false; // only reload after the person taps Refresh, never on the very first install
const listeners = new Set();
const notify = () => listeners.forEach((fn) => { try { fn(); } catch { /* ignore */ } });

export const subscribePwa = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const canPromptInstall = () => !!deferredPrompt;

export const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

export const isIosSafari = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
};

export const promptInstall = async () => {
  if (!deferredPrompt) return 'unavailable';
  const prompt = deferredPrompt;
  deferredPrompt = null;
  notify();
  prompt.prompt();
  const { outcome } = await prompt.userChoice.catch(() => ({ outcome: 'dismissed' }));
  trackEvent(outcome === 'accepted' ? 'pwa_install_accepted' : 'pwa_install_dismissed');
  return outcome;
};

// Count visits (one per browser session) so the install banner waits until the person has come back.
export const visitCount = () => {
  try {
    if (!sessionStorage.getItem('vv_visit_counted')) {
      sessionStorage.setItem('vv_visit_counted', '1');
      localStorage.setItem('vv_visits', String(Number(localStorage.getItem('vv_visits') || 0) + 1));
    }
    return Number(localStorage.getItem('vv_visits') || 0);
  } catch { return 0; }
};

export const initPwa = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    trackEvent('pwa_installed');
    notify();
  });
  if (isStandalone()) trackEvent('pwa_standalone_session');

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      const offerUpdate = (worker) => {
        toast('A new version is ready', {
          duration: Infinity,
          action: { label: 'Refresh', onClick: () => { refreshRequested = true; worker.postMessage({ type: 'SKIP_WAITING' }); } },
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(worker);
        });
      });
      // Look for a new deploy hourly and whenever the app comes back to the foreground.
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
    }).catch(() => { /* the site works without it */ });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading || !refreshRequested) return;
      reloading = true;
      window.location.reload();
    });
  });
};
