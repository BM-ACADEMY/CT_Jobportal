import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

// Animates a stat like "50L+" by count-up on scroll into view, preserving its non-numeric suffix.
const AnimatedStat = ({ value }) => {
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : value;
  const isInt = Number.isInteger(target);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let frame;
    let start;
    const duration = 1400;
    const tick = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target]);

  return <span ref={ref}>{isInt ? Math.round(display) : display.toFixed(1)}{suffix}</span>;
};

export default AnimatedStat;
