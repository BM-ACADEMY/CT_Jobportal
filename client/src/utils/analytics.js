// GA4 + Meta Pixel, loaded only when the IDs are configured (VITE_GA_MEASUREMENT_ID, VITE_META_PIXEL_ID).
// Every function is safe to call when tracking is off, blocked by an ad-blocker, or storage is unavailable.
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

let initialised = false;

const safe = (fn) => { try { return fn(); } catch { return undefined; } };

export const initAnalytics = () => {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;
  captureUtm();

  if (GA_ID) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // page_view is sent manually on every route change (single-page app)
    window.gtag('config', GA_ID, { send_page_view: false });
  }

  if (PIXEL_ID) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', PIXEL_ID);
  }
};

export const trackPageView = (path) => {
  if (GA_ID) safe(() => window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: document.title }));
  if (PIXEL_ID) safe(() => window.fbq?.('track', 'PageView'));
};

// Meta standard events get their own names so they can be used for ads optimisation and retargeting.
const META_STANDARD = {
  sign_up: 'CompleteRegistration',
  generate_lead: 'Lead',
  whatsapp_click: 'Contact',
  view_job: 'ViewContent',
};

export const trackEvent = (name, params = {}) => {
  const payload = { ...params, ...getUtm() };
  if (GA_ID) safe(() => window.gtag?.('event', name, payload));
  if (PIXEL_ID) safe(() => {
    const standard = META_STANDARD[name];
    if (standard) window.fbq?.('track', standard, params);
    else window.fbq?.('trackCustom', name, params);
  });
};

// ---- UTM: first touch is kept for the whole session so it can be stored with the lead later ----
const UTM_KEYS = ['source', 'medium', 'campaign'];
const UTM_STORAGE = 'vv_utm';

export const captureUtm = () => safe(() => {
  const q = new URLSearchParams(window.location.search);
  const found = {};
  UTM_KEYS.forEach((k) => { const v = q.get(`utm_${k}`); if (v) found[k] = v.slice(0, 80); });
  if (Object.keys(found).length) sessionStorage.setItem(UTM_STORAGE, JSON.stringify(found));
});

export const getUtm = () => safe(() => JSON.parse(sessionStorage.getItem(UTM_STORAGE) || '{}')) || {};
