import React from 'react';
import { motion } from 'framer-motion';

// Fade-and-rise into view once when scrolled to. `delay` in seconds.
const Reveal = ({ children, delay = 0, y = 24, className, as = 'div' }) => {
  const Comp = motion[as];
  return (
    <Comp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </Comp>
  );
};

export default Reveal;
