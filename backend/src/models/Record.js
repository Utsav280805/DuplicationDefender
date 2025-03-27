// @ts-nocheck
const mongoose = require('mongoose');

// Define sub-schemas first
const DuplicatePairSchema = new mongoose.Schema({
  record1Index: { type: Number, required: true },
  record2Index: { type: Number, required: true },
  similarity: { type: Number, required: true }
}, { _id: false });

const LocalStorageDuplicateSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Record', required: true },
  fileName: { type: String, required: true },
  duplicatePairs: {
    type: [{
      record1Index: { type: Number, required: true },
      record2Index: { type: Number, required: true },
      similarity: { type: Number, required: true }
    }],
    default: []
  }
}, { _id: false });

const AnalysisResultSchema = new mongoose.Schema({
  internalDuplicates: {
    count: { type: Number, default: 0 },
    pairs: {
      type: [DuplicatePairSchema],
      default: []
    }
  },
  localStorageDuplicates: {
    filesChecked: { type: Number, default: 0 },
    duplicatesFound: {
      type: [LocalStorageDuplicateSchema],
      default: []
    }
  },
  lastAnalyzed: { type: Date },
  error: { type: String }
}, { _id: false });

const recordSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['XLSX', 'XLS', 'CSV']
  },
  filePath: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    default: 'Unassigned',
    trim: true
  },
  tags: {
    type: [String],
    default: []
  },
  accessLevel: {
    type: String,
    enum: ['private', 'public', 'shared'],
    default: 'private'
  },
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'analyzed', 'error'],
    default: 'pending'
  },
  analysisResult: {
    type: AnalysisResultSchema,
    default: () => ({
      internalDuplicates: {
        count: 0,
        pairs: []
      },
      localStorageDuplicates: {
        filesChecked: 0,
        duplicatesFound: []
      },
      lastAnalyzed: null,
      error: null
    })
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create indexes for faster querying
recordSchema.index({ name: 1, createdBy: 1 });
recordSchema.index({ department: 1, createdBy: 1 });
recordSchema.index({ status: 1, createdBy: 1 });

// Update the updatedAt timestamp before saving
recordSchema.pre(['save'], function(next) {
  this.updatedAt = new Date();
  next();
});

// @ts-ignore
const Record = mongoose.model('Record', recordSchema);

module.exports = { Record }; 