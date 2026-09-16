import React from 'react';
import { motion } from 'framer-motion';

// Dark bento hero wrapper: dot-grid texture, cursor spotlight, ambient blobs,
// bottom wave. `children` may be a render-prop `({ tiltX, tiltY }) => node`
// so a variant can tilt a photo/visual card in sync with the cursor.
const HeroShell = ({ children }) => {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-[#f1eefd] via-[#f7f5ff] to-[#e9e5ff]">
      {/* Precision Square Grid Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Mesh Gradients (Soft glow) */}
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-200/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[550px] h-[550px] bg-indigo-200/30 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Clean elegant orbit tracks (Visible) */}
      <div className="absolute right-[-12%] top-[3%] w-[850px] h-[850px] pointer-events-none hidden lg:flex items-center justify-center opacity-40">
        <div className="absolute w-[360px] h-[360px] rounded-full border border-dashed border-indigo-300/40" />
        <div className="absolute w-[530px] h-[530px] rounded-full border border-dashed border-indigo-200/30" />
        <div className="absolute w-[710px] h-[710px] rounded-full border border-dashed border-indigo-200/20" />
      </div>
      
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 pt-24 pb-16 relative z-10">
        {children}
      </div>
    </section>
  );
};

export default HeroShell;
