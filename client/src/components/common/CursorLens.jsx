import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const CursorLens = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // High-performance Framer Motion values
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  useEffect(() => {
    const moveCursor = (e) => {
      if (!isVisible) setIsVisible(true);
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      const target = e.target.closest('a, button, [role="button"], input, select, textarea');
      if (target || window.getComputedStyle(e.target).cursor === 'pointer') {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, cursorX, cursorY]);

  if (typeof window === 'undefined') return null;

  return (
    <>
      {/* Precision Core Dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[10001] hidden md:block w-3 h-3 bg-emerald-500 rounded-full"
        style={{
          x: useSpring(cursorX, { damping: 40, stiffness: 800, mass: 0.1 }),
          y: useSpring(cursorY, { damping: 40, stiffness: 800, mass: 0.1 }),
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isVisible ? (isHovering ? 1.5 : 1) : 0,
          opacity: isVisible ? (isHovering ? 0.7 : 1) : 0
        }}
      />
    </>
  );
};

export default CursorLens;
