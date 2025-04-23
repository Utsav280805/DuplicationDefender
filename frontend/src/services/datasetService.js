import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import authService from './authService';

const getAuthToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return token;
};

export const datasetService = {
  // Fetch all datasets with optional filters
  async getDatasets(params = {}) {
    try {
      console.log('Fetching datasets with params:', params);
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.GET_FILES}${queryParams ? `?${queryParams}` : ''}`;
      console.log('Fetching from URL:', url);

      const token = getAuthToken();
      const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      console.log('Using headers:', headers);

      const response = await fetch(url, {
        headers: headers
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch datasets');
      }
      
      const data = await response.json();
      console.log('Fetch response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching datasets:', error);
      throw error;
    }
  },

  // Upload a new dataset
  async uploadDataset(file, metadata, callbacks = {}) {
    console.log('Uploading dataset...');
    const uploadId = Date.now().toString();
    
    // Create EventSource for progress updates
    const eventSource = new EventSource(`${API_ENDPOINTS.UPLOAD_PROGRESS}/${uploadId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress' && callbacks.onUploadProgress) {
        callbacks.onUploadProgress(data.progress);
      } else if (data.type === 'console' && callbacks.onConsoleLog) {
        callbacks.onConsoleLog(data.message);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', metadata.fileType || 'unknown');
      formData.append('description', metadata.description || '');
      formData.append('tags', metadata.tags ? metadata.tags.join(',') : '');
      formData.append('uploadId', uploadId);

      const response = await fetch(API_ENDPOINTS.UPLOAD_FILE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      eventSource.close();
      return data;
    } catch (error) {
      eventSource.close();
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Get dataset details
  async getDatasetDetails(id) {
    try {
      const token = getAuthToken();
      const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_ENDPOINTS.GET_FILES}/${id}`, {
        headers: headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get dataset details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting dataset details:', error);
      throw error;
    }
  },

  // Download a dataset
  async downloadDataset(id) {
    try {
      const token = getAuthToken();
      const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_ENDPOINTS.GET_FILES}/${id}/download`, {
        headers: headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Download failed');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  // Delete a dataset
  async deleteDataset(id) {
    try {
      const token = getAuthToken();
      const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_ENDPOINTS.GET_FILES}/${id}`, {
        method: 'DELETE',
        headers: headers
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }
};

export default datasetService;