// Blog posts written in the admin panel.
//   Public:  GET /api/blogs , GET /api/blogs/:slug               (published posts only)
//   Admin:   GET/POST /api/admin/blog-posts , GET/PUT/DELETE /api/admin/blog-posts/:id , POST /api/admin/blog-images
const path = require('path');
const fs = require('fs');
const BlogPost = require('../models/BlogPost');
const { cleanPost } = require('../utils/blogPost');

const LIST_FIELDS = 'slug title excerpt coverImage coverAlt category tags readMinutes authorName publishedAt';
const reservedSlugs = () => { try { return require('../utils/seoPages').blogSlugs(); } catch { return []; } };
const isId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v));

const listPublic = async (req, res) => {
  try {
    const posts = await BlogPost.find({ status: 'published', publishedAt: { $lte: new Date() } }).select(LIST_FIELDS).sort({ publishedAt: -1 }).limit(100).lean();
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ posts });
  } catch (err) {
    console.error('Blog list error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getPublic = async (req, res) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase();
    const post = await BlogPost.findOne({ slug, status: 'published', publishedAt: { $lte: new Date() } }).select(`${LIST_FIELDS} body seoTitle seoDescription updatedAt`).lean();
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ post });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

const listAdmin = async (req, res) => {
  try {
    const posts = await BlogPost.find({}).select(`${LIST_FIELDS} status updatedAt`).sort({ updatedAt: -1 }).limit(300).lean();
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

const getAdmin = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ msg: 'Invalid id' });
    const post = await BlogPost.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    res.json({ post });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

const saveFrom = async (req, res, existing) => {
  const { error, fields } = cleanPost(req.body, { reserved: reservedSlugs() });
  if (error) return res.status(400).json({ msg: error });

  const clash = await BlogPost.findOne({ slug: fields.slug }).select('_id').lean();
  if (clash && String(clash._id) !== String(existing?._id)) return res.status(409).json({ msg: 'Another post already uses that web address.' });

  const who = req.user?.name || req.user?.id || '';
  if (!existing) {
    const post = await BlogPost.create({ ...fields, publishedAt: fields.status === 'published' ? new Date() : null, createdBy: who, updatedBy: who });
    return res.status(201).json({ msg: 'Saved', post });
  }
  Object.assign(existing, fields, { updatedBy: who });
  // The publish date is set the first time a post goes live and kept after that.
  if (fields.status === 'published' && !existing.publishedAt) existing.publishedAt = new Date();
  await existing.save();
  res.json({ msg: 'Saved', post: existing });
};

const createPost = async (req, res) => {
  try { await saveFrom(req, res, null); }
  catch (err) { console.error('Blog create error:', err.message); res.status(500).json({ msg: 'Server Error' }); }
};

const updatePost = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ msg: 'Invalid id' });
    const existing = await BlogPost.findById(req.params.id);
    if (!existing) return res.status(404).json({ msg: 'Post not found' });
    await saveFrom(req, res, existing);
  } catch (err) { console.error('Blog update error:', err.message); res.status(500).json({ msg: 'Server Error' }); }
};

const deletePost = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ msg: 'Invalid id' });
    const gone = await BlogPost.findByIdAndDelete(req.params.id);
    if (!gone) return res.status(404).json({ msg: 'Post not found' });
    res.json({ msg: 'Post deleted' });
  } catch (err) { res.status(500).json({ msg: 'Server Error' }); }
};

// Cover and inline pictures: checked as real images, shrunk to 1600 px wide and saved as WebP.
const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'Choose a picture (JPG, PNG or WebP, up to 8 MB).' });
    let sharp;
    try { sharp = require('sharp'); } catch { return res.status(503).json({ msg: 'Picture processing is not available on the server.' }); }
    const dir = path.join(__dirname, '../uploads/blog');
    fs.mkdirSync(dir, { recursive: true });
    const name = `post-${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;
    try {
      await sharp(req.file.buffer).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(dir, name));
    } catch {
      return res.status(400).json({ msg: 'That file is not a picture we can read.' });
    }
    res.status(201).json({ url: `/uploads/blog/${name}` });
  } catch (err) {
    console.error('Blog image error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { listPublic, getPublic, listAdmin, getAdmin, createPost, updatePost, deletePost, uploadImage };
