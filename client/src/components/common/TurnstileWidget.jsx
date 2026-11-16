import React, { useEffect, useRef } from 'react';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const turnstileEnabled = () => !!SITE_KEY;

let scriptPromise;
const loadScript = () => {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => { scriptPromise = undefined; reject(new Error('turnstile script failed')); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
};

// Cloudflare "I am human" box. With no VITE_TURNSTILE_SITE_KEY it renders nothing and never asks for a token.
// onToken(token) is called when the person passes, onToken('') when the token expires or the check fails.
// Give it a `resetKey` that changes (for example a counter after a failed submit) to get a fresh check.
const TurnstileWidget = ({ onToken, resetKey = 0 }) => {
  const box = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !box.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        callback: (t) => onToken(t),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    }).catch(() => onToken('')); // script blocked: the server lets the request through if Cloudflare cannot be reached
    return () => {
      cancelled = true;
      if (widgetId.current != null && window.turnstile) { try { window.turnstile.remove(widgetId.current); } catch { /* ignore */ } }
      widgetId.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetKey > 0 && widgetId.current != null && window.turnstile) {
      try { window.turnstile.reset(widgetId.current); } catch { /* ignore */ }
      onToken('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={box} className="flex justify-center" />;
};

export default TurnstileWidget;
