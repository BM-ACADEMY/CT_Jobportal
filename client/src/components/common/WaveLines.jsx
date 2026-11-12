import React from 'react';

// Brand wave-line motif (home CTA, footer, contact, plans). Stretches to fill its parent,
// so use it on wide areas; tall narrow panels bend the curves.
const WaveLines = ({ id, color = '#34B678', className = '' }) => (
  <svg className={`absolute inset-0 h-full w-full pointer-events-none ${className}`} viewBox="0 0 1000 300" preserveAspectRatio="none" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor={color} stopOpacity="0" />
        <stop offset="0.45" stopColor={color} stopOpacity="0.45" />
        <stop offset="1" stopColor={color} stopOpacity="0.08" />
      </linearGradient>
    </defs>
    {Array.from({ length: 12 }, (_, i) => (
      <path
        key={i}
        d={`M0 ${210 + i * 6} C 220 ${120 + i * 8}, 420 ${300 - i * 4}, 640 ${150 + i * 5} S 900 ${30 + i * 6}, 1000 ${50 + i * 5}`}
        stroke={`url(#${id})`}
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    ))}
  </svg>
);

export default WaveLines;
