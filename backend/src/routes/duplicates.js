const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Record = require('../models/Record');

// Scan for duplicates
router.post('/scan', auth, async (req, res) => {
  try {
    const { confidenceThreshold = 0.8, recordIds = [] } = req.body;
    
    // Get records for the user
    const query = { 
      uploadedBy: req.user.id,
      'duplicateAnalysis.status': 'completed'
    };

    // If specific records are selected, only scan those
    if (recordIds.length > 0) {
      query._id = { $in: recordIds };
    }

    const records = await Record.find(query);

    if (records.length === 0) {
      return res.json({
        success: true,
        duplicateGroups: []
      });
    }

    // Group records by similarity
    const duplicateGroups = [];
    const processedRecords = new Set();

    for (const record of records) {
      // Skip if record has already been processed
      if (processedRecords.has(record._id.toString())) continue;

      const group = {
        id: duplicateGroups.length + 1,
        confidence: 0,
        files: []
      };

      // Compare with other records
      for (const otherRecord of records) {
        if (record._id.equals(otherRecord._id) || 
            processedRecords.has(otherRecord._id.toString())) continue;

        // Calculate similarity between records
        const matchedFields = [];
        let totalConfidence = 0;
        let matchCount = 0;

        // Compare headers
        record.fileContent.headers.forEach(header => {
          if (otherRecord.fileContent.headers.includes(header)) {
            const similarity = compareFields(
              record.fileContent.rows,
              otherRecord.fileContent.rows,
              header
            );
            if (similarity >= confidenceThreshold) {
              matchedFields.push({
                fieldName: header,
                similarity
              });
              totalConfidence += similarity;
              matchCount++;
            }
          }
        });

        // If enough fields match with sufficient confidence
        if (matchCount > 0 && (totalConfidence / matchCount) >= confidenceThreshold) {
          processedRecords.add(otherRecord._id.toString());
          group.files.push({
            _id: otherRecord._id,
            fileName: otherRecord.fileName,
            originalName: otherRecord.originalName,
            department: otherRecord.department,
            uploadedAt: otherRecord.uploadedAt,
            matchedFields
          });
        }
      }

      // If duplicates were found
      if (group.files.length > 0) {
        processedRecords.add(record._id.toString());
        group.files.unshift({
          _id: record._id,
          fileName: record.fileName,
          originalName: record.originalName,
          department: record.department,
          uploadedAt: record.uploadedAt,
          matchedFields: []
        });
        group.confidence = group.files.reduce((acc, file) => 
          acc + (file.matchedFields.reduce((sum, field) => sum + field.similarity, 0) / 
                (file.matchedFields.length || 1)), 0) / group.files.length;
        duplicateGroups.push(group);
      }
    }

    res.json({
      success: true,
      duplicateGroups: duplicateGroups.sort((a, b) => b.confidence - a.confidence)
    });
  } catch (error) {
    console.error('Error scanning for duplicates:', error);
    res.status(500).json({
      success: false,
      message: 'Error scanning for duplicates'
    });
  }
});

// Helper function to compare fields between records
function compareFields(rows1, rows2, fieldName) {
  try {
    const values1 = rows1.map(row => row[fieldName]?.toLowerCase().trim());
    const values2 = rows2.map(row => row[fieldName]?.toLowerCase().trim());
    
    // Calculate Jaccard similarity
    const set1 = new Set(values1.filter(Boolean));
    const set2 = new Set(values2.filter(Boolean));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  } catch (error) {
    console.error(`Error comparing field ${fieldName}:`, error);
    return 0;
  }
}

module.exports = router; 