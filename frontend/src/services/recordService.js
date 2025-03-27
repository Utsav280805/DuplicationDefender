import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { getAuthHeaders } from '../config/api';

export const getAllRecords = async () => {
  try {
    console.log('Fetching records from:', API_ENDPOINTS.RECORDS);
    
    const response = await axios.get(API_ENDPOINTS.RECORDS, {
      headers: getAuthHeaders()
    });

    console.log('Raw API response:', JSON.stringify(response.data, null, 2));

    if (!response.data || !response.data.success) {
      console.error('API request failed:', response.data);
      throw new Error(response.data?.message || 'Failed to fetch records');
    }

    const records = response.data.records;
    if (!Array.isArray(records)) {
      console.error('Records is not an array:', records);
      return [];
    }

    console.log('Records from API:', records);

    // Map the records to ensure all fields are properly displayed
    const processedRecords = records.map(record => {
      console.log('Processing record:', record);
      return {
        _id: record._id,
        fileName: record.originalName || record.fileName || 'Unnamed File',
        fileType: record.fileType || 'Unknown',
        fileSize: parseInt(record.fileSize) || 0,
        department: record.department || 'Unspecified',
        description: record.description || '',
        tags: record.tags || [],
        uploadedAt: record.uploadedAt || record.createdAt || new Date().toISOString(),
        duplicateAnalysis: {
          status: record.duplicateAnalysis?.status || 'pending',
          duplicatesCount: record.duplicateAnalysis?.duplicatesCount || 0,
          lastAnalyzedAt: record.duplicateAnalysis?.lastAnalyzedAt
        }
      };
    });

    console.log('Processed records:', processedRecords);
    return processedRecords;
  } catch (error) {
    console.error('Error fetching records:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

export const uploadFile = async (file, department, description = '', tags = []) => {
  const formData = new FormData();
  
  // Add file metadata
  formData.append('file', file);
  formData.append('department', department);
  formData.append('description', description);
  formData.append('tags', JSON.stringify(tags));

  console.log('Preparing to upload file:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    department,
    description,
    tags
  });

  try {
    const response = await axios.post(API_ENDPOINTS.UPLOAD, formData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });
    
    console.log('Upload response:', response.data);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Upload failed');
    }

    const recordData = response.data.data;
    
    // Return the record data with all necessary fields
    return {
      _id: recordData.id || recordData.recordId,
      fileName: file.name,
      originalName: file.name,
      fileType: file.type,
      fileSize: file.size,
      department: department,
      description: description,
      tags: tags,
      uploadedAt: new Date().toISOString(),
      duplicateAnalysis: {
        status: recordData.duplicateAnalysis?.status || 'processing',
        duplicatesCount: 0,
        lastAnalyzedAt: recordData.duplicateAnalysis?.lastAnalyzedAt
      }
    };
  } catch (error) {
    console.error('Upload error details:', error.response?.data || error);
    if (error.response?.data?.message) {
      throw new Error(`Upload failed: ${error.response.data.message}`);
    }
    throw error;
  }
};

export const checkDuplicates = async (recordId) => {
  try {
    const response = await axios.get(`${API_ENDPOINTS.DUPLICATES}/${recordId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to check duplicates');
    }
    throw error;
  }
};

export const getRecordDetails = async (recordId) => {
  if (!recordId) {
    throw new Error('Record ID is required');
  }
  
  try {
    const response = await axios.get(`${API_ENDPOINTS.RECORDS}/${recordId}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to get record details');
    }
    
    return response.data.record;
  } catch (error) {
    console.error('Get record error:', error);
    if (error.response?.data?.message) {
      throw new Error(`Failed to get record details: ${error.response.data.message}`);
    }
    throw error;
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

export const deleteRecord = async (recordId) => {
  if (!recordId) {
    throw new Error('Record ID is required');
  }

  try {
    const response = await axios.delete(`${API_ENDPOINTS.RECORDS}/${recordId}`, {
      headers: getAuthHeaders()
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete record');
    }

    return response.data;
  } catch (error) {
    console.error('Delete record error:', error);
    if (error.response?.data?.message) {
      throw new Error(`Failed to delete record: ${error.response.data.message}`);
    }
    throw error;
  }
}; 