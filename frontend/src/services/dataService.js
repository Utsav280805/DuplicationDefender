import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, handleApiError } from '../config/api';

// Upload file with metadata
export const uploadFile = async (file, metadata) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', metadata.department);
    formData.append('description', metadata.description);
    formData.append('tags', metadata.tags.join(','));

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_FILE}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get all files with filtering and pagination
export const getFiles = async (params = {}) => {
  try {
    const {
      department = 'All Departments',
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = params;

    const queryParams = new URLSearchParams({
      department: department === 'All Departments' ? '' : department,
      ...(status && { status }),
      sortBy,
      sortOrder,
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_FILES}?${queryParams}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Delete file
export const deleteFile = async (fileId) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DELETE_FILE}/${fileId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Analyze file for duplicates
export const analyzeFile = async (fileId) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ANALYZE_FILE}/${fileId}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to analyze file');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Get all duplicates
export const getDuplicates = async (searchQuery = '', matchConfidence = 0.8) => {
  try {
    const queryParams = new URLSearchParams({
      search: searchQuery,
      matchConfidence: matchConfidence
    });

    const response = await fetch(
      `${API_ENDPOINTS.DUPLICATES}?${queryParams}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch duplicates');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching duplicates:', error);
    throw error;
  }
};

// Get duplicate detection rules
export const getDuplicateRules = async () => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.RECORDS}/rules`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch rules');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }
};

// Update duplicate detection rules
export const updateDuplicateRules = async (rules) => {
  try {
    const response = await fetch(
      `${API_ENDPOINTS.RECORDS}/rules`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rules })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update rules');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating rules:', error);
    throw error;
  }
};