// @ts-nocheck
const mongoose = require('mongoose');

// Duplicate pair inside a file
const DuplicatePairSchema = new mongoose.Schema({
  record1Index: { type: Number, required: true },
  record2Index: { type: Number, required: true },
  similarity: { type: Number, required: true }
}, { _id: false });

// Duplicate matches against local storage files
const LocalStorageDuplicateSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Record', required: true },
  fileName: { type: String, required: true },
  duplicatePairs: {
    type: [DuplicatePairSchema],
    default: []
  }
}, { _id: false });

// Internal + local storage analysis
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

// Cross-dataset duplicate detection
const DuplicateAnalysisSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'error'],
    default: 'pending'
  },
  duplicates: [{
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Record' },
    fileName: String,
    uploadDate: Date,
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    matchedFields: [{
      fieldName: String,
      similarity: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      }
    }],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending'
    }
  }],
  lastAnalyzedAt: Date,
  totalRecordsAnalyzed: { type: Number, default: 0 },
  error: String
});

// Main record schema
const recordSchema = new mongoose.Schema({
  fileName: { type: String, required: true, trim: true },
  originalName: { type: String, required: true },
  fileType: {
    type: String,
    required: true,
    enum: ['CSV', 'XLS', 'XLSX']
  },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  department: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  tags: [{ type: String, trim: true }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  fileContent: {
    headers: [String],
    rows: [{ type: Map, of: String }],
    rowCount: Number,
    columnCount: Number
  },
  analysisResult: {
    type: AnalysisResultSchema,
    default: () => ({
      internalDuplicates: { count: 0, pairs: [] },
      localStorageDuplicates: { filesChecked: 0, duplicatesFound: [] },
      lastAnalyzed: null,
      error: null
    })
  },
  duplicateAnalysis: {
    type: DuplicateAnalysisSchema,
    default: () => ({
      status: 'pending',
      duplicates: [],
      totalRecordsAnalyzed: 0,
      lastAnalyzedAt: new Date()
    })
  }
}, {
  timestamps: true
});

// Indexes for faster queries
recordSchema.index({ fileName: 1, uploadedBy: 1 });
recordSchema.index({ department: 1, uploadedBy: 1 });
recordSchema.index({ 'fileContent.headers': 1 });
recordSchema.index({ originalName: 1, uploadedBy: 1 });

// Pre-save middleware for updatedAt
recordSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Model export
const Record = mongoose.model('Record', recordSchema);
module.exports = { Record };
