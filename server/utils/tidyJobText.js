// Small clean-up so listings look consistent: "business development executive" -> "Business Development Executive",
// "bengaluru" -> "Bengaluru". Words already in capitals (IT, BPO) and words with digits or symbols are left alone.
const SMALL = new Set(['and', 'or', 'of', 'the', 'for', 'to', 'in', 'at', 'a', 'an', 'with', 'on']);

const tidyWord = (w, i) => {
  const m = /^([a-z]+)([,.]?)$/i.exec(w);
  if (!m) return w;                               // &, digits, "C++", "node.js"
  if (m[2]) return tidyWord(m[1], i) + m[2];      // trailing comma or full stop
  if (w === w.toUpperCase() && w.length > 1) return w; // acronyms
  const lower = w.toLowerCase();
  if (i > 0 && SMALL.has(lower)) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const tidyJobText = (v) => {
  if (typeof v !== 'string') return v;
  return v.trim().replace(/\s+/g, ' ').split(' ').map(tidyWord).join(' ');
};

module.exports = { tidyJobText };
