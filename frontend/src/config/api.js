// API Configuration
const API_BASE_URL = 'http://localhost:7000/api';

// API Endpoints configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  
  // Records endpoints
  RECORDS: {
    LIST: `${API_BASE_URL}/records`,
    UPLOAD: `${API_BASE_URL}/records/upload`,
    GET: (id) => `${API_BASE_URL}/records/${id}`,
    DELETE: (id) => `${API_BASE_URL}/records/${id}`,
    ANALYZE: (id) => `${API_BASE_URL}/records/${id}/analyze`,
    DUPLICATES: {
      GET: (id) => `${API_BASE_URL}/records/${id}/duplicates`
    }
  },
  
  // User endpoints
  USER: {
    PROFILE: `${API_BASE_URL}/user/profile`,
    UPDATE: `${API_BASE_URL}/user/update`
  }
};

// Default headers configuration
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  mode: 'cors',
  timeout: 30000, // 30 seconds timeout
};

// Get authentication headers
export const getAuthHeaders = (contentType = 'application/json') => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': contentType,
    'Accept': contentType === 'application/json' ? 'application/json' : '*/*',
  };
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    return error.response.data?.message || 'An error occurred';
  } else if (error.request) {
    return 'No response from server. Please check your connection.';
  }
  return error.message || 'Network error occurred';
};

// Helper function to check server health
export const checkServerHealth = async () => {
  try {
    console.log('Checking server health...');
    const response = await fetch(`${API_BASE_URL}/health`, {
      ...API_CONFIG,
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Server health check failed');
    }
    
    const data = await response.json();
    console.log('Server health response:', data);
    
    return {
      status: data.status === 'ok',
      dbStatus: data.dbStatus,
      message: data.message
    };
  } catch (error) {
    console.error('Server health check failed:', error);
    return {
      status: false,
      dbStatus: 'disconnected',
      message: error.message
    };
  }
};
