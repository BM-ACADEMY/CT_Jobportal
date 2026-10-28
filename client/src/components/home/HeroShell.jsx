import React from 'react';

// Static mesh painted once (radial gradients, no blur filter), so scrolling and the
// floating hero elements never force the background to re-rasterise.
const MESH = [
  'radial-gradient(60% 55% at 85% 20%, rgba(56, 189, 248, 0.16) 0%, transparent 70%)',
  'radial-gradient(50% 50% at 10% 15%, rgba(0, 212, 146, 0.16) 0%, transparent 70%)',
  'radial-gradient(45% 40% at 55% 100%, rgba(251, 191, 36, 0.10) 0%, transparent 70%)',
  'linear-gradient(180deg, #f8fffc 0%, #ffffff 100%)',
].join(', ');

// Light hero wrapper: static mesh gradient and a masked dot grid.
const HeroShell = ({ children }) => {
  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden" style={{ backgroundImage: MESH }}>
      {/* Dot grid, faded toward the edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15, 118, 110, 0.18) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 20%, transparent 85%)',
          maskImage: 'radial-gradient(ellipse 75% 65% at 50% 45%, black 20%, transparent 85%)',
        }}
      />

      {/* Fade into the following white section */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 pt-24 pb-16 relative z-10">
        {children}
      </div>
    </section>
  );
};

export default HeroShell;
