import axios from 'axios';
import { API_ENDPOINTS, getAuthHeaders, handleApiError } from '../config/api';

const API_BASE_URL = 'http://localhost:8081/api';

// For generating unique IDs for duplicate groups
const crypto = {
  randomUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

export const getAllRecords = async () => {
  try {
    const response = await axios.get('/api/records', {
      headers: getAuthHeaders()
    });

    return response.data.records || [];
  } catch (error) {
    console.error('Error fetching records:', error);
    throw error;
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
    console.error('Error uploading file:', error);
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

export const scanForDuplicates = async (recordIds) => {
    try {
        console.log('Starting duplicate scan for records:', recordIds);
        const response = await axios.post(`${API_BASE_URL}/records/scan-duplicates`, {
            recordIds: recordIds
        }, {
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error in scanForDuplicates:', error);
        throw error;
    }
};

export const downloadDuplicateReport = async (recordId) => {
    try {
        if (!recordId) {
            throw new Error('No record ID provided for download');
        }

        const response = await axios.get(`/api/records/${recordId}/duplicates`, {
            headers: getAuthHeaders(),
            responseType: 'blob'
        });

        const blob = new Blob([response.data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `duplicates_${recordId}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { success: true };
    } catch (error) {
        console.error('Error in downloadDuplicateReport:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to download duplicate report');
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