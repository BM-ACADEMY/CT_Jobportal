import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

const BackToTop = () => {
  const [showTop, setShowTop] = useState(false);
  const { scrollYProgress } = useScroll();
  // The ring around the button fills as the page is scrolled.
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 24 });

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {showTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="group fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-40 w-12 h-12 rounded-full bg-white shadow-lg shadow-emerald-900/15 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34B678] focus-visible:ring-offset-2"
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="22" fill="none" stroke="#34B678" strokeOpacity="0.15" strokeWidth="3" />
            <motion.circle cx="24" cy="24" r="22" fill="none" stroke="#34B678" strokeWidth="3" strokeLinecap="round" style={{ pathLength: progress }} />
          </svg>
          <span className="relative w-9 h-9 rounded-full bg-[#34B678] text-white flex items-center justify-center transition-colors group-hover:bg-[#10213D]">
            <ChevronUp size={18} strokeWidth={2.5} />
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;
