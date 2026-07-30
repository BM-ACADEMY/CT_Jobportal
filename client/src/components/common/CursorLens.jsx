import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { Search } from 'lucide-react';

const CursorLens = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // High-performance Framer Motion values
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth physics for the trailing effect
  const springConfig = { damping: 25, stiffness: 400, mass: 0.4 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

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
        className="pointer-events-none fixed top-0 left-0 z-[10001] hidden md:block w-2 h-2 bg-emerald-500 rounded-full"
        style={{
          x: useSpring(cursorX, { damping: 40, stiffness: 800, mass: 0.1 }),
          y: useSpring(cursorY, { damping: 40, stiffness: 800, mass: 0.1 }),
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isVisible && !isHovering ? 1 : 0,
          opacity: isVisible && !isHovering ? 1 : 0
        }}
      />

      {/* The Lens Highlighting Effect */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[10000] hidden md:flex items-center justify-center overflow-hidden"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
          // This is the magic for the highlighting lens effect:
          backdropFilter: 'brightness(1.1) contrast(1.1) saturate(1.5) blur(1.5px)',
          WebkitBackdropFilter: 'brightness(1.1) contrast(1.1) saturate(1.5) blur(1.5px)',
        }}
        animate={{
          width: isHovering ? 72 : 44,
          height: isHovering ? 72 : 44,
          opacity: isVisible ? 1 : 0,
          borderRadius: '50%',
          backgroundColor: isHovering ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
          border: isHovering ? '2px solid rgba(16, 185, 129, 0.6)' : '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: isHovering ? '0 0 30px rgba(16,185,129,0.3), inset 0 0 15px rgba(255,255,255,0.2)' : 'inset 0 0 5px rgba(255,255,255,0.1)',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
          mass: 0.5
        }}
      >
        <motion.div
          animate={{
            scale: isHovering ? 1.2 : 1,
            opacity: isHovering ? 1 : 0.6,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-emerald-500 drop-shadow-md"
        >
          <Search strokeWidth={2.5} className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </>
  );
};

export default CursorLens;
