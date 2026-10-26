import React, { useEffect, useLayoutEffect, useState } from 'react';
import { motion, useAnimate, useReducedMotion } from 'framer-motion';
import BrandLogo from './BrandLogo';

const MIN_SHOW_MS = 1700;   // long enough for the logo to finish assembling
const MAX_WAIT_MS = 4000;   // never hold the page longer than this
const HEADER_LOGO = '[data-brand-logo]';

const pageLoaded = () => new Promise(resolve => {
  if (document.readyState === 'complete') return resolve();
  window.addEventListener('load', resolve, { once: true });
});
const wait = (ms) => new Promise(r => setTimeout(r, ms));

// The header may live in a lazy route chunk, so poll briefly for its logo.
const findHeaderLogo = async (timeoutMs) => {
  const until = performance.now() + timeoutMs;
  while (performance.now() < until) {
    const el = document.querySelector(HEADER_LOGO);
    if (el && el.getBoundingClientRect().width > 0) return el;
    await wait(50);
  }
  return null;
};

// On every full page load the logo assembles in the centre of a white screen, then flies
// into the header's logo slot while the screen fades away. With reduced motion the logo
// is shown still for the same time and the screen simply fades.
const IntroLoader = () => {
  const reduceMotion = useReducedMotion();
  const [show, setShow] = useState(true);
  const [scope, animate] = useAnimate();

  // Hide the real header logo until the flying one lands on it.
  useLayoutEffect(() => {
    if (!show) return undefined;
    document.documentElement.dataset.intro = 'playing';
    return () => { delete document.documentElement.dataset.intro; };
  }, [show]);

  useEffect(() => {
    if (!show) return undefined;
    let cancelled = false;

    const run = async () => {
      await Promise.all([wait(MIN_SHOW_MS), Promise.race([pageLoaded(), wait(MAX_WAIT_MS)])]);
      if (cancelled) return;

      const logo = scope.current?.querySelector('[data-intro-logo]');
      const target = reduceMotion ? null : await findHeaderLogo(1200);
      if (cancelled) return;

      animate('[data-intro-bar]', { opacity: 0 }, { duration: 0.2 });

      if (logo && target) {
        const from = logo.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
        const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
        await Promise.all([
          animate('[data-intro-bg]', { opacity: 0 }, { duration: 0.6, delay: 0.15, ease: 'easeOut' }),
          animate(logo, { x: dx, y: dy, scale: to.width / from.width }, { duration: 0.75, ease: [0.65, 0, 0.35, 1] }),
        ]);
      } else {
        await animate(scope.current, { opacity: 0 }, { duration: 0.4 });
      }
      if (cancelled) return;
      setShow(false);
    };

    run();
    return () => { cancelled = true; };
  }, [show, reduceMotion, animate, scope]);

  if (!show) return null;

  return (
    <div ref={scope} className="fixed inset-0 z-[100] pointer-events-none" role="status" aria-live="polite">
      <span className="sr-only">Loading Velaivaaipu</span>
      <div
        data-intro-bg
        className="absolute inset-0 bg-white pointer-events-auto"
        style={{ backgroundImage: 'radial-gradient(50% 45% at 50% 45%, rgba(0, 212, 146, 0.10), transparent 70%)' }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
        <div data-intro-logo className="w-40 sm:w-52 will-change-transform">
          <BrandLogo assemble={!reduceMotion} />
        </div>
        <div data-intro-bar className="h-1 w-32 rounded-full bg-emerald-100 overflow-hidden">
          <motion.div
            className="h-full w-full origin-left rounded-full bg-[#34b678]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: MIN_SHOW_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>
    </div>
  );
};

export default IntroLoader;
