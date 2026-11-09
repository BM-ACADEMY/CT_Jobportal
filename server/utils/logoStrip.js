// "Hiring now" and "Partner colleges" logo strips. Only real organisations that agreed and that an admin approved. Pure rules, easy to test.
const MIN_LOGOS = 4;   // fewer than this and the strip is hidden instead of looking empty
const MAX_LOGOS = 12;

// Only PNG, JPG and WebP files from our own uploads. SVG is left out because it can carry script.
const isSafeLogo = (path) => !String(path || '').includes('..') && /^\/?uploads\/[\w\-./]+\.(png|jpe?g|webp)$/i.test(String(path || '').trim());

const shuffle = (arr, rng = Math.random) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// rows: organisations already filtered by the database (verified, consented, approved). Returns [] when too few qualify.
const buildStrip = (rows, rng = Math.random) => {
  const ok = (rows || []).filter((r) => r && r.name && isSafeLogo(r.logo));
  return ok.length < MIN_LOGOS ? [] : shuffle(ok, rng).slice(0, MAX_LOGOS);
};

module.exports = { MIN_LOGOS, MAX_LOGOS, isSafeLogo, buildStrip, shuffle };
