const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { auth } = require('../middleware/auth');
const fileController = require('../controllers/fileController');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const tempDir = path.join(__dirname, '../../uploads/temp');
        try {
            await fs.access(tempDir);
        } catch {
            await fs.mkdir(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    console.log('Received file:', file);
    const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Common MIME types for CSV files
        'application/csv',
        'text/x-csv',
        'application/x-csv',
        'text/comma-separated-values',
        'text/x-comma-separated-values'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only CSV, XLS, and XLSX files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
    if (err) {
        console.error('Multer error:', err);
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File size too large. Maximum size is 10MB.'
                });
            }
            return res.status(400).json({
                success: false,
                message: 'File upload error',
                error: err.message
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

// Authentication and File Upload Routes
router.post('/upload', auth, (req, res, next) => {
    console.log('Upload route hit');
    console.log('Request headers:', req.headers);
    
    upload.single('file')(req, res, async (err) => {
        if (err) {
            return handleMulterError(err, req, res, next);
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log('File received:', req.file);
        console.log('Form data:', req.body);

        try {
            const result = await fileController.uploadFile(req, res);
            console.log('Upload result:', result);
            return result;
        } catch (error) {
            console.error('Error in upload controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error processing file',
                error: error.message
            });
        }
    });
});

router.post('/analyze', auth, (req, res, next) => {
    console.log('Analyze route hit');
    upload.single('file')(req, res, async (err) => {
        if (err) {
            console.error('Upload error:', err);
            return handleMulterError(err, req, res, next);
        }
        console.log('File uploaded successfully, calling controller');
        try {
            const result = await fileController.checkForDuplicatesHandler(req, res);
            console.log('Analyze result:', result);
            return result;
        } catch (error) {
            console.error('Error in analyze controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Error processing file',
                error: error.message
            });
        }
    });
});

// File Retrieval and Deletion Routes
router.get('/download/:id', auth, fileController.downloadFile);
router.get('/list', auth, fileController.listFiles);
router.get('/:id', auth, fileController.getFileById);
router.delete('/:id', auth, fileController.deleteFile);

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
    });
});

module.exports = router;
