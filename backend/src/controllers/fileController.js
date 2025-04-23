const path = require('path');
const fs = require('fs').promises;
const File = require('../models/File');
const DownloadHistory = require('../models/DownloadHistory');
const { checkForDuplicates } = require('../../utils/duplicateCheck');
const mongoose = require('mongoose');

/**
 * @typedef {import('../../utils/duplicateCheck').DuplicateResult} DuplicateResult
 */

const { generateFileHash, checkDuplicate, findSimilarFiles } = require('../../utils/duplicateCheck');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


// Helper function to check if file/directory exists
const checkExists = async (path) => {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
};

// Helper function to create directory if it doesn't exist
const createDirectoryIfNotExists = async (dirPath) => {
  try {
    const exists = await checkExists(dirPath);
    if (!exists) {
      await fs.mkdir(dirPath, { recursive: true });
      console.log('Created directory:', dirPath);
    }
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
};

// Helper function to detect file type
const detectFileType = (filename) => {
  const extension = path.extname(filename).toLowerCase();
  switch (extension) {
    case '.csv':
      return 'csv';
    case '.xlsx':
      return 'xlsx';
    case '.json':
      return 'json';
    case '.css':
      return 'css';
    case '.dfg':
      return 'dfg';
    case '.kn':
      return 'kn';
    default:
      return 'unknown';
  }
};

// Helper function to send progress update
const sendProgress = (uploadId, progress) => {
  const clients = progressClients.get(uploadId) || [];
  const data = JSON.stringify({ type: 'progress', progress });
  
  clients.forEach(client => {
    client.write(`data: ${data}\n\n`);
  });
};

// Store SSE clients
const progressClients = new Map();

// SSE endpoint for progress updates
const uploadProgress = (req, res) => {
  const { uploadId } = req.params;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', uploadId })}\n\n`);

  // Store the client connection
  const clients = progressClients.get(uploadId) || [];
  clients.push(res);
  progressClients.set(uploadId, clients);

  // Handle client disconnect
  req.on('close', () => {
    const clients = progressClients.get(uploadId) || [];
    const index = clients.indexOf(res);
    if (index !== -1) {
      clients.splice(index, 1);
      if (clients.length === 0) {
        progressClients.delete(uploadId);
      } else {
        progressClients.set(uploadId, clients);
      }
    }
  });
};

// Helper function to send console log
const sendConsoleLog = (uploadId, message) => {
  const clients = progressClients.get(uploadId) || [];
  const data = JSON.stringify({ 
    type: 'console', 
    message: typeof message === 'object' ? JSON.stringify(message, null, 2) : message 
  });
  
  clients.forEach(client => {
    client.write(`data: ${data}\n\n`);
  });
};

// Override console.log for file upload process
const wrapConsoleLog = (uploadId) => {
  const originalLog = console.log;
  console.log = (...args) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');
    originalLog.apply(console, args);
    if (uploadId) {
      sendConsoleLog(uploadId, message);
    }
  };
  return () => {
    console.log = originalLog;
  };
};

// Upload file
const uploadFile = async (req, res) => {
  const uploadId = req.body.uploadId;
  const restoreConsole = wrapConsoleLog(uploadId);
  
  try {
    console.log('Starting file upload and analysis process...');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileType = detectFileType(req.file.originalname);
    console.log('Detected file type:', fileType);

    // Only check for duplicates in CSV and Excel files
    let duplicateResults = {
      hasDuplicates: false,
      duplicates: []
    };

    if (fileType === 'csv' || fileType === 'xlsx') {
      console.log('Starting duplicate analysis for file:', req.file.originalname);
      
      // Read file data
      const data = fileType === 'csv' ? readCSVFile(req.file.path) : readExcelFile(req.file.path);
      const totalRecords = data.length;

      console.log(`Processing ${totalRecords} records for duplicates...`);

      // Process records in batches and track progress
      const duplicates = [];
      const threshold = 90;
      let processedRecords = 0;

      for (let i = 0; i < data.length; i++) {
        for (let j = i + 1; j < data.length; j++) {
          const similarity = compareRecords(data[i], data[j]);
          if (similarity >= threshold) {
            duplicates.push({
              record1: data[i],
              record2: data[j],
              similarity: Math.round(similarity),
              rowNumber1: i + 1,
              rowNumber2: j + 1
            });
          }
        }

        processedRecords++;
        
        // Log progress every 12 records or ~5%
        if (processedRecords % 12 === 0 || processedRecords === data.length) {
          const progress = (processedRecords / totalRecords) * 100;
          console.log(`Progress: ${progress.toFixed(1)}% (${processedRecords}/${totalRecords} records)`);
        }
      }

      duplicateResults = {
        hasDuplicates: duplicates.length > 0,
        duplicates
      };

      console.log(`Duplicate detection completed. Found ${duplicates.length} potential duplicates.`);
      console.log(`Analysis completed: { totalRecords: ${totalRecords}, duplicatesFound: ${duplicates.length} }`);
      
      // Add detailed duplicate reporting
      if (duplicates.length > 0) {
        console.log('\nDetailed Duplicate Analysis:');
        console.log('------------------------');
        duplicates.forEach((dup, index) => {
          console.log(`\nDuplicate Pair ${index + 1}:`);
          console.log(`Similarity: ${dup.similarity}%`);
          console.log('Record 1 (Row ${dup.rowNumber1}):');
          console.log(JSON.stringify(dup.record1, null, 2));
          console.log('Record 2 (Row ${dup.rowNumber2}):');
          console.log(JSON.stringify(dup.record2, null, 2));
          console.log('------------------------');
        });
      }
    }

    // Create file record in database
    const file = new File({
      userId: req.user.id,
      filename: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      fileType: fileType,
      description: req.body.description || '',
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      duplicates: {
        hasDuplicates: duplicateResults.hasDuplicates,
        duplicatePairs: duplicateResults.duplicates.map(dup => ({
          original: JSON.stringify(dup.record1),
          duplicate: JSON.stringify(dup.record2),
          confidence: dup.similarity
        }))
      }
    });

    await file.save();

    return res.status(200).json({
      success: true,
      message: 'File uploaded and analyzed successfully',
      file: {
        id: file._id,
        filename: file.filename,
        fileType: file.fileType,
        size: file.size,
        uploadDate: file.uploadDate,
        description: file.description,
        tags: file.tags,
        duplicates: file.duplicates
      }
    });

  } catch (error) {
    console.error('Error in file upload and analysis:', error);

    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
        console.log('Cleaned up temporary file:', req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  } finally {
    restoreConsole();
  }
};

// List all files
const listFiles = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const files = await File.find({ userId: userId, isDeleted: false }).sort({ uploadDate: -1 });
    
    res.json({
      success: true,
      files: files.map(file => ({
        id: file._id,
        filename: file.filename,
        fileType: file.fileType,
        size: file.size,
        uploadDate: file.uploadDate,
        description: file.description,
        tags: file.tags,
        duplicates: file.duplicates
      }))
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving files',
      error: error.message
    });
  }
};

// Get file by ID
const getFileById = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const file = await File.findOne({ _id: req.params.id, userId: userId });
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Re-analyze file for duplicates if it's a CSV or Excel file
    if ((file.fileType === 'csv' || file.fileType === 'xlsx') && file.path) {
      console.log('Re-analyzing file for duplicates:', file.filename);
      const data = file.fileType === 'csv' ? readCSVFile(file.path) : readExcelFile(file.path);
      
      if (data && data.length > 0) {
        console.log(`Processing ${data.length} records for duplicates...`);
        const duplicates = [];
        const threshold = 90;

        for (let i = 0; i < data.length; i++) {
          for (let j = i + 1; j < data.length; j++) {
            const similarity = compareRecords(data[i], data[j]);
            if (similarity >= threshold) {
              duplicates.push({
                record1: data[i],
                record2: data[j],
                similarity: Math.round(similarity),
                rowNumber1: i + 1,
                rowNumber2: j + 1
              });
            }
          }
        }

        // Update file with new duplicate information
        file.duplicates = {
          hasDuplicates: duplicates.length > 0,
          duplicatePairs: duplicates.map(dup => ({
            original: JSON.stringify(dup.record1),
            duplicate: JSON.stringify(dup.record2),
            confidence: dup.similarity,
            rowNumber1: dup.rowNumber1,
            rowNumber2: dup.rowNumber2
          }))
        };
        await file.save();
        
        console.log(`Found ${duplicates.length} duplicates in file`);
      }
    }

    const response = {
      success: true,
      file: {
        id: file._id,
        filename: file.filename,
        fileType: file.fileType,
        size: file.size,
        uploadDate: file.uploadDate,
        description: file.description,
        tags: file.tags,
        duplicates: file.duplicates
      }
    };

    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Error getting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving file',
      error: error.message
    });
  }
};

// Download file
const downloadFile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const file = await File.findOne({ _id: req.params.id, userId: userId });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Record download history
    const downloadHistory = new DownloadHistory({
      fileId: file._id,
      userId: userId
    });
    await downloadHistory.save();

    // Update download count
    file.downloadCount += 1;
    file.lastAccessed = new Date();
    await file.save();

    res.download(file.path, file.filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading file',
          error: err.message
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downloading file',
      error: error.message
    });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const file = await File.findOne({ _id: req.params.id, userId: userId });
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.error('Error deleting file from filesystem:', unlinkError);
    }

    // Delete file record from database
    await file.deleteOne();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

// Check for duplicates
const checkForDuplicatesHandler = async (req, res) => {
  console.log('Starting duplicate check process');
  try {
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileType = detectFileType(req.file.originalname);
    console.log('File type:', fileType);
    
    if (fileType !== 'csv' && fileType !== 'xlsx') {
      console.log('Invalid file type for duplicate analysis:', fileType);
      return res.status(400).json({
        success: false,
        message: 'Only CSV and Excel files can be analyzed for duplicates'
      });
    }

    console.log('Starting duplicate analysis for file:', req.file.originalname);
    const results = await checkForDuplicates(req.file.path);
    
    console.log('Duplicate analysis completed:', {
      hasDuplicates: results.hasDuplicates,
      totalRecords: results.totalRecords,
      duplicatesFound: results.duplicates.length
    });

    // If this is for an existing file, update its duplicate information
    if (req.params.id) {
      console.log('Updating existing file record:', req.params.id);
      const file = await File.findById(req.params.id);
      if (file) {
        file.duplicates = {
          hasDuplicates: results.hasDuplicates,
          duplicatePairs: results.duplicates.map(dup => ({
            original: JSON.stringify(dup.record1),
            duplicate: JSON.stringify(dup.record2),
            confidence: dup.similarity
          }))
        };
        await file.save();
        console.log('File record updated with new duplicate information');
      }
    }
    
    // Delete the temporary file after analysis
    try {
      await fs.unlink(req.file.path);
      console.log('Temporary file deleted:', req.file.path);
    } catch (error) {
      console.error('Error deleting temporary file:', error);
    }

    console.log('Sending duplicate analysis results to client');
    res.json({
      success: true,
      hasDuplicates: results.hasDuplicates,
      totalRecords: results.totalRecords,
      duplicates: results.duplicates.map(dup => ({
        original: JSON.stringify(dup.record1),
        duplicate: JSON.stringify(dup.record2),
        confidence: dup.similarity
      }))
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking for duplicates',
      error: error.message
    });
  }
};

// Export all controller functions
module.exports = {
  uploadFile,
  listFiles,
  getFileById,
  downloadFile,
  deleteFile,
  checkForDuplicatesHandler,
  uploadProgress,
};
const findDuplicates = async (filePath) => {
    const results = [];
    const duplicates = new Map();

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                // Create a unique key based on all fields
                const key = Object.values(data).join('|');
                if (duplicates.has(key)) {
                    duplicates.set(key, duplicates.get(key) + 1);
                } else {
                    duplicates.set(key, 1);
                }
                results.push(data);
            })
            .on('end', () => {
                const duplicateEntries = results.filter(data => {
                    const key = Object.values(data).join('|');
                    return duplicates.get(key) > 1;
                });

                resolve({
                    totalRows: results.length,
                    duplicateRows: duplicateEntries.length,
                    duplicates: duplicateEntries
                });
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};

const generateReport = async (duplicates, originalFilePath) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(path.dirname(originalFilePath), `duplicate-report-${timestamp}.csv`);
    
    const csvWriter = createCsvWriter({
        path: reportPath,
        header: Object.keys(duplicates[0]).map(id => ({id, title: id}))
    });

    await csvWriter.writeRecords(duplicates);
    return reportPath;
};

const scanFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const results = await findDuplicates(filePath);
        
        if (results.duplicates.length > 0) {
            const reportPath = await generateReport(results.duplicates, filePath);
            results.reportPath = reportPath;
        }

        res.json(results);
    } catch (error) {
        console.error('Error scanning file:', error);
        res.status(500).json({ error: 'Error processing file' });
    }
};

const downloadReport = async (req, res) => {
    try {
        const { reportPath } = req.query;
        if (!reportPath) {
            return res.status(400).json({ error: 'Report path not provided' });
        }

        if (!fs.existsSync(reportPath)) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.download(reportPath, path.basename(reportPath));
    } catch (error) {
        console.error('Error downloading report:', error);
        res.status(500).json({ error: 'Error downloading report' });
    }
};

module.exports = {
    scanFile,
    downloadReport
};