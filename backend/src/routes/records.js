const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const csv = require('csv-parse');
const xlsx = require('xlsx');
const auth = require('../middleware/auth');
const { Record } = require('../models/Record');
const { findDuplicates, processUploadedFile } = require('../utils/duplicateDetection');
const crypto = require('crypto');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Parse file contents
const parseFileContents = async (filePath, fileType) => {
    try {
        if (fileType === 'text/csv' || path.extname(filePath).toLowerCase() === '.csv') {
            const content = await fs.readFile(filePath, 'utf-8');
            return new Promise((resolve, reject) => {
                const rows = [];
                csv.parse(content, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    on_record: (record) => {
                        rows.push(record);
                        return record;
                    }
                }, (err) => {
                    if (err) reject(err);
                    const headers = Object.keys(rows[0] || {});
                    resolve({
                        headers,
                        rows,
                        rowCount: rows.length,
                        columnCount: headers.length
                    });
                });
            });
        } else {
            const workbook = xlsx.readFile(filePath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            const headers = jsonData[0];
            const rows = jsonData.slice(1).map(row => {
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = row[index]?.toString() || '';
                });
                return record;
            });
            
            return {
                headers,
                rows,
                rowCount: rows.length,
                columnCount: headers.length
            };
        }
    } catch (error) {
        console.error('Error parsing file:', error);
        throw new Error('Failed to parse file contents');
    }
};

// Helper function to clean up files
const cleanupFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Error cleaning up file:', error);
    }
};

// Get all records
router.get('/', auth, async (req, res) => {
    try {
        const records = await Record.find({ uploadedBy: req.user.id })
            .sort({ createdAt: -1 });
        res.json({ records });
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ message: 'Failed to fetch records' });
    }
});

// Scan file for duplicates
router.post('/scan-duplicates', auth, upload.single('file'), async (req, res) => {
    let uploadedFilePath = null;
    
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        uploadedFilePath = req.file.path;
        const threshold = parseFloat(req.body.threshold) || 0.8;
        
        // Process the uploaded file
        const fileContent = await processUploadedFile(uploadedFilePath);
        
        // Create a new record
        const record = new Record({
            fileName: req.file.originalname,
            filePath: uploadedFilePath,
            uploadedBy: req.user.id,
            fileContent: {
                headers: fileContent.headers,
                rowCount: fileContent.data.length
            }
        });

        await record.save();

        // Find duplicates
        const duplicates = await findDuplicates(fileContent.data, threshold);
        
        // Update record with duplicate analysis
        record.duplicateAnalysis = {
            status: 'completed',
            duplicates: duplicates,
            lastAnalyzedAt: new Date(),
            totalRecordsAnalyzed: fileContent.data.length
        };
        
        await record.save();

        res.json({
            recordId: record._id,
            duplicates: duplicates,
            totalRecords: fileContent.data.length
        });

    } catch (error) {
        console.error('Error scanning for duplicates:', error);
        if (uploadedFilePath) {
            try {
                await fs.unlink(uploadedFilePath);
            } catch (deleteError) {
                console.error('Error deleting file:', deleteError);
            }
        }
        res.status(500).json({ message: error.message || 'Failed to scan for duplicates' });
    }
});

// Get duplicates for a record
router.get('/:id/duplicates', auth, async (req, res) => {
    try {
        const record = await Record.findOne({
            _id: req.params.id,
            uploadedBy: req.user.id
        });

        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        if (!record.duplicateAnalysis || !record.duplicateAnalysis.duplicates) {
            return res.status(404).json({ message: 'No duplicate analysis found for this record' });
        }

        res.json(record.duplicateAnalysis.duplicates);
    } catch (error) {
        console.error('Error fetching duplicates:', error);
        res.status(500).json({ message: 'Failed to fetch duplicates' });
    }
});

// Upload file and analyze for duplicates
router.post('/upload', auth, upload.single('file'), (req, res, next) => {
    let uploadedFilePath = null;
    
    (async () => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            uploadedFilePath = req.file.path;
            console.log('File upload request:', {
                file: req.file,
                body: req.body
            });

            // Validate required fields
            if (!req.body.department) {
                await cleanupFile(uploadedFilePath);
                return res.status(400).json({
                    success: false,
                    message: 'Department is required'
                });
            }

            // Parse file contents
            const fileContent = await parseFileContents(uploadedFilePath, req.file.mimetype);

            // Create record with proper metadata
            const record = new Record({
                fileName: req.file.filename,
                originalName: req.file.originalname,
                fileType: req.file.mimetype.includes('csv') ? 'CSV' : 
                         req.file.mimetype.includes('spreadsheetml') ? 'XLSX' : 'XLS',
                filePath: uploadedFilePath,
                fileSize: req.file.size,
                department: req.body.department,
                description: req.body.description || '',
                tags: req.body.tags ? JSON.parse(req.body.tags) : [],
                uploadedBy: req.user.id,
                fileContent: {
                    headers: fileContent.headers,
                    rows: fileContent.rows,
                    rowCount: fileContent.rowCount,
                    columnCount: fileContent.columnCount
                },
                duplicateAnalysis: {
                    status: 'processing',
                    duplicates: [],
                    lastAnalyzedAt: new Date()
                }
            });

            // Save the record
            await record.save();
            console.log('Saved record:', record._id);

            // Start duplicate analysis in background
            findDuplicates(fileContent.rows, req.body.threshold || 0.8)
                .then(async (duplicates) => {
                    record.duplicateAnalysis = {
                        status: 'completed',
                        duplicates: duplicates,
                        lastAnalyzedAt: new Date(),
                        totalRecordsAnalyzed: fileContent.rowCount
                    };
                    await record.save();
                    console.log('Duplicate analysis completed for record:', record._id);
                })
                .catch(async (error) => {
                    console.error('Duplicate analysis error:', error);
                    record.duplicateAnalysis = {
                        status: 'error',
                        error: error.message,
                        lastAnalyzedAt: new Date()
                    };
                    await record.save();
                });

            // Return the record data
            res.json({
                success: true,
                record: {
                    _id: record._id,
                    fileName: record.fileName,
                    originalName: record.originalName,
                    fileType: record.fileType,
                    fileSize: record.fileSize,
                    department: record.department,
                    description: record.description,
                    tags: record.tags,
                    uploadedAt: record.uploadedAt,
                    duplicateAnalysis: record.duplicateAnalysis,
                    fileContent: {
                        rowCount: fileContent.rowCount,
                        columnCount: fileContent.columnCount,
                        headers: fileContent.headers
                    }
                }
            });
        } catch (error) {
            if (uploadedFilePath) {
                await cleanupFile(uploadedFilePath);
            }
            next(error);
        }
    })();
});

// Get single record with its duplicates
router.get('/:id', auth, (req, res, next) => {
    (async () => {
        try {
            const record = await Record.findOne({
                _id: req.params.id,
                uploadedBy: req.user.id
            });

            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: 'Record not found'
                });
            }

            res.json({
                success: true,
                record: {
                    _id: record._id,
                    fileName: record.originalName,
                    fileType: record.fileType,
                    fileSize: record.fileSize,
                    department: record.department,
                    description: record.description,
                    tags: record.tags,
                    uploadedAt: record.uploadedAt,
                    duplicateAnalysis: record.duplicateAnalysis,
                    fileContent: {
                        headers: record.fileContent.headers,
                        rowCount: record.fileContent.rowCount,
                        columnCount: record.fileContent.columnCount
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    })();
});

// Download record
router.get('/:id/download', auth, (req, res, next) => {
    (async () => {
        try {
            const record = await Record.findOne({
                _id: req.params.id,
                uploadedBy: req.user.id
            });

            if (!record) {
                return res.status(404).json({
                    success: false,
                    message: 'Record not found'
                });
            }

            try {
                await fs.access(record.filePath);
                res.download(record.filePath, record.originalName, async (err) => {
                    if (err) {
                        console.error('Error downloading file:', err);
                        if (!res.headersSent) {
                            res.status(500).json({
                                success: false,
                                message: 'Error downloading file',
                                error: err.message
                            });
                        }
                    }
                });
            } catch (error) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found on disk',
                    error: 'The file no longer exists on the server'
                });
            }
        } catch (error) {
            next(error);
        }
    })();
});

// Analyze existing records for duplicates
router.post('/analyze-duplicates', auth, async (req, res) => {
    try {
        const { records, threshold } = req.body;
        
        if (!records || !Array.isArray(records)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid records data'
            });
        }

        if (records.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No records to analyze'
            });
        }

        // Extract the data for duplicate analysis
        const dataToAnalyze = records.map(record => ({
            id: record.id,
            content: record.content,
            fileName: record.fileName,
            department: record.department
        }));

        // Find duplicates
        const duplicateGroups = await findDuplicates(dataToAnalyze, parseFloat(threshold) || 0.8);

        // Format duplicates in the expected structure
        const formattedDuplicates = duplicateGroups.map(group => ({
            id: group.id || crypto.randomUUID(),
            confidence: group.confidence || group.similarity || threshold,
            files: group.records.map(record => ({
                id: record.id,
                fileName: record.fileName,
                department: record.department,
                uploadedAt: record.uploadedAt || new Date().toISOString(),
                matchedFields: record.matchedFields || group.matchedFields || []
            }))
        }));

        res.json({
            success: true,
            duplicates: formattedDuplicates
        });

    } catch (error) {
        console.error('Error analyzing duplicates:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to analyze duplicates'
        });
    }
});

// Route to scan for duplicates in records
router.post('/scan-duplicates', async (req, res) => {
    try {
        const { recordIds } = req.body;
        
        if (!recordIds || !Array.isArray(recordIds)) {
            return res.status(400).json({ 
                error: 'Invalid request. recordIds array is required.' 
            });
        }

        // Get the records data from your database
        const records = await Record.find({ _id: { $in: recordIds } });
        
        if (!records.length) {
            return res.status(404).json({ 
                error: 'No records found with the provided IDs.' 
            });
        }

        // Convert records to the format expected by findDuplicates
        const data = records.map(record => record.toObject());
        
        // Use the same duplicate detection logic with a default threshold
        const duplicates = await findDuplicates(data, 0.8);

        res.json({
            totalRecords: records.length,
            duplicateRecords: duplicates.length,
            duplicates: duplicates
        });

    } catch (error) {
        console.error('Error scanning for duplicates:', error);
        res.status(500).json({ 
            error: 'Failed to scan for duplicates' 
        });
    }
});

module.exports = router;