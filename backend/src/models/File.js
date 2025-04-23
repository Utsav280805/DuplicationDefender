const mongoose = require('mongoose');

const duplicatePairSchema = new mongoose.Schema({
  original: {
    type: String,
    required: true
  },
  duplicate: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true
  }
}, { _id: false });

const duplicatesSchema = new mongoose.Schema({
  hasDuplicates: {
    type: Boolean,
    default: false
  },
  duplicatePairs: [duplicatePairSchema]
}, { _id: false });

const fileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['csv', 'xlsx', 'json', 'css', 'dfg', 'kn', 'unknown']
  },

  description: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  uploadDate: {
    type: Date,
    default: Date.now
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  duplicates: {
    type: duplicatesSchema,
    default: () => ({
      hasDuplicates: false,
      duplicatePairs: []
    })
  }
}, {
  timestamps: true
});

// Add indexes
fileSchema.index({ userId: 1, uploadDate: -1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ filename: 'text', description: 'text', tags: 'text' });

const File = mongoose.model('File', fileSchema);

module.exports = File;