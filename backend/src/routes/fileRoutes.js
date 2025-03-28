const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { processUploadedFile, findDuplicates } = require('../utils/duplicateDetection');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Route to handle file upload and scan for duplicates
router.post('/scan', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Process the uploaded file
        const { data, headers } = await processUploadedFile(req.file.path);
        
        // Find duplicates with confidence threshold
        const threshold = req.body.threshold || 0.8;
        const duplicates = await findDuplicates(data, threshold);

        res.json({
            totalRows: data.length,
            duplicateRows: duplicates.length,
            duplicates: duplicates,
            headers: headers
        });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route to download duplicate report
router.get('/download-report', (req, res) => {
    try {
        const { reportPath } = req.query;
        if (!reportPath) {
            return res.status(400).json({ error: 'Report path not provided' });
        }

        res.download(reportPath);
    } catch (error) {
        console.error('Error downloading report:', error);
        res.status(500).json({ error: 'Error downloading report' });
    }
});

module.exports = router; 