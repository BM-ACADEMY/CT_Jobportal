const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  employeeCount: {
    type: String, // e.g., "10-50", "50-200"
    trim: true
  },
  foundedYear: {
    type: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
