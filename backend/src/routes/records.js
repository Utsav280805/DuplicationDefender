const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const csv = require('csv-parse');
const xlsx = require('xlsx');
const auth = require('../middleware/auth');
const { Record } = require('../models/Record');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Parse file contents
const parseFileContents = async (filePath, fileType) => {
  try {
    if (fileType === 'text/csv') {
      const content = await fsPromises.readFile(filePath, 'utf-8');
      return new Promise((resolve, reject) => {
        const rows = [];
        csv.parse(content, {
          columns: true,
          skip_empty_lines: true,
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

// Find duplicates in existing records
const findDuplicates = async (fileContent, userId) => {
  try {
    const existingRecords = await Record.find({
      uploadedBy: userId,
      'duplicateAnalysis.status': 'completed'
    });

    const duplicates = [];

    for (const record of existingRecords) {
      try {
        const matchedFields = [];
        let totalConfidence = 0;
        
        record.fileContent.headers.forEach(header => {
          if (fileContent.headers.includes(header)) {
            const similarity = compareFields(
              fileContent.rows,
              record.fileContent.rows,
              header
            );
            if (similarity > 0.6) { // Minimum field similarity threshold
              matchedFields.push({
                fieldName: header,
                similarity
              });
              totalConfidence += similarity;
            }
          }
        });

        if (matchedFields.length > 0) {
          const averageConfidence = totalConfidence / matchedFields.length;
          if (averageConfidence >= 0.6) { // Minimum overall similarity threshold
            duplicates.push({
              recordId: record._id,
              confidence: averageConfidence,
              matchedFields
            });
          }
        }
      } catch (error) {
        console.error(`Error analyzing record ${record._id}:`, error);
      }
    }

    return duplicates.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    console.error('Error finding duplicates:', error);
    throw error;
  }
};

// Compare two datasets' fields
const compareFields = (rows1, rows2, field) => {
  try {
    const values1 = new Set(rows1.map(record => String(record[field]).toLowerCase()));
    const values2 = new Set(rows2.map(record => String(record[field]).toLowerCase()));
    
    const intersection = new Set([...values1].filter(x => values2.has(x)));
    const union = new Set([...values1, ...values2]);
    
    return intersection.size / union.size;
  } catch (error) {
    console.error(`Error comparing field ${field}:`, error);
    return 0;
  }
};

// Get all records
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching records for user:', req.user.id);
    const records = await Record.find({ uploadedBy: req.user.id })
      .sort({ createdAt: -1 });

    console.log('Found records:', records.length);
    
    res.json({
      success: true,
      records: records.map(record => ({
        _id: record._id,
        fileName: record.fileName,
        originalName: record.originalName,
        fileType: record.fileType,
        fileSize: record.fileSize,
        department: record.department,
        description: record.description || '',
        tags: record.tags || [],
        uploadedAt: record.uploadedAt || record.createdAt,
        duplicateAnalysis: {
          status: record.duplicateAnalysis?.status || 'pending',
          duplicatesCount: record.duplicateAnalysis?.duplicates?.length || 0,
          lastAnalyzedAt: record.duplicateAnalysis?.lastAnalyzedAt
        },
        fileContent: {
          rowCount: record.fileContent?.rowCount || 0,
          columnCount: record.fileContent?.columnCount || 0,
          headers: record.fileContent?.headers || []
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching records'
    });
  }
});

// Upload file and analyze for duplicates
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('File upload request:', {
      file: req.file,
      body: req.body
    });

    // Validate required fields
    if (!req.body.department) {
      await fsPromises.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Department is required'
      });
    }

    // Parse file contents
    const fileContent = await parseFileContents(req.file.path, req.file.mimetype);

    // Create record with proper metadata
    const record = new Record({
      fileName: req.file.originalname, // Use original name as fileName
      originalName: req.file.originalname,
      fileType: req.file.mimetype.includes('csv') ? 'CSV' : 
                req.file.mimetype.includes('spreadsheetml') ? 'XLSX' : 'XLS',
      filePath: req.file.path,
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
    console.log('Saved record:', record);

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
        duplicateAnalysis: {
          status: record.duplicateAnalysis.status,
          duplicatesCount: 0,
          lastAnalyzedAt: record.duplicateAnalysis.lastAnalyzedAt
        }
      }
    });

    // Start duplicate analysis in background
    findDuplicates(fileContent, req.user.id)
      .then(async (duplicates) => {
        record.duplicateAnalysis = {
          status: 'completed',
          duplicates: duplicates,
          lastAnalyzedAt: new Date()
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
  } catch (error) {
    console.error('Upload error:', error);
    
    if (req.file) {
      try {
        await fsPromises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file after failed upload:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading file'
    });
  }
});

// Merge records
router.post('/merge', auth, async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;

    const sourceRecord = await Record.findOne({
      _id: sourceId,
      createdBy: req.user._id
    });

    const targetRecord = await Record.findOne({
      _id: targetId,
      createdBy: req.user._id
    });

    if (!sourceRecord || !targetRecord) {
      return res.status(404).json({
        success: false,
        message: 'One or both records not found'
      });
    }

    // Delete source file
    if (fs.existsSync(sourceRecord.filePath)) {
      fs.unlinkSync(sourceRecord.filePath);
    }

    // Delete source record
    await Record.findByIdAndDelete(sourceId);

    // Update target record status
    targetRecord.status = 'verified';
    await targetRecord.save();

    res.json({
      success: true,
      message: 'Records merged successfully',
      record: {
        _id: targetRecord._id,
        name: targetRecord.name,
        status: targetRecord.status
      }
    });
  } catch (error) {
    console.error('Error merging records:', error);
    res.status(500).json({
      success: false,
      message: 'Error merging records'
    });
  }
});

// Download record
router.get('/:id/download', auth, async (req, res) => {
  try {
    const record = await Record.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    if (!fs.existsSync(record.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.download(record.filePath, record.originalName);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading file'
    });
  }
});

// Get single record
router.get('/:id', auth, async (req, res) => {
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
    console.error('Error fetching record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching record'
    });
  }
});

// Get duplicate analysis results
router.get('/:id/duplicates', auth, async (req, res) => {
  try {
    const record = await Record.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id
    }).populate('duplicateAnalysis.duplicates.recordId');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: record.duplicateAnalysis.status,
        duplicates: record.duplicateAnalysis.duplicates,
        lastAnalyzedAt: record.duplicateAnalysis.lastAnalyzedAt
      }
    });
  } catch (error) {
    console.error('Error fetching duplicates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching duplicate analysis'
    });
  }
});

// Ignore duplicate
router.post('/:id/ignore', auth, async (req, res) => {
  try {
    const recordId = req.params.id;
    const record = await Record.findOne({
      _id: recordId,
      createdBy: req.user._id
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    record.status = 'rejected';
    await record.save();

    res.json({
      success: true,
      message: 'Duplicate ignored successfully'
    });
  } catch (error) {
    console.error('Error ignoring duplicate:', error);
    res.status(500).json({
      success: false,
      message: 'Error ignoring duplicate'
    });
  }
});

module.exports = router; 