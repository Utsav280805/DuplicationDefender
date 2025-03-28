const mongoose = require('mongoose');

const duplicateAnalysisSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'error'],
        default: 'pending'
    },
    duplicates: [{
        recordId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Record'
        },
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
    totalRecordsAnalyzed: {
        type: Number,
        default: 0
    },
    error: String
});

const recordSchema = new mongoose.Schema({
    fileName: {
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
        enum: ['CSV', 'XLS', 'XLSX']
    },
    filePath: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    tags: [{
        type: String,
        trim: true
    }],
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    fileContent: {
        headers: [String],
        rows: [{
            type: Map,
            of: String
        }],
        rowCount: Number,
        columnCount: Number
    },
    duplicateAnalysis: {
        type: duplicateAnalysisSchema,
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

// Create indexes for faster duplicate checking
recordSchema.index({ department: 1, uploadedBy: 1 });
recordSchema.index({ 'fileContent.headers': 1 });
recordSchema.index({ originalName: 1, uploadedBy: 1 });

// Update the updatedAt timestamp before saving
recordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Record = mongoose.model('Record', recordSchema);

module.exports = { Record }; 