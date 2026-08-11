import React from 'react';

// Renders `text` with the given Fuse.js character ranges (from matchesForKey) wrapped in <mark>.
// Ranges are inclusive [start, end] pairs and can overlap/be out of order for fuzzy matches, so
// they're merged before rendering rather than trusted as-is.
const HighlightText = ({ text, ranges, className = '' }) => {
  const str = text ?? '';
  if (!ranges || ranges.length === 0) return <>{str}</>;

  const merged = [...ranges]
    .map(([start, end]) => [Math.max(0, start), Math.max(0, end)])
    .sort((a, b) => a[0] - b[0])
    .reduce((acc, [start, end]) => {
      const last = acc[acc.length - 1];
      if (last && start <= last[1] + 1) {
        last[1] = Math.max(last[1], end);
      } else {
        acc.push([start, end]);
      }
      return acc;
    }, []);

  const parts = [];
  let cursor = 0;
  merged.forEach(([start, end], i) => {
    if (start > str.length - 1) return;
    if (cursor < start) parts.push(<React.Fragment key={`t${i}`}>{str.slice(cursor, start)}</React.Fragment>);
    parts.push(
      <mark key={`m${i}`} className={`bg-emerald-200/70 text-inherit rounded-sm px-0.5 ${className}`}>
        {str.slice(start, end + 1)}
      </mark>
    );
    cursor = end + 1;
  });
  if (cursor < str.length) parts.push(<React.Fragment key="tail">{str.slice(cursor)}</React.Fragment>);

  return <>{parts}</>;
};

export default HighlightText;
