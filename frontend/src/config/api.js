// API Configuration
const API_BASE_URL = 'http://localhost:7000/api';

// API Endpoints configuration
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    PROFILE: `${API_BASE_URL}/auth/profile`
  },
  RECORDS: {
    LIST: `${API_BASE_URL}/records`,
    UPLOAD: `${API_BASE_URL}/records/upload`,
    DETAILS: (id) => `${API_BASE_URL}/records/${id}`,
    DELETE: (id) => `${API_BASE_URL}/records/${id}`,
    ANALYZE: (id) => `${API_BASE_URL}/records/${id}/analyze`,
    DUPLICATES: {
      LIST: `${API_BASE_URL}/records/duplicates`,
      GET: (id) => `${API_BASE_URL}/records/${id}/duplicates`,
      REPORT: (id) => `${API_BASE_URL}/records/${id}/report`
    }
  },
  USER: {
    PROFILE: `${API_BASE_URL}/user/profile`,
  },
  HEALTH: `${API_BASE_URL}/health`,
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

// Helper function to check server health
export const checkServerHealth = async () => {
  try {
    console.log('Checking server health...');
    const response = await fetch(API_ENDPOINTS.HEALTH, {
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

// Enhanced API error handler
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || 'Server error occurred';
    if (error.response.status === 401) {
      return 'Session expired. Please login again.';
    }
    if (error.response.status === 404) {
      return 'The requested resource was not found.';
    }
    return message;
  }
  
  if (error.request) {
    // Request made but no response received
    return 'Unable to connect to server. Please check your internet connection.';
  }
  
  // Error setting up the request
  return error.message || 'An unexpected error occurred.';
};

// Format validation errors
export const formatValidationErrors = (errors) => {
  if (!errors) return {};
  
  return Object.entries(errors).reduce((acc, [key, value]) => {
    acc[key] = Array.isArray(value) ? value[0] : value;
    return acc;
  }, {});
};
