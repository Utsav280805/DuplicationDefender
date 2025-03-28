import axios from 'axios';
import { API_ENDPOINTS, getAuthHeaders, handleApiError } from '../config/api';

export const getAllRecords = async () => {
  try {
    console.log('Fetching records...');
    
    const response = await axios.get(API_ENDPOINTS.RECORDS.LIST, {
      headers: getAuthHeaders()
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to fetch records');
    }

    const records = response.data.records;
    if (!Array.isArray(records)) {
      console.error('Invalid records data:', records);
      return [];
    }

    return records.map(record => ({
      _id: record._id,
      fileName: record.fileName || record.originalName,
      originalName: record.originalName || record.fileName,
      fileType: record.fileType || record.fileName?.split('.').pop().toUpperCase() || 'Unknown',
      fileSize: parseInt(record.fileSize) || 0,
      department: record.department || 'Unspecified',
      description: record.description || '',
      tags: Array.isArray(record.tags) ? record.tags : [],
      uploadedAt: record.uploadedAt || record.createdAt || new Date().toISOString(),
      duplicateAnalysis: {
        status: record.duplicateAnalysis?.status || 'pending',
        duplicatesCount: record.duplicateAnalysis?.duplicatesCount || 0,
        lastAnalyzedAt: record.duplicateAnalysis?.lastAnalyzedAt,
        duplicates: record.duplicateAnalysis?.duplicates || []
      }
    }));
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const uploadFile = async (formData) => {
  try {
    const response = await axios.post(API_ENDPOINTS.RECORDS.UPLOAD, formData, {
      headers: getAuthHeaders('multipart/form-data')
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Upload failed');
    }

    const recordData = response.data.record || response.data.data;
    return {
      _id: recordData._id,
      fileName: recordData.fileName || formData.get('fileName'),
      originalName: recordData.originalName || formData.get('originalName'),
      fileType: recordData.fileType || formData.get('fileType'),
      fileSize: recordData.fileSize || formData.get('fileSize'),
      department: recordData.department || formData.get('department'),
      description: recordData.description || formData.get('description'),
      tags: recordData.tags || JSON.parse(formData.get('tags') || '[]'),
      uploadedAt: recordData.uploadedAt || recordData.createdAt || new Date().toISOString(),
      duplicateAnalysis: {
        status: recordData.duplicateAnalysis?.status || 'processing',
        duplicatesCount: recordData.duplicateAnalysis?.duplicatesCount || 0,
        lastAnalyzedAt: recordData.duplicateAnalysis?.lastAnalyzedAt
      }
    };
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const getRecordDetails = async (recordId) => {
  try {
    if (!recordId) throw new Error('Record ID is required');

    const response = await axios.get(API_ENDPOINTS.RECORDS.GET(recordId), {
      headers: getAuthHeaders()
    });
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to get record details');
    }
    
    return response.data.record;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const deleteRecord = async (recordId) => {
  try {
    if (!recordId) throw new Error('Record ID is required');

    const response = await axios.delete(API_ENDPOINTS.RECORDS.DELETE(recordId), {
      headers: getAuthHeaders()
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to delete record');
    }

    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const scanForDuplicates = async (confidenceThreshold, selectedRecordIds = []) => {
  try {
    console.log('🔍 Starting duplicate scan with:', {
      confidenceThreshold,
      selectedRecordIds,
      timestamp: new Date().toISOString()
    });

    // First, trigger analysis for each selected record
    for (const recordId of selectedRecordIds) {
      console.log(`📤 Analyzing record: ${recordId}`);
      try {
        const analyzeResponse = await axios.post(
          API_ENDPOINTS.RECORDS.ANALYZE(recordId),
          { 
            threshold: confidenceThreshold,
            recordId: recordId
          },
          { 
            headers: getAuthHeaders()
          }
        );
        console.log(`✅ Analysis initiated for record ${recordId}:`, analyzeResponse.data);
      } catch (error) {
        console.error(`❌ Failed to analyze record ${recordId}:`, {
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
      }
    }

    // Wait a moment for analysis to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch duplicates for each record
    const duplicateResults = [];
    for (const recordId of selectedRecordIds) {
      try {
        console.log(`📥 Fetching duplicates for record: ${recordId}`);
        const response = await axios.get(
          API_ENDPOINTS.RECORDS.DUPLICATES.GET(recordId),
          {
            headers: getAuthHeaders(),
            params: { threshold: confidenceThreshold }
          }
        );

        if (response.data?.duplicates?.length > 0) {
          console.log(`✨ Found duplicates for record ${recordId}:`, response.data.duplicates);
          duplicateResults.push(...response.data.duplicates);
        } else {
          console.log(`ℹ️ No duplicates found for record ${recordId}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching duplicates for record ${recordId}:`, {
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
      }
    }

    // Process and return results
    const processedResults = duplicateResults.map(duplicate => ({
      id: duplicate._id || duplicate.id,
      confidence: duplicate.confidence || duplicate.score || confidenceThreshold,
      files: [
        {
          id: duplicate.sourceId || duplicate._id,
          fileName: duplicate.sourceName || 'Source File',
          department: duplicate.department || 'Unspecified',
          uploadedAt: duplicate.uploadedAt || new Date().toISOString(),
          matchedFields: duplicate.matchedFields || []
        },
        {
          id: duplicate.targetId,
          fileName: duplicate.targetName || 'Target File',
          department: duplicate.targetDepartment || 'Unspecified',
          uploadedAt: duplicate.targetUploadedAt || new Date().toISOString(),
          matchedFields: duplicate.matchedFields || []
        }
      ]
    }));

    console.log('🏁 Final processed results:', {
      totalDuplicates: processedResults.length,
      results: processedResults
    });

    return processedResults;
  } catch (error) {
    console.error('💥 Scan error:', {
      message: error.message,
      code: error.code,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }
    });
    throw new Error(error.response?.data?.message || error.message || 'Failed to scan for duplicates');
  }
};

export const downloadDuplicateReport = async (groupId) => {
  try {
    const response = await axios.get(
      API_ENDPOINTS.RECORDS.DUPLICATES.REPORT(groupId),
      {
        headers: getAuthHeaders(),
        responseType: 'blob'
      }
    );

    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `duplicate-report-${groupId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const checkDuplicates = async (recordId) => {
  try {
    const response = await axios.get(API_ENDPOINTS.DUPLICATES.CHECK(recordId), {
      headers: getAuthHeaders()
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to check duplicates');
    }

    return response.data;
  } catch (error) {
    throw new Error(handleApiError(error));
  }
};

export const pollDuplicateAnalysis = async (recordId, interval = 2000, maxAttempts = 30) => {
  if (!recordId) {
    throw new Error('Record ID is required for duplicate analysis');
  }

  let attempts = 0;
  
  const checkStatus = async () => {
    const record = await getRecordDetails(recordId);
    
    if (!record.duplicateAnalysis) {
      throw new Error('No duplicate analysis information available');
    }

    switch (record.duplicateAnalysis.status) {
      case 'completed':
        return {
          status: 'completed',
          duplicates: record.duplicateAnalysis.duplicates || [],
          lastAnalyzedAt: record.duplicateAnalysis.lastAnalyzedAt
        };
      case 'error':
        throw new Error(record.duplicateAnalysis.error || 'Duplicate analysis failed');
      case 'processing':
      case 'pending':
        if (attempts >= maxAttempts) {
          throw new Error('Timeout waiting for duplicate analysis');
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, interval));
        return checkStatus();
      default:
        throw new Error('Unknown analysis status');
    }
  };

  return checkStatus();
}; 