const path = require('path');
const fs = require('fs').promises;
const File = require('../models/File');
const DownloadHistory = require('../models/DownloadHistory');
const duplicateCheck = require('../../utils/duplicateCheck');

/**
 * @typedef {import('../../utils/duplicateCheck').DuplicateResult} DuplicateResult
 */

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

// Upload file
const uploadFile = async (req, res) => {
  try {
    console.log('File upload request received:', {
      filename: req.file?.originalname,
      size: req.file?.size,
      mimetype: req.file?.mimetype,
      tempPath: req.file?.path
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const uploadsDir = path.join(__dirname, '../../uploads');
    console.log('Ensuring uploads directory exists:', uploadsDir);
    await createDirectoryIfNotExists(uploadsDir);

    // Move file from temp to permanent location
    const permanentPath = path.join(uploadsDir, req.file.filename);
    await fs.rename(req.file.path, permanentPath);
    console.log('File moved to permanent location:', permanentPath);

    // Create file record in database
    const file = new File({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: permanentPath,
      userId: req.user._id,
      department: req.body.department || 'General',
      description: req.body.description || '',
      tags: req.body.tags ? req.body.tags.split(',') : [],
      status: 'Active'
    });

    await file.save();
    console.log('File record created in database:', file._id);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: file._id,
        originalName: file.originalName,
        fileName: file.fileName,
        size: file.size,
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    console.error('Error in file upload:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
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

    console.log('Analyzing file for duplicates:', {
      filename: req.file.originalname,
      path: req.file.path,
      size: req.file.size
    });

    /** @type {DuplicateResult} */
    const results = await duplicateCheck.checkForDuplicates(req.file.path);
    
    console.log('Duplicate check completed:', {
      hasDuplicates: results.hasDuplicates,
      totalRecords: results.totalRecords,
      duplicatePairs: results.duplicates?.length || 0
    });
    
    // Delete the temporary file after analysis
    try {
      await fs.unlink(req.file.path);
      console.log('Temporary file deleted:', req.file.path);
    } catch (error) {
      console.error('Error deleting temporary file:', error);
    }

    res.json({
      success: true,
      hasDuplicates: results.hasDuplicates,
      totalRecords: results.totalRecords,
      duplicatePairs: results.duplicates?.length || 0
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

// List all files
const listFiles = async (req, res) => {
  try {
    const files = await File.find({ 
      userId: req.user._id,
      isDeleted: false 
    })
    .select('originalName fileName size createdAt department description tags status')
    .sort({ createdAt: -1 });

    // Transform the files to match the frontend expectations
    const transformedFiles = files.map(file => ({
      _id: file._id,
      name: file.originalName,
      fileName: file.fileName,
      size: file.size,
      createdAt: file.createdAt,
      department: file.department || 'General',
      description: file.description || '',
      tags: file.tags || [],
      fileType: file.originalName.split('.').pop().toLowerCase(),
      status: file.status || 'Active'
    }));

    res.json({
      success: true,
      files: transformedFiles
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
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.json({
      success: true,
      file
    });
  } catch (error) {
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
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Record download history
    const downloadHistory = new DownloadHistory({
      fileId: file._id,
      userId: req.user._id
    });
    await downloadHistory.save();

    // Update download count
    file.downloadCount += 1;
    await file.save();

    res.download(file.path, file.originalName, (err) => {
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
    const file = await File.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Soft delete the file
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
};

// Export all controller functions
module.exports = {
  uploadFile,
  checkForDuplicatesHandler,
  listFiles,
  getFileById,
  downloadFile,
  deleteFile
};