import { API_ENDPOINTS } from '../config/api';
import { getAuthHeaders } from '../config/api';

export const datasetService = {
  // Fetch all datasets with optional filters
  async getDatasets(params = {}) {
    try {
      console.log('Fetching datasets with params:', params);
      const queryParams = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.GET_FILES}${queryParams ? `?${queryParams}` : ''}`;
      console.log('Fetching from URL:', url);

      const headers = getAuthHeaders();
      console.log('Using headers:', headers);

      const response = await fetch(url, {
        headers: headers,
        credentials: 'include'
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
  async uploadDataset(formData) {
    try {
      console.log('Uploading dataset...');
      
      // Get auth headers but remove Content-Type as FormData will set it
      const headers = getAuthHeaders();
      delete headers['Content-Type'];
      
      console.log('Upload headers:', headers);
      
      const response = await fetch(API_ENDPOINTS.UPLOAD_FILE, {
        method: 'POST',
        headers: headers,
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload response:', data);
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Get dataset details
  async getDatasetDetails(id) {
    try {
      const response = await fetch(`${API_ENDPOINTS.GET_FILES}/${id}`, {
        headers: getAuthHeaders(),
        credentials: 'include'
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
      const response = await fetch(`${API_ENDPOINTS.GET_FILES}/${id}/download`, {
        headers: getAuthHeaders(),
        credentials: 'include'
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
      const response = await fetch(`${API_ENDPOINTS.GET_FILES}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
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