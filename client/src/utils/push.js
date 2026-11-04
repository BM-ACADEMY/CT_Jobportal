// Web push helpers: feature detection, the server's VAPID key, subscribe / unsubscribe for this device.
// The service worker (public/sw.js) shows the notifications; this file only manages the subscription.
import axios from 'axios';
import { isIosSafari, isStandalone } from './pwa';

const API = import.meta.env.VITE_API_BASE_URL;
const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

let configPromise = null;
// { enabled, publicKey, categories } from the server; cached for the page's life.
export const getPushConfig = () => {
  if (!configPromise) {
    configPromise = axios.get(`${API}/push/config`).then((r) => r.data).catch(() => ({ enabled: false, publicKey: '', categories: [] }));
  }
  return configPromise;
};

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// iPhone and iPad only deliver web push to an installed (Home Screen) app on iOS 16.4 or later.
export const needsInstallFirst = () => isIosSafari() && !isStandalone();

export const permissionState = () => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

const registration = async () => {
  if (!pushSupported()) return null;
  // In development the service worker is not registered (see utils/pwa.js); push then simply reports "unsupported".
  const reg = await navigator.serviceWorker.getRegistration('/');
  return reg || null;
};

// The current subscription of this browser, or null.
export const currentSubscription = async () => {
  const reg = await registration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
};

const saveOnServer = (sub) =>
  axios.post(`${API}/push/subscribe`, { subscription: sub.toJSON(), standalone: isStandalone() }, authHeaders());

// Asks for permission (if needed), subscribes this device and stores it on the server.
// Returns 'subscribed' | 'denied' | 'unsupported' | 'disabled' | 'error'.
export const enablePush = async () => {
  if (!pushSupported()) return 'unsupported';
  const cfg = await getPushConfig();
  if (!cfg.enabled || !cfg.publicKey) return 'disabled';
  const reg = await registration();
  if (!reg) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(cfg.publicKey) });
    }
    await saveOnServer(sub);
    return 'subscribed';
  } catch {
    return 'error';
  }
};

// Removes this device on the server and in the browser.
export const disablePush = async () => {
  try {
    const sub = await currentSubscription();
    if (!sub) return true;
    await axios.delete(`${API}/push/subscribe`, { ...authHeaders(), data: { endpoint: sub.endpoint } }).catch(() => {});
    await sub.unsubscribe();
    return true;
  } catch {
    return false;
  }
};

// Keeps the server copy fresh (the push service can rotate subscriptions; the worker tells us).
export const listenForResubscribe = () => {
  if (!pushSupported()) return () => {};
  const handler = (event) => {
    if (event.data?.type === 'PUSH_RESUBSCRIBED' && event.data.subscription && localStorage.getItem('token')) {
      axios.post(`${API}/push/subscribe`, { subscription: event.data.subscription, standalone: isStandalone() }, authHeaders()).catch(() => {});
    }
  };
  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
};

export const getPushPrefs = () => axios.get(`${API}/push/prefs`, authHeaders()).then((r) => r.data);
export const savePushPrefs = (mutedCategories) => axios.put(`${API}/push/prefs`, { mutedCategories }, authHeaders()).then((r) => r.data);
export const sendTestPush = () => axios.post(`${API}/push/test`, {}, authHeaders()).then((r) => r.data);
