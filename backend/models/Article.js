const mongoose = require('mongoose');

const referenceArticleSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  }
}, { _id: false });

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  originalContent: {
    type: String,
    default: ''
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  publishedDate: {
    type: Date,
    default: Date.now
  },
  author: {
    type: String,
    default: ''
  },
  sourceUrl: {
    type: String,
    required: true
  },
  isUpdated: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date
  },
  referenceArticles: {
    type: [referenceArticleSchema],
    default: []
  }
}, {
  timestamps: true
});

// Index for faster queries (slug index is handled by unique: true)
articleSchema.index({ isUpdated: 1 });
articleSchema.index({ publishedDate: -1 });

module.exports = mongoose.model('Article', articleSchema);

