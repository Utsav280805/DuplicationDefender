const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Add index for faster queries
fileSchema.index({ userId: 1, originalName: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ department: 1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ isDeleted: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = File;