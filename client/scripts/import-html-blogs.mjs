import fs from 'node:fs';
import path from 'node:path';

const sources = [
  { file: 'C:/Users/Administrator/Downloads/Blog 10  (2).html', slug: 'jobs-in-tindivanam', date: 'Sep 5, 2026' },
  { file: 'C:/Users/Administrator/Downloads/blog 9  (1).html', slug: 'jobs-in-villupuram', date: 'Sep 3, 2026' },
  { file: 'C:/Users/Administrator/Downloads/Blog 8  (1).html', slug: 'jobs-in-cuddalore', date: 'Sep 1, 2026' },
  { file: 'C:/Users/Administrator/Downloads/Blog 7 .html', slug: 'part-time-jobs-for-college-students-in-pondicherry', date: 'Aug 30, 2026' },
  { file: 'C:/Users/Administrator/Downloads/blog 6 .html', slug: 'it-jobs-in-pondicherry-for-freshers', date: 'Aug 28, 2026' },
  { file: 'C:/Users/Administrator/Downloads/Blog 5 .html', slug: 'work-from-home-jobs-in-tamil-nadu', date: 'Aug 26, 2026' },
  { file: 'C:/Users/Administrator/Downloads/blog 4.html', slug: 'private-jobs-in-pondicherry', date: 'Aug 24, 2026' },
  { file: 'C:/Users/Administrator/Downloads/Blog 3 .html', slug: 'walk-in-interviews-in-pondicherry', date: 'Aug 19, 2026' },
  { file: 'C:/Users/Administrator/Downloads/fresher-jobs-in-pondicherry.html', slug: 'fresher-jobs-in-pondicherry', date: 'Aug 17, 2026' },
  { file: 'C:/Users/Administrator/Downloads/jobs-in-pondicherry-today.html', slug: 'jobs-in-pondicherry-today', date: 'Aug 13, 2026' },
];

// Keep every editorial image unique across the blog collection. Replacements are
// applied during import so supplied article markup and heading order stay intact.
const imageReplacements = {
  'jobs-in-tindivanam': {
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80': 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=82',
  },
  'jobs-in-villupuram': {
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80': 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=82',
  },
  'jobs-in-cuddalore': {
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1400&q=82',
  },
  'it-jobs-in-pondicherry-for-freshers': {
    'https://images.unsplash.com/photo-1766066014237-00645c74e9c6?auto=format&fit=crop&w=1200&q=80': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?auto=format&fit=crop&w=1200&q=80': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=82',
  },
  'work-from-home-jobs-in-tamil-nadu': {
    'https://images.unsplash.com/photo-1766066014237-00645c74e9c6?auto=format&fit=crop&w=1200&q=80': 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=82',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=82',
  },
  'jobs-in-pondicherry-today': {
    'https://images.pexels.com/photos/4101343/pexels-photo-4101343.jpeg?auto=compress&cs=tinysrgb&w=1400': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1400&q=82',
  },
  'fresher-jobs-in-pondicherry': {
    'https://images.pexels.com/photos/15505437/pexels-photo-15505437.jpeg?auto=compress&cs=tinysrgb&w=1400': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=82',
  },
};

const stripTags = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const match = (html, expression) => html.match(expression)?.[1]?.trim() || '';

// The exported HTML files contain UTF-8 text that was previously decoded as Windows-1252.
const cp1252 = { 0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f };
const repairEncoding = (value) => {
  if (!/[ÃÂâð]/.test(value)) return value;
  const bytes = [];
  for (const character of value) {
    const code = character.codePointAt(0);
    if (code <= 0xff) bytes.push(code);
    else if (cp1252[code] !== undefined) bytes.push(cp1252[code]);
    else return value;
  }
  return Buffer.from(bytes).toString('utf8');
};

const blogs = sources.map(({ file, slug, date }) => {
  let html = repairEncoding(fs.readFileSync(file, 'utf8'))
    .replace(/https:\/\/wa\.me\/91X{10}/g, 'https://wa.me/919944509441')
    .replace(/\+?91[- ]?X{10}/g, '+91 99445 09441')
    .replace(/📅\s*2026/g, `📅 ${date}`);
  for (const [currentImage, replacementImage] of Object.entries(imageReplacements[slug] || {})) {
    html = html.replaceAll(currentImage, replacementImage);
  }
  html = html
    .replace(/(<span[^>]*>\s*(?:📅|ðŸ“…)\s*)2026(\s*<\/span>)/g, `$1${date}$2`)
    .replace(/📍\s*Tamil Nadu, India/g, '📍 Puducherry, Tamil Nadu, India');
  const title = stripTags(match(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || match(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const style = match(html, /<style[^>]*>([\s\S]*?)<\/style>/i);
  let markup = match(html, /<body[^>]*>([\s\S]*?)<\/body>/i);
  markup = markup
    .replace(/<img\b(?![^>]*\bloading=)/gi, '<img loading="lazy" decoding="async"')
    .replace(/<img loading="lazy" decoding="async"(?=[^>]*class=["'][^"']*(?:hero-img|hero-image))/i, '<img loading="eager" decoding="async" fetchpriority="high"')
    .replace(/<a\b(?![^>]*\brel=)([^>]*href=["']https?:\/\/[^>]+)>/gi, '<a rel="noopener noreferrer"$1>');
  const image = match(markup, /<img[^>]+(?:class=["'][^"']*(?:hero-img|hero-image)[^"']*["'][^>]*src|src)=["']([^"']+)["']/i)
    || match(markup, /<img[^>]+src=["']([^"']+)["']/i);
  const category = stripTags(match(markup, /<(?:span|div)[^>]+class=["'][^"']*(?:pill|category)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i)) || 'Career Guide';
  const paragraphs = [...markup.matchAll(/<p(?![^>]*(?:caption|tagline|copyright))[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((item) => stripTags(item[1])).filter((item) => item.length > 80);
  const excerpt = paragraphs[0] || 'Practical career guidance for job seekers in Pondicherry and Tamil Nadu.';
  const wordCount = stripTags(markup).split(/\s+/).length;

  return { slug, title, excerpt, category, date, author: 'Velai Vaaipu', readTime: `${Math.max(5, Math.ceil(wordCount / 220))} min read`, image, style, markup };
});

const target = path.resolve('src/data/importedBlogs.js');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `// Generated from the supplied HTML blog files.\nexport const IMPORTED_BLOGS = ${JSON.stringify(blogs, null, 2)};\n`, 'utf8');
console.log(`Imported ${blogs.length} blogs into ${target}`);
