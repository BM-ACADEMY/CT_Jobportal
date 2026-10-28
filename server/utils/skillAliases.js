// Skills are typed as free text ("MS Excel", "excel advanced", "Microsoft Excel"). Matching on raw strings misses
// most real matches, so every skill is reduced to one canonical name before comparing.
const LEVEL_WORDS = new Set(['basic', 'basics', 'beginner', 'intermediate', 'advanced', 'expert', 'knowledge', 'skills', 'skill', 'proficiency', 'proficient', 'good', 'fluent', 'working', 'of', 'in', 'and', 'with', 'using', 'level']);

// canonical name -> spellings people use (already lowercase, punctuation removed)
const ALIASES = {
  excel: ['excel', 'ms excel', 'microsoft excel', 'msexcel', 'ms-excel', 'advanced excel', 'excel formulas', 'spreadsheets', 'spreadsheet', 'google sheets'],
  word: ['word', 'ms word', 'microsoft word', 'msword'],
  powerpoint: ['powerpoint', 'ms powerpoint', 'microsoft powerpoint', 'power point', 'ppt'],
  'ms office': ['ms office', 'microsoft office', 'msoffice', 'office'],
  tally: ['tally', 'tally erp', 'tally erp 9', 'tally prime', 'tallyprime', 'tally software'],
  accounting: ['accounting', 'accounts', 'bookkeeping', 'book keeping', 'basic accounting', 'accountancy', 'finance accounting'],
  gst: ['gst', 'gst filing', 'gst returns'],
  'data entry': ['data entry', 'typing', 'computer typing', 'data operator'],
  communication: ['communication', 'english communication', 'spoken english', 'verbal communication', 'english', 'communication english'],
  'customer service': ['customer service', 'customer support', 'customer care', 'customer relationship', 'client servicing', 'call center', 'bpo'],
  sales: ['sales', 'selling', 'business development', 'telesales', 'tele sales'],
  'digital marketing': ['digital marketing', 'online marketing', 'social media marketing', 'social media', 'seo', 'sem', 'performance marketing'],
  canva: ['canva', 'canva design'],
  'graphic design': ['graphic design', 'graphics', 'graphic designing', 'photoshop', 'adobe photoshop', 'illustrator', 'corel draw', 'coreldraw'],
  'computer basics': ['computer basics', 'computer', 'computer knowledge', 'basic computer', 'computer fundamentals', 'computer operating'],
  javascript: ['javascript', 'js', 'java script', 'ecmascript'],
  react: ['react', 'reactjs', 'react js', 'react.js'],
  node: ['node', 'nodejs', 'node js', 'node.js'],
  python: ['python', 'python3', 'python programming'],
  java: ['java', 'core java'],
  sql: ['sql', 'mysql', 'my sql', 'sql server', 'postgresql', 'postgres'],
  html: ['html', 'html5', 'html css', 'html and css'],
  css: ['css', 'css3'],
  'power bi': ['power bi', 'powerbi', 'microsoft power bi'],
  'data analysis': ['data analysis', 'data analytics', 'analytics'],
  driving: ['driving', 'driver', 'two wheeler', 'light motor vehicle', 'lmv'],
  'inventory management': ['inventory management', 'inventory', 'stock management', 'warehouse', 'store keeping'],
};

const lookup = new Map();
for (const [canonical, spellings] of Object.entries(ALIASES)) {
  for (const s of spellings) lookup.set(s, canonical);
}

const plain = (raw) => String(raw || '').toLowerCase().replace(/[^a-z0-9+#.\s]/g, ' ').replace(/\s+/g, ' ').trim();

// "MS Excel (Advanced)" -> "excel". Unknown skills fall back to their cleaned text with level words removed.
const canonicalSkill = (raw) => {
  const text = plain(raw);
  if (!text) return '';
  if (lookup.has(text)) return lookup.get(text);
  const stripped = text.split(' ').filter((w) => !LEVEL_WORDS.has(w)).join(' ').trim();
  if (lookup.has(stripped)) return lookup.get(stripped);
  return stripped || text;
};

const canonicalSet = (list) => new Set((Array.isArray(list) ? list : []).map(canonicalSkill).filter(Boolean));

module.exports = { canonicalSkill, canonicalSet };
