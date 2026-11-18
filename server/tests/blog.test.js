const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const docs = [];
class Q { constructor(rows) { this.rows = rows; } select() { return this; } sort() { return this; } limit() { return this; } lean() { return Promise.resolve(this.rows); } then(a, b) { return this.lean().then(a, b); } }
const FakeBlog = {
  find: (q) => new Q(docs.filter((d) => !q.status || d.status === q.status)),
  findOne: (q) => new Q(docs.find((d) => d.slug === q.slug && (!q.status || d.status === q.status)) || null),
  findById: async (id) => { const d = docs.find((x) => x._id === id); if (!d) return null; d.save = async function () { return this; }; return d; },
  create: async (d) => { const doc = { _id: String(docs.length + 1).padStart(24, 'a'), ...d }; docs.push(doc); return doc; },
  findByIdAndDelete: async (id) => { const i = docs.findIndex((x) => x._id === id); return i < 0 ? null : docs.splice(i, 1)[0]; },
};
const file = require.resolve(path.join(__dirname, '..', 'models', 'BlogPost'));
require.cache[file] = { id: file, filename: file, loaded: true, exports: FakeBlog };

const { cleanPost, slugify, readMinutesFor, okImage } = require('../utils/blogPost');
const ctl = require('../controllers/blogController');
const { buildSitemap } = require('../utils/seoPages');

const run = async (fn, req) => {
  const res = { code: 200, body: null, headers: {}, status(c) { this.code = c; return this; }, set(k, v) { this.headers[k] = v; return this; }, json(b) { this.body = b; return this; } };
  await fn({ user: { name: 'Kamar' }, params: {}, body: {}, ...req }, res);
  return res;
};
const longBody = 'Walk-in interviews reward people who arrive early and carry the right papers. '.repeat(5);
const good = { title: 'Walk-in interview tips', body: longBody, excerpt: 'Short.', status: 'draft' };

test('a title makes the web address; bad addresses are refused', () => {
  assert.equal(slugify('Walk-in Interview Tips!'), 'walk-in-interview-tips');
  assert.equal(cleanPost(good).fields.slug, 'walk-in-interview-tips');
  assert.match(cleanPost({ ...good, slug: 'Bad Address!' }).error, /web address/);
  assert.match(cleanPost({ title: 'தமிழ் வேலை செய்தி' }).error, /web address/); // no English letters: asks for one
  assert.equal(cleanPost({ title: 'தமிழ் வேலை செய்தி', slug: 'tamil-jobs-news' }).fields.slug, 'tamil-jobs-news');
});

test('a short title, a reserved address and a too-short published post are refused', () => {
  assert.ok(cleanPost({ title: 'Hi' }).error);
  assert.match(cleanPost(good, { reserved: ['walk-in-interview-tips'] }).error, /older post/);
  assert.match(cleanPost({ ...good, body: 'too short', status: 'published' }).error, /200 characters/);
  assert.ok(cleanPost({ ...good, body: 'draft is ok short', status: 'draft' }).fields);
});

test('covers must be our own uploads or https; tags are trimmed and capped; reading time is counted', () => {
  assert.equal(okImage('/uploads/blog/post-1-2.webp'), true);
  assert.equal(okImage('https://x.in/a.jpg'), true);
  assert.equal(okImage(''), true);
  assert.equal(okImage('javascript:alert(1)'), false);
  assert.equal(okImage('/uploads/../secret.png'), false);
  assert.equal(okImage('http://x.in/a.jpg'), false);
  assert.ok(cleanPost({ ...good, coverImage: 'javascript:alert(1)' }).error);
  assert.deepEqual(cleanPost({ ...good, tags: ' a , b ,, c ' }).fields.tags, ['a', 'b', 'c']);
  assert.equal(cleanPost({ ...good, tags: Array(20).fill('t') }).fields.tags.length, 8);
  assert.equal(readMinutesFor('word '.repeat(450)), 3);
  assert.equal(readMinutesFor(''), 1);
});

test('creating a post saves it as a draft with no publish date; publishing sets the date once', async () => {
  docs.length = 0;
  const made = await run(ctl.createPost, { body: good });
  assert.equal(made.code, 201);
  assert.equal(made.body.post.publishedAt, null);
  const id = made.body.post._id;
  const pub = await run(ctl.updatePost, { params: { id }, body: { ...good, status: 'published' } });
  assert.equal(pub.code, 200);
  const first = docs[0].publishedAt;
  assert.ok(pub.body.post.publishedAt instanceof Date);
  const again = await run(ctl.updatePost, { params: { id }, body: { ...good, status: 'published', title: 'Walk-in interview tips, updated' } });
  assert.equal(again.code, 200);
  assert.equal(again.body.post.publishedAt, pub.body.post.publishedAt, 'date stays the same');
  void first;
});

test('two posts cannot share a web address', async () => {
  docs.length = 0;
  await run(ctl.createPost, { body: good });
  const second = await run(ctl.createPost, { body: good });
  assert.equal(second.code, 409);
});

test('the public sees published posts only, by address, and drafts return not found', async () => {
  docs.length = 0;
  docs.push({ _id: 'a'.repeat(24), slug: 'live', title: 'Live', status: 'published', publishedAt: new Date(Date.now() - 1000), body: 'x' });
  docs.push({ _id: 'b'.repeat(24), slug: 'secret', title: 'Secret', status: 'draft', publishedAt: null, body: 'y' });
  const list = await run(ctl.listPublic, {});
  assert.deepEqual(list.body.posts.map((p) => p.slug), ['live']);
  assert.equal((await run(ctl.getPublic, { params: { slug: 'live' } })).code, 200);
  assert.equal((await run(ctl.getPublic, { params: { slug: 'secret' } })).code, 404);
  assert.equal((await run(ctl.getPublic, { params: { slug: 'nope' } })).code, 404);
});

test('delete and bad ids behave', async () => {
  docs.length = 0;
  await run(ctl.createPost, { body: good });
  assert.equal((await run(ctl.deletePost, { params: { id: 'zzz' } })).code, 400);
  assert.equal((await run(ctl.deletePost, { params: { id: 'f'.repeat(24) } })).code, 404);
  assert.equal((await run(ctl.deletePost, { params: { id: docs[0]._id } })).code, 200);
});

test('uploading with no picture is refused', async () => {
  assert.equal((await run(ctl.uploadImage, {})).code, 400);
});

test('published posts appear in the sitemap', () => {
  const xml = buildSitemap({ posts: [{ slug: 'walk-in-interview-tips', updatedAt: new Date('2026-11-09') }] });
  assert.match(xml, /\/blog\/walk-in-interview-tips/);
  assert.match(xml, /2026-11-09/);
  assert.ok(buildSitemap({}).includes('<urlset'));
});
