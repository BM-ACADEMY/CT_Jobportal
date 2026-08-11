import Fuse from 'fuse.js';

// Shared tuning for every fuzzy search surface in the app — one typo (an inserted, dropped, or
// swapped letter) should still match, e.g. "pondicheryd" finding "Pondicherry", without the
// threshold being so loose that unrelated results start showing up.
const DEFAULT_OPTIONS = {
  threshold: 0.3,
  ignoreLocation: true,
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 2,
};

// Splits a long free-text field (a job description, a "skill" that's actually a full sentence,
// etc.) into individual words. Fuzzy-matching a short query against an entire paragraph as one
// blob finds spurious matches — e.g. "canva" fuzzily "matching" scattered letters inside "...can
// apply..." — because a longer string offers more possible loose alignments for the same
// threshold. Matching word-by-word instead keeps every field at the same granularity as a short
// one like a job title, where the tolerance was actually tuned to make sense.
export const tokenize = (value) => {
  const arr = Array.isArray(value) ? value : [value];
  return arr.filter(Boolean).flatMap(s => String(s).split(/[^a-zA-Z0-9]+/).filter(w => w.length >= 2));
};

/**
 * Fuzzy-searches an array of objects across the given keys, tolerating typos and matching
 * anywhere in the text (not just whole-word). Returns items in relevance order, each annotated
 * with `_fuzzyMatches` (per-key match ranges, for highlighting) — falls back to the plain list
 * when the query is empty so an empty search bar always shows everything.
 *
 * @param items  Array of plain objects to search.
 * @param query  The raw search string as typed by the user.
 * @param keys   Fuse.js key list — strings for a flat field, weighted `{ name, weight }` for
 *               short fields, or `{ name, weight, getFn: (item) => tokenize(item.field) }` for
 *               long free-text fields (see `tokenize` above).
 * @param options Optional Fuse.js option overrides (e.g. a looser threshold).
 */
export const fuzzySearch = (items, query, keys, options = {}) => {
  const trimmed = (query || '').trim();
  if (!trimmed) return items.map(item => ({ ...item, _fuzzyMatches: [] }));

  const fuse = new Fuse(items, { ...DEFAULT_OPTIONS, ...options, keys });
  return fuse.search(trimmed).map(result => ({
    ...result.item,
    _fuzzyMatches: result.matches || [],
    _fuzzyScore: result.score,
  }));
};

/**
 * Pulls the matched character ranges for one field out of a `_fuzzyMatches` array (as attached
 * by `fuzzySearch`), for feeding into <HighlightText>.
 */
export const matchesForKey = (fuzzyMatches, key) =>
  (fuzzyMatches || []).find(m => m.key === key)?.indices || [];
