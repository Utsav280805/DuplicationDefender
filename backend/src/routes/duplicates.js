const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');
const { findDuplicates, processUploadedFile } = require('../utils/duplicateDetection');
const Record = require('../models/Record');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Analyze file for duplicates
router.post('/analyze', auth, upload.single('file'), async (req, res, next) => {
    let uploadedFilePath = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        uploadedFilePath = req.file.path;
        const threshold = parseFloat(req.query.threshold) || 0.8;
        
        // Process the uploaded file
        const fileContent = await processUploadedFile(uploadedFilePath);
        
        // Create a new record
        const record = new Record({
            fileName: req.file.originalname,
            filePath: uploadedFilePath,
            uploadedBy: req.user.id,
            department: req.body.department || 'General',
            fileContent: {
                headers: fileContent.headers,
                rowCount: fileContent.data.length
            },
            duplicateAnalysis: {
                status: 'processing',
                lastAnalyzedAt: new Date()
            }
        });

        await record.save();

        // Start duplicate analysis in background
        findDuplicates(fileContent, req.user.id, threshold)
            .then(async (duplicates) => {
                record.duplicateAnalysis = {
                    status: 'completed',
                    duplicates: duplicates,
                    lastAnalyzedAt: new Date(),
                    totalRecordsAnalyzed: fileContent.data.length
                };
                await record.save();
                console.log('Enhanced duplicate analysis completed for record:', record._id);
            })
            .catch(async (error) => {
                console.error('Enhanced duplicate analysis error:', error);
                record.duplicateAnalysis = {
                    status: 'error',
                    error: error.message,
                    lastAnalyzedAt: new Date()
                };
                await record.save();
            });

        res.status(200).json({
            message: 'File uploaded and analysis started',
            recordId: record._id,
            fileName: req.file.originalname
        });

    } catch (error) {
        if (uploadedFilePath) {
            try {
                await fs.unlink(uploadedFilePath);
            } catch (deleteError) {
                console.error('Error deleting file:', deleteError);
            }
        }
        next(error);
    }
});

// Get duplicate analysis results
router.get('/:id/duplicates', auth, async (req, res, next) => {
    try {
        const record = await Record.findOne({
            _id: req.params.id,
            uploadedBy: req.user.id
        });

        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }

        res.json({
            status: record.duplicateAnalysis.status,
            duplicates: record.duplicateAnalysis.duplicates || [],
            lastAnalyzedAt: record.duplicateAnalysis.lastAnalyzedAt,
            totalRecordsAnalyzed: record.duplicateAnalysis.totalRecordsAnalyzed
        });

    } catch (error) {
        next(error);
    }
});

// Download duplicates file
router.get('/download/:filename', auth, async (req, res, next) => {
    try {
        const filePath = path.join('uploads', String(req.params.filename));
        
        // Check if file exists
        await fs.access(filePath);
        
        // Set headers for file download
        res.download(filePath, String(req.params.filename), async (err) => {
            if (err) {
                next(err);
            }
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: 'File not found' });
        }
        next(error);
    }
});

module.exports = router;