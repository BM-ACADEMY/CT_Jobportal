import { IMPORTED_BLOGS } from './importedBlogs';

// Read time comes from each article's own text (about 200 words a minute), not a typed-in
// value, so it stays right when an article is edited.
const WORDS_PER_MINUTE = 200;
const wordCount = (html = '') =>
  html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

export const readTimeFor = (blog) => {
  const words = wordCount(blog.markup);
  if (!words) return blog.readTime;
  return `${Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))} min read`;
};

export const BLOGS = IMPORTED_BLOGS.map((blog) => ({ ...blog, readTime: readTimeFor(blog) }));

export const RECENT_BLOGS = BLOGS.slice(0, 2);
