import React from 'react';
import { motion } from 'framer-motion';

// The logo cut into its parts (public/images/brand) and re-stacked in place, so each
// part can move on its own. Positions are percentages of the original 1000×746 artwork.
const PARTS = [
  {
    key: 'block-left', src: '/images/brand/block-left.png',
    box: { left: '10.9%', top: '0%', width: '25.3%' },
    from: { y: '-70%', rotate: -10, opacity: 0 }, delay: 0, hover: 'brand-hop',
  },
  {
    key: 'block-right', src: '/images/brand/block-right.png',
    box: { left: '38.1%', top: '10.858%', width: '39.8%' },
    from: { y: '-70%', rotate: 8, opacity: 0 }, delay: 0.12, hover: 'brand-hop brand-hop-late',
  },
  {
    key: 'dot', src: '/images/brand/dot.png',
    box: { left: '79.5%', top: '42.225%', width: '8.3%' },
    from: { scale: 0, opacity: 0 }, delay: 0.38, hover: 'brand-pop brand-dot-idle',
  },
  {
    key: 'wordmark', src: '/images/brand/wordmark.png',
    box: { left: '0%', top: '82.038%', width: '100%' },
    from: { y: '40%', opacity: 0 }, delay: 0.55, hover: '',
  },
];

const settled = { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 };

// assemble: play the build-up entrance (used by the intro loader).
// Hover motion and the idle dot bounce come from CSS and need a `.group` ancestor.
const BrandLogo = ({ assemble = false, className = '' }) => (
  <span role="img" aria-label="Velaivaaipu" className={`relative block aspect-[1000/746] ${className}`}>
    {PARTS.map(part => (
      <motion.span
        key={part.key}
        className="absolute"
        style={part.box}
        initial={assemble ? part.from : false}
        animate={settled}
        transition={{ delay: part.delay, type: 'spring', stiffness: 260, damping: 16 }}
      >
        <img src={part.src} alt="" draggable="false" className={`brand-part block w-full h-auto select-none ${part.hover}`} />
      </motion.span>
    ))}
  </span>
);

export default BrandLogo;
