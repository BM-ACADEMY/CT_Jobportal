const mongoose = require('mongoose');

// A blog post written in the admin panel. The older posts still live in the client code; these are the new ones.
// The body is plain text with a few simple marks (see client/src/data/blogBody.js), never raw HTML.
const blogPostSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 80 },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  excerpt: { type: String, default: '', trim: true, maxlength: 300 },
  body: { type: String, default: '', maxlength: 50000 },
  coverImage: { type: String, default: '', maxlength: 500 },
  coverAlt: { type: String, default: '', maxlength: 160 },
  category: { type: String, default: 'Career advice', trim: true, maxlength: 40 },
  tags: [{ type: String, trim: true, maxlength: 30 }],
  readMinutes: { type: Number, default: 1 },
  authorName: { type: String, default: 'Velai Vaaipu', trim: true, maxlength: 60 },
  seoTitle: { type: String, default: '', trim: true, maxlength: 70 },
  seoDescription: { type: String, default: '', trim: true, maxlength: 170 },
  status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
  publishedAt: { type: Date, default: null, index: true },
  createdBy: { type: String, default: '' },
  updatedBy: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('BlogPost', blogPostSchema);
