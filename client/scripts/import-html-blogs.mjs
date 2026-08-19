import fs from 'node:fs';
import path from 'node:path';

const sources = [
  { file: 'C:/Users/Administrator/Downloads/blog 6 .html', slug: 'it-jobs-in-pondicherry-for-freshers' },
  { file: 'C:/Users/Administrator/Downloads/Blog 5 .html', slug: 'work-from-home-jobs-in-tamil-nadu' },
  { file: 'C:/Users/Administrator/Downloads/blog 4.html', slug: 'private-jobs-in-pondicherry' },
];

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

const blogs = sources.map(({ file, slug }) => {
  const html = repairEncoding(fs.readFileSync(file, 'utf8'));
  const title = stripTags(match(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || match(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const style = match(html, /<style[^>]*>([\s\S]*?)<\/style>/i);
  const markup = match(html, /<body[^>]*>([\s\S]*?)<\/body>/i);
  const image = match(markup, /<img[^>]+(?:class=["'][^"']*(?:hero-img|hero-image)[^"']*["'][^>]*src|src)=["']([^"']+)["']/i)
    || match(markup, /<img[^>]+src=["']([^"']+)["']/i);
  const category = stripTags(match(markup, /<(?:span|div)[^>]+class=["'][^"']*(?:pill|category)[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|div)>/i)) || 'Career Guide';
  const paragraphs = [...markup.matchAll(/<p(?![^>]*(?:caption|tagline|copyright))[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((item) => stripTags(item[1])).filter((item) => item.length > 80);
  const excerpt = paragraphs[0] || 'Practical career guidance for job seekers in Pondicherry and Tamil Nadu.';
  const wordCount = stripTags(markup).split(/\s+/).length;

  return { slug, title, excerpt, category, date: '2026', readTime: `${Math.max(5, Math.ceil(wordCount / 220))} min read`, image, style, markup };
});

const target = path.resolve('src/data/importedBlogs.js');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `// Generated from the supplied HTML blog files.\nexport const IMPORTED_BLOGS = ${JSON.stringify(blogs, null, 2)};\n`, 'utf8');
console.log(`Imported ${blogs.length} blogs into ${target}`);
