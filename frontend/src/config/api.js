// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
  
  // Keep existing endpoints unchanged
  RECORDS: `${API_BASE_URL}/api/records`,
  UPLOAD: `${API_BASE_URL}/api/records/upload`,
  DUPLICATES: `${API_BASE_URL}/api/records/duplicates`,
  USER_PROFILE: `${API_BASE_URL}/api/user/profile`,
};

export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  mode: 'cors'
};

// Get auth headers with token
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No auth token found in localStorage');
    return API_CONFIG.headers;
  }
  console.log('Using auth token:', token.substring(0, 20) + '...');
  return {
    ...API_CONFIG.headers,
    'Authorization': `Bearer ${token}`
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

// Helper function to check if the server is running
export const checkServerHealth = async () => {
  try {
    console.log('Checking server health...');
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      ...API_CONFIG,
      method: 'GET',
    });
    const data = await response.json();
    console.log('Server health response:', data);
    return data.status === 'ok';
  } catch (error) {
    console.error('Server health check failed:', error);
    return false;
  }
};
