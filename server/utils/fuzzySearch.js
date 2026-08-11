const Fuse = require('fuse.js');

// Same tuning as the client-side engine (utils/fuzzySearch.js on the client) — kept in sync so a
// search feels the same everywhere: one typo still matches, matches anywhere in the text (not
// just from the start of a word).
const DEFAULT_OPTIONS = {
  threshold: 0.3,
  ignoreLocation: true,
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 2,
};

// Splits a long free-text field into individual words before fuzzy-matching. Matching a short
// query against an entire paragraph as one blob finds spurious matches (a longer string offers
// more possible loose character alignments for the same threshold) — word-level matching keeps
// every field at the same granularity a short one (like a name) was actually tuned for. Use via
// a key's `getFn`, e.g. `{ name: 'profile.headline', getFn: u => tokenize(u.profile?.headline) }`.
const tokenize = (value) => {
  const arr = Array.isArray(value) ? value : [value];
  return arr.filter(Boolean).flatMap(s => String(s).split(/[^a-zA-Z0-9]+/).filter(w => w.length >= 2));
};

/**
 * Fuzzy-ranks a Mongoose/plain-object array against `query` across `keys`, for endpoints that
 * used to build a `$regex` OR-condition for a `search` query param. Meant to run AFTER any other
 * Mongo-level filters (role, ownership, status, etc.) have already narrowed the set — this does
 * the typo-tolerant text ranking in memory, which is fine at the collection sizes a $regex
 * pre-filter was already comfortable scanning in full.
 *
 * Returns plain objects (via toObject() for Mongoose docs) annotated with `_fuzzyMatches`, in
 * relevance order. Empty/whitespace query returns the input unchanged (order preserved).
 */
const fuzzyRank = (items, query, keys, options = {}) => {
  const trimmed = (query || '').trim();
  const plain = items.map(item => (typeof item?.toObject === 'function' ? item.toObject() : item));
  if (!trimmed) return plain;

  const fuse = new Fuse(plain, { ...DEFAULT_OPTIONS, ...options, keys });
  return fuse.search(trimmed).map(result => ({
    ...result.item,
    _fuzzyMatches: result.matches || [],
    _fuzzyScore: result.score,
  }));
};

/** Slices an already-ranked array into a page — for endpoints that paginate in memory now that
 *  the search itself can no longer be pushed down into a Mongo query/skip/limit. */
const paginate = (items, page = 1, perPage = 20) => {
  const p = Math.max(1, parseInt(page) || 1);
  const start = (p - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    total: items.length,
    page: p,
    totalPages: Math.max(1, Math.ceil(items.length / perPage)),
  };
};

module.exports = { fuzzyRank, paginate, tokenize };
