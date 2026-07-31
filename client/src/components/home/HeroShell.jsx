import React, { useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

// Dark bento hero wrapper: dot-grid texture, cursor spotlight, ambient blobs,
// bottom wave. `children` may be a render-prop `({ tiltX, tiltY }) => node`
// so a variant can tilt a photo/visual card in sync with the cursor.
const HeroShell = ({ children }) => {
  const heroRef = useRef(null);
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const springX = useSpring(mvX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mvY, { stiffness: 60, damping: 20 });
  const tiltX = useTransform(springY, [-1, 1], [6, -6]);
  const tiltY = useTransform(springX, [-1, 1], [-6, 6]);

  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);
  const glowXs = useSpring(glowX, { stiffness: 40, damping: 25 });
  const glowYs = useSpring(glowY, { stiffness: 40, damping: 25 });

  const handleMouseMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mvX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    mvY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
    glowX.set(e.clientX - rect.left);
    glowY.set(e.clientY - rect.top);
  };
  const handleMouseLeave = () => {
    mvX.set(0);
    mvY.set(0);
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex items-center overflow-hidden bg-slate-950"
    >
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
      <motion.div
        style={{ left: glowXs, top: glowYs, translateX: '-50%', translateY: '-50%' }}
        className="absolute w-[480px] h-[480px] rounded-full bg-emerald-500/20 blur-[110px] pointer-events-none mix-blend-screen hidden lg:block"
      />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-blue-500/10 rounded-full blur-[120px] -ml-32 -mb-32 pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 pt-36 pb-24 relative z-10">
        {typeof children === 'function' ? children({ tiltX, tiltY }) : children}
      </div>

      <div className="absolute bottom-0 left-0 w-full">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
          <path d="M0 80H1440V40C1200 80 960 0 720 40C480 80 240 0 0 40V80Z" fill="white" />
        </svg>
      </div>
    </section>
  );
};

export default HeroShell;
