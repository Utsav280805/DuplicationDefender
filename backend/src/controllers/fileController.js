const path = require('path');
const fs = require('fs').promises;
const File = require('../models/File');
const DownloadHistory = require('../models/DownloadHistory');
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
    }
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
};

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const uploadsDir = path.join(__dirname, '../../uploads');
    await createDirectoryIfNotExists(uploadsDir);

    const fileExists = await File.findOne({
      originalName: req.file.originalname,
      userId: req.user._id
    });

    if (fileExists) {
      // Remove the uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File with this name already exists'
      });
    }

    const file = new File({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      userId: req.user._id
    });

    await file.save();

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: file._id,
        originalName: file.originalName,
        size: file.size,
        uploadedAt: file.createdAt
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    // Clean up uploaded file if there was an error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    });
  }
};

// Get all files
exports.getAllFiles = async (req, res) => {
  try {
    const files = await File.find().populate('uploadedBy', 'username');
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ message: 'Server error fetching files' });
  }
};

// Get file by ID
exports.getFileById = async (req, res) => {
  try {
    const file = await File.findById(req.params.id).populate('uploadedBy', 'username');
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ message: 'Server error fetching file' });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if file exists in filesystem
    const fileExists = await checkExists(file.path);
    if (!fileExists) {
      await File.findByIdAndDelete(file._id);
      return res.status(404).json({
        success: false,
        message: 'File not found in storage'
      });
    }

    // Record download history
    const downloadHistory = new DownloadHistory({
      fileId: file._id,
      userId: req.user._id,
      fileName: file.originalName
    });
    await downloadHistory.save();

    res.download(file.path, file.originalName);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file'
    });
  }
};

// Check for duplicates before uploading
exports.checkForDuplicates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file provided for check' 
      });
    }

    const { size, path: filePath } = req.file;
    const fileContent = await fs.readFile(filePath);
    const fileHash = generateFileHash(fileContent);
    
    // Check for exact duplicates and similar files
    const duplicateCheck = await checkDuplicate(fileHash, size);
    
    // Extract metadata if provided
    let metadata = {};
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
    }
    
    // Find files with similar metadata
    const similarByMetadata = await findSimilarFiles(metadata) || [];
    
    // Remove the temporary file after check
    await fs.unlink(filePath);
    
    res.json({
      success: true,
      data: {
        exactDuplicates: duplicateCheck.exact,
        similarBySize: duplicateCheck.similar,
        similarByMetadata: similarByMetadata
      }
    });
    
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    // Clean up the temporary file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error checking for duplicates' 
    });
  }
};

// Get user's downloaded files
exports.getUserDownloads = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const downloads = await DownloadHistory.find({ userId })
      .populate({
        path: 'fileId',
        populate: {
          path: 'uploadedBy',
          select: 'username'
        }
      })
      .sort({ downloadedAt: -1 });
      
    const files = downloads.map(d => d.fileId);
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching user downloads:', error);
    res.status(500).json({ message: 'Server error fetching user downloads' });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if file exists in filesystem before trying to delete
    const fileExists = await checkExists(file.path);
    if (fileExists) {
      await fs.unlink(file.path);
    }

    await File.findByIdAndDelete(file._id);
    await DownloadHistory.deleteMany({ fileId: file._id });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file'
    });
  }
};

// List files
exports.listFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user._id })
      .select('originalName size createdAt')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      files: files.map(file => ({
        id: file._id,
        name: file.originalName,
        size: file.size,
        uploadedAt: file.createdAt
      }))
    });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing files'
    });
  }
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