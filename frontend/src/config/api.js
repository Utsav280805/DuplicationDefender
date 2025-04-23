
// API Base URL
export const API_BASE_URL = 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,
  RESEND_VERIFICATION: `${API_BASE_URL}/api/auth/resend-verification`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
  GET_ME: `${API_BASE_URL}/api/auth/me`,
  
  // File endpoints
  GET_FILES: `${API_BASE_URL}/api/files`,
  UPLOAD_FILE: `${API_BASE_URL}/api/files/upload`,
  UPLOAD_PROGRESS: `${API_BASE_URL}/api/files/upload-progress`,
  GET_FILE: `${API_BASE_URL}/api/files/:id`,
  DOWNLOAD_FILE: `${API_BASE_URL}/api/files/:id/download`,
  DELETE_FILE: `${API_BASE_URL}/api/files/:id`,
  CHECK_DUPLICATES: `${API_BASE_URL}/api/files/:id/check-duplicates`,
  ANALYZE_FILE: `${API_BASE_URL}/api/files/analyze`,
  HEALTH: `${API_BASE_URL}/api/health`,
  STATS: `${API_BASE_URL}/api/stats`,
  
  // User endpoints
  GET_USER_PROFILE: `${API_BASE_URL}/api/users/profile`,
  UPDATE_USER_PROFILE: `${API_BASE_URL}/api/users/profile`

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
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  mode: 'cors',
  credentials: 'include',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  mode: 'cors',
  timeout: 30000, // 30 seconds timeout
};

// Get authentication headers
export const getAuthHeaders = (contentType = 'application/json') => {
  const token = localStorage.getItem('token');
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': contentType,
    'Accept': contentType === 'application/json' ? 'application/json' : '*/*',
  };

  if (token) {
    console.log('Adding auth token to headers:', token);
    headers['Authorization'] = `Bearer ${token}`;
  } 
  else{
    console.warn('No authentication token found');
  }

  return headers;
};

// Helper function to handle API errors
export const handleApiError = async (response) => {
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'API request failed');
  }
  return response;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Helper function to check if the server is running
export const checkServerHealth = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.HEALTH, {
      ...API_CONFIG,
      method: 'GET',
    });
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
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
