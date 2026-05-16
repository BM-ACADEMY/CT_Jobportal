const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  legal_name: {
    type: String,
    trim: true
  },
  display_name: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  website_url: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  headquarters_address: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  industry_tag: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  about_us: {
    type: String,
    trim: true
  },
  tagline: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  logo_url: {
    type: String,
    default: ''
  },
  cover_image_url: {
    type: String,
    default: ''
  },
  employeeCount: {
    type: String,
    trim: true
  },
  company_size_range: {
    type: String,
    trim: true
  },
  foundedYear: {
    type: Number
  },
  founded_year: {
    type: Number
  },
  mission_statement: {
    type: String,
    trim: true
  },
  culture_values: [{
    type: String
  }],
  video_intro_url: {
    type: String,
    trim: true
  },
  social_links: {
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    glassdoor: { type: String, default: '' },
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' }
  },
  work_model: [{
    type: String,
    enum: ['On-site', 'Remote', 'Hybrid']
  }],
  office_locations: [{
    type: String
  }],
  perks: {
    health_insurance: { type: Boolean, default: false },
    unlimited_pto: { type: Boolean, default: false },
    equity_package: { type: Boolean, default: false },
    learning_stipend: { type: Number, default: 0 },
    remote_stipend: { type: Number, default: 0 },
    gym_membership: { type: Boolean, default: false },
    free_meals: { type: Boolean, default: false }
  },
  tech_stack: [{
    type: String
  }],
  is_verified: {
    type: Boolean,
    default: false
  },
  tax_id_ein: {
    type: String,
    trim: true
  },
  admin_email: {
    type: String,
    lowercase: true,
    trim: true
  },
  gallery_images: [{
    type: String,
    default: ''
  }],
  norms_conditions: {
    type: String,
    trim: true
  },
  subscription_tier: {
    type: String,
    enum: ['Free', 'Basic', 'Pro', 'Enterprise'],
    default: 'Free'
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  subscriptionExpiry: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
