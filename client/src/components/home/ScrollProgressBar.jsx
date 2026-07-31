import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-slate-900 origin-left z-[60]"
    />
  );
};

export default ScrollProgressBar;
