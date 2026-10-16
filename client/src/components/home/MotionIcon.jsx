import React from 'react';

// Lucide icon with a CSS motion preset (see "MotionIcon presets" in index.css).
// animation: float | wiggle | pulse | bounce | spin | tilt | nudge | pop
// trigger: 'loop' plays continuously, 'hover' plays while the nearest `.group` ancestor is hovered.
const MotionIcon = ({ icon: Icon, animation = 'float', trigger = 'loop', delay = 0, className = '', ...iconProps }) => (
  <span
    className={`mi ${trigger === 'hover' ? 'mi-hover-' : 'mi-'}${animation} ${className}`}
    style={delay ? { animationDelay: `${delay}s` } : undefined}
    aria-hidden="true"
  >
    <Icon {...iconProps} />
  </span>
);

export default MotionIcon;
